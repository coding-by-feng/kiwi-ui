<script>
import {getStore} from '@/util/store'
import msgUtil from '@/util/msg'
import util from '@/util/util'
import paraphraseStarList from '@/api/paraphraseStarList'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'
import audioUtil from '../../util/audioUtil'
import NoSleep from 'nosleep.js'

const playCountOnce = 20 // 复习模式每页加载的单词个数
const readCountOnce = 20 // 阅读模式每页加载的单词个数
const skipWorkSpellingIndexEn2Ch = 10
const skipWorkSpellingIndexEn2Ch_2nd = 17
const skipWorkSpellingIndexWhenLastIsSameEn2Ch = 4
const skipWorkSpellingIndexWhenLastIsSameEn2Ch_2nd = 11
const skipWorkSpellingIndexCh2En = 12
const skipWorkSpellingIndexCh2En_2nd = 19
const skipWorkSpellingIndexWhenLastIsSameCh2En = 7
const skipWorkSpellingIndexWhenLastIsSameCh2En_2nd = 14
const audioVolumesEn2Ch = [0.3, 0.3, 1, 1, 1, 0.3, 0.3, 1, 1, 1, 0.3, 1, 1, 1, 1, 1, 1, /*examples*/]
const audioVolumesEn2ChWhenLastIsSame = [0.3, 0.3, 0.3, 0.3, 0.3, 1, 1, 1, 1, 1, 1, /*examples*/]

let that
let noSleep

const buildNotGlobalLoading = function () {
  return that.$loading({
    lock: true,
    text: `正在加载`,
    spinner: 'el-icon-loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
}

export default {
  name: 'paraphraseStarListDetail',
  props: {
    tableVisibleToggle: {
      type: Function
    },
    listId: Number,
    listName: String,
    isShowParaphrase: {
      type: Boolean,
      default: false
    },
    isReview: {
      type: Boolean,
      default: false
    },
    reviewMode: {
      type: String
    },
    isChToEn: {
      type: Boolean,
      default: false
    }
  },
  components: {
    Countdown: () => import('./Countdown')
  },
  data() {
    return {
      loading: false,
      innerHeightPx: window.innerHeight + 'px',
      innerHeightSleepModePx: window.innerHeight * 9 / 10 + 'px',
      innerWidthPx: window.innerWidth + 'px',
      innerWidthHalfPx: window.innerWidth / 2 + 'px',
      page: {
        current: 1,
        size: readCountOnce,
        total: 0,
        pages: 0
      },
      isShowPagination: true,
      detail: {
        reviewLoading: false,
        paraphraseVO: {},
        dialogVisible: false,
        showTranslation: !getStore({name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN}),
        showWord: true,
        hideTranslationPrompt: '释义已隐藏，点击灰暗区域隐藏/显示',
        playIndex: 0,
        showIndex: 0,
        isSleepMode: false,
        listId: null,
        firstReviewWord: null,
        secondReviewWord: null,
        apiKey: null,
        audioPlayerUrls: [],
        audioPlayerMap: new Map(),
        audioPlayer: null,
        audioPlayerToken: null,
        isUnfoldOperateIcon: false,
        isEnableNoSleepMode: false,
        skippedCount: 0,
      },
      isUKPronunciationPlaying: false,
      isUSPronunciationPlaying: false,
      source: getStore({name: 'pronunciation_source'}),
      reviewType: getStore({name: 'review_type'}),
      spellType: getStore({name: 'spell_type'}),
      enParaType: getStore({name: 'enPara_type'}),
      isPlayExample: getStore({name: 'is_play_example'}),
      listItems: [],
      autoPlayDialogVisible: 0,
      isFirstIncome: true,
      reviseAudioCandidates: [],
      isReviewStop: false,
      isReviewPlaying: false,
      playWordIndex: -1,

      countdownMode: false,
      countdownTime: new Date().getTime(),
      countdownMin: 60,
      countdownText: '1小时'
    }
  },
  beforeCreate: function () {
    that = this
    noSleep = new NoSleep()
  },
  async mounted() {
    await this.init()
    this.listenerMinBrowser()
  },
  destroyed() {
    if (this.detail.audioPlayer) {
      this.pauseAllPalyingAudio()
      this.detail.audioPlayer = null
      noSleep.disable()
      this.detail.isEnableNoSleepMode = false
    }
  },
  watch: {
    'listId'() {
      this.init()
    },
    'playWordIndex'(newVal) {
      console.log('this.playWordIndex = ' + this.playWordIndex)
      // noinspection JSVoidFunctionReturnValueUsed
      if (this.isNeedStopReview() || this.isReviewPlaying || newVal === 0) {
        return
      }

      this.skipCurrent()
    },
    'countdownMode'(newVal) {
      if (newVal) {
        this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
      }
    }
  },
  computed: {
    showPreviousPageIcon() {
      return !this.detail.isUnfoldOperateIcon && this.page.current >= 1
    },
    showNextPageIcon() {
      return !this.detail.isUnfoldOperateIcon && this.page.current < this.page.pages
    },
    showWordSpelling() {
      return this.detail.showWord ? this.detail.paraphraseVO.wordName : '点击切换是否显示单词'
    },
    isDownloadReviewAudio() {
      return this.reviewMode === kiwiConst.REVIEW_MODEL.DOWNLOAD_REVIEW_AUDIO
    },
    isStockReviewModel() {
      return this.detail.paraphraseVO.paraphraseId && (this.reviewMode === kiwiConst.REVIEW_MODEL.STOCK_REVIEW
          || this.reviewMode === kiwiConst.REVIEW_MODEL.STOCK_READ)
    },
    isEnhanceReviewModel() {
      return this.detail.paraphraseVO.paraphraseId && (this.reviewMode === kiwiConst.REVIEW_MODEL.ENHANCE_REVIEW
          || this.reviewMode === kiwiConst.REVIEW_MODEL.ENHANCE_READ)
    },
    enableOperationIcon() {
      return (this.isReview && !this.detail.isSleepMode && !this.isFirstIncome) || !this.isReview
    },
    enableShowDetailIcon() {
      return !this.detail.isUnfoldOperateIcon && !this.detail.dialogVisible && this.detail.paraphraseVO.paraphraseId
    },
    enableStopwatchIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview
    },
    enableShowPreviousIcon() {
      return !this.detail.isUnfoldOperateIcon && !this.isReview
    },
    enableShowNextIcon() {
      return !this.detail.isUnfoldOperateIcon
    },
    enableSleepModeIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview && this.detail.dialogVisible
    },
    enableStopPlayingIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview && !this.isReviewStop
    },
    enableRefreshReviseDetailIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview && this.isReviewStop && !this.isReviewPlaying
    },
    enableSkipSomeAudioIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview
    },
    enableFirstIncomeReviewMode() {
      return this.isFirstIncome && this.isReview && !this.isReviewStop
    },
    enableParaphraseExamples() {
      return this.detail.paraphraseVO.exampleVOList && this.detail.paraphraseVO.exampleVOList.length < 1
    },
    isListItemsNotEmpty() {
      return this.listItems && this.listItems.length > 0
    },
  },
  methods: {
    ...paraphraseStarList,
    ...msgUtil,
    listenerMinBrowser() {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          that.isReviewStop = true
          that.isReviewPlaying = false
          that.pauseAllPalyingAudio()
        } else {
          that.isReviewStop = false
          that.isReviewPlaying = true
        }
        console.log('visibilitychange isReviewStop=' + that.isReviewStop)
        console.log('visibilitychange isReviewPlaying=' + that.isReviewPlaying)
      })
    },
    async init() {
      console.log('init...')
      try {
        this.loading = true
        if (this.isReview) {
          // clean data
          await this.cleanInitRevising()
          this.enableNoSleepMode()

          try {
            await this.initList()
            await this.initNextReviseDetail(true)
          } catch (e) {
            console.error(e)
            this.msgError(this, '列表初始化异常，请刷新重试')
            this.loading = false
            return
          }

          // alert('Initial finished')

          if (!this.isFirstIncome && !this.isDownloadReviewAudio) {
            this.autoPlayDialogVisible++ // 只有第一次进入复习需要手动触发
            this.notifySuccess(this, '复习模式', '即将开始复习，请稍等！')
          }

          // 手动触发过的直接播放即可
          if (this.autoPlayDialogVisible > 1) {
            if (this.isListItemsNotEmpty) {
              await this.showDetail(this.listItems[0].paraphraseId, 0)
            }
            if (this.isDownloadReviewAudio) {
              ++this.playWordIndex
            } else {
              // alert('this.detail.audioPlayer.play()')
              this.detail.audioPlayer.play()
            }
          } else {
            if (this.isDownloadReviewAudio) {
              this.playWordIndex = this.detail.audioPlayerUrls.length;
            } else {
              this.stockReviewStart()
            }
          }
        } else {
          await this.initList()
          if (this.isListItemsNotEmpty) {
            await this.showDetail(this.listItems[0].paraphraseId, 0)
          }
        }
      } catch (e) {
        console.error(e)
        this.msgError(this, '初始化异常')
      } finally {
        this.loading = false
      }
    },
    async getReviewBreakpointPageNumber() {
      if (this.isFirstIncome && this.isReview) {
        await review.getReviewBreakpointPageNumber(this.listId)
            .then(response => {
              this.page.current = response.data.data
              this.isShowPagination = false
              setTimeout(() => {
                this.isShowPagination = true
              }, 1)
            })
      }
    },
    async initStockListFun() {
      await this.getReviewBreakpointPageNumber()
      await this.getReviewListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
        this.page.current = response.data.data.current
      }).catch(e => {
        console.error(e)
      })
    },
    async initEnhanceListFun() {
      await this.getReviewBreakpointPageNumber()
      await this.getEnhanceListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
        this.page.current = response.data.data.current
      }).catch(e => {
        console.error(e)
      })
    },
    async initDefaultListFun() {
      await this.getListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
        this.page.current = response.data.data.current
      }).catch(e => {
        console.error(e)
      })
    },
    async initList() {
      console.log('initList')
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        // 复习模式每页只加载5个单词
        this.page.size = playCountOnce
        await this.initStockListFun()
        return
      } else if (this.reviewMode === 'totalReview' || this.reviewMode === 'totalRead') {
        // 全量模式也只查5个
        await this.getReviewBreakpointPageNumber()
        this.page.size = playCountOnce
      } else if (this.reviewMode === 'enhanceReview' || this.reviewMode === 'enhanceRead') {
        // 复习模式每页只加载5个单词
        this.page.size = playCountOnce
        await this.initEnhanceListFun()
        return
      }
      await this.initDefaultListFun()
    },
    goBack() {
      this.$emit('tableVisibleToggle')
    },
    isLastReviewWordSame() {
      console.log('this.detail.firstReviewWord', this.detail.firstReviewWord)
      console.log('this.detail.secondReviewWord', this.detail.secondReviewWord)
      return this.detail.firstReviewWord === this.detail.secondReviewWord
    },
    handoffReviewWordSame() {
      console.log('this.detail.firstReviewWord', this.detail.firstReviewWord)
      console.log('this.detail.secondReviewWord', this.detail.secondReviewWord)
      this.detail.firstReviewWord = this.detail.secondReviewWord
      this.detail.secondReviewWord = this.detail.paraphraseVO.wordName
    },
    async initNextReviseDetail(isGetDetail) {
      console.log('initNextReviewDetail this.playWordIndex = ' + this.playWordIndex)
      console.log('initNextReviewDetail this.listItems[this.playWordIndex] = ' + this.listItems[this.playWordIndex])
      let loading = buildNotGlobalLoading()
      this.prepareReview()
      if (isGetDetail) {
        this.handoffReviewWordSame()
        await this.getItemDetail(this.listItems[this.playWordIndex].paraphraseId)
            .then(response => {
              this.detail.paraphraseVO = response.data.data
              if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
                this.detail.paraphraseVO.wordCharacter = kiwiConst.WORD_CHARACTER.PHRASE
              }
            })
            .catch(e => {
              console.error(e)
            })
      }
      await this.createReviseQueue(this.detail.audioPlayerToken)
          .then(() => {
            // alert('createReviseQueue success')
            this.detail.audioPlayer = this.getCurrentAudioPlayer(0)
          })
          .catch(e => {
            throw e
          })
      loading.close()
    },
    async showDetail(paraphraseId, index) {
      let loading = buildNotGlobalLoading()
      if (null !== index && undefined !== index) {
        this.detail.showIndex = index
      }
      this.handoffReviewWordSame()
      await this.getItemDetail(paraphraseId)
          .then(response => {
            this.detail.paraphraseVO = response.data.data
            if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
              this.detail.paraphraseVO.wordCharacter = kiwiConst.WORD_CHARACTER.PHRASE
            }
            // 如果是复习最近收藏
            this.detail.listId = this.listItems[this.detail.showIndex].listId
            loading.close()
          }).catch(e => {
            console.error(e)
            that.msgError(that, '加载释义详情异常')
            loading.close()
          })

      this.detail.dialogVisible = true

      if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
        this.detail.reviewLoading = true
      }
      // noinspection ES6MissingAwait
      review.increaseCounter(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
    },

    async showDetailNotLoadData() {
      console.log('showDetailNotLoadData')
      this.detail.dialogVisible = true
      if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
        this.detail.reviewLoading = true
      }

      // noinspection ES6MissingAwait
      review.increaseCounter(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
    },

    async removeParaphraseStarListFun(paraphraseId, listId) {
      this.$confirm('即将进行删除, 是否继续?', '删除操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.removeParaphraseStar({paraphraseId: paraphraseId, listId: listId})
            .then(() => {
              this.operateSuccess(this)
              this.initList()
            })
            .catch(e => {
              console.error(e)
              that.msgError(that, '删除单词收藏操作异常')
            })
      })
    },
    handleDetailClose() {
      this.detail.dialogVisible = false
    },
    handleShowDetail() {
      this.detail.dialogVisible = false
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: {active: 'search', word: this.detail.paraphraseVO.wordName}
      })
    },
    async pageChange() {
      this.isFirstIncome = false
      await this.init()
    },
    switchSleepMode() {
      this.detail.isSleepMode = !this.detail.isSleepMode
      if (this.detail.isSleepMode) {
        this.notifySuccess(this, '睡眠模式', '睡眠模式已开启')
      } else {
        this.notifySuccess(this, '操作提示', '睡眠模式已关闭')
      }
    },
    switchStopWatchMode() {
      this.countdownMode = !this.countdownMode
      if (this.countdownMode) {
        this.notifySuccess(this, '操作提示', '倒计时模式已经开启')
      } else {
        this.notifySuccess(this, '操作提示', '倒计时模式已经关闭')
      }
    },
    async playPronunciation(id, sourceUrl, soundmarkType) {
      if (this.isReview) {
        this.msgWarning(this, '自动复习期间不允许播放音标')
        return
      }
      try {
        if (soundmarkType) {
          if (this.isUKPronunciationPlaying || this.isUSPronunciationPlaying) {
            return
          }
          if (soundmarkType === 'UK') {
            this.isUKPronunciationPlaying = true
          } else {
            this.isUSPronunciationPlaying = true
          }
        }
        let audio = this.createNewAudio()
        if (this.source === kiwiConst.PRONUNCIATION_SOURCE.LOCAL) {
          audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        } else {
          audio.src = sourceUrl
        }
        audio.pause()
        audio.loop = false
        await audio.play()
      } catch (e) {
        console.error(e)
      } finally {
        setTimeout(() => {
          if (soundmarkType) {
            this.isUSPronunciationPlaying = false
            this.isUKPronunciationPlaying = false
          }
        }, 1)
      }
    },
    enableNoSleepMode() {
      if (!this.detail.isEnableNoSleepMode) {
        this.detail.isEnableNoSleepMode = true
        noSleep.enable()
      }
    },
    stockReviewStart() {
      try {
        // alert('stockReviewStart ')
        this.playWordIndex = 0
        this.autoPlayDialogVisible++
        this.isFirstIncome = false
        if (this.isChToEn) {
          this.detail.showTranslation = true
        }
        this.showDetail(this.listItems[0].paraphraseId, 0)
            .then(() => {
              that.detail.audioPlayer.play()
              // alert('audioPlayer')
            })
      } catch (e) {
        // alert('test' + e)
        console.error(e)
      }
    },
    async recursiveReview() {
      await this.showDetail(this.listItems[this.playWordIndex].paraphraseId, this.playWordIndex)
      await this.initNextReviseDetail(false)
          .then(() => {
            if (this.isDownloadReviewAudio) {
              ++that.playWordIndex
            } else {
              that.detail.audioPlayer.play()
            }
          })
    },
    getPronunciationVO: function (isUS) {
      let isExistUS = this.detail.paraphraseVO.pronunciationVOList[1]
      return isUS && isExistUS ? this.detail.paraphraseVO.pronunciationVOList[1] : this.detail.paraphraseVO.pronunciationVOList[0]
    },
    getPronunciationUrl: function (first) {
      if (this.source === kiwiConst.PRONUNCIATION_SOURCE.LOCAL) {
        return '/wordBiz/word/pronunciation/downloadVoice/' + first.pronunciationId
      } else {
        return first.sourceUrl
      }
    },
    assemblePronunciationUrl(isUS) {
      if (!this.detail.paraphraseVO.pronunciationVOList || this.detail.paraphraseVO.pronunciationVOList.length < 1) {
        return audioUtil.assembleReviseAudioUrl(this.detail.paraphraseVO.wordId, kiwiConst.REVIEW_AUDIO_TYPE.PHRASE_PRONUNCIATION)
      }
      return this.getPronunciationUrl(this.getPronunciationVO(isUS))
    },
    createNewAudio() {
      let audio = new Audio()
      audio.volume = 0.7
      audio.loop = false
      audio.preload = 'auto'
      this.reviseAudioCandidates.push(audio)
      return audio
    },
    isNeedStopReview() {
      console.log('this.isReviewStop = ' + this.isReviewStop)
      return this.isReviewStop || !this.isReview || this.playWordIndex < 0
    },
    async stopPlaying() {
      if (!this.isFirstIncome) {
        this.notifySuccess(this, '操作提示', '停止播放当前复习的单词')
      }
      this.isReviewStop = true
      this.isReviewPlaying = false
      this.pauseAllPalyingAudio()
    },
    async ignoreCurrentReview() {
      console.log('ignoreCurrentReview')
      this.notifySuccess(this, '操作提示', `${this.isDownloadReviewAudio ? '下载' : '复习'}下一个单词`)
      await this.cleanDetailRevising()
      this.isReviewStop = false
    },
    async rememberInSleepMode(ignoreDoubleClick) {
      if (ignoreDoubleClick) {
        return
      }
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        await this.rememberOneFun()
      } else {
        await this.keepInMindFun()
      }
    },
    previousPageFun() {
      this.page.current--
      this.pageChange()
    },
    nextPageFun() {
      this.page.current++
      this.pageChange()
    },
    async rememberOneFun() {
      this.notifySuccess(this, '操作提示', '正在标记标记单词已经记住')
      await this.rememberOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            that.notifySuccess(that, '操作提示', '操作成功')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            that.msgError(that, '记住单词操作异常')
          })
    },
    async keepInMindFun() {
      this.notifySuccess(this, '操作提示', '正在标记标记单词已经牢记')
      await this.keepInMind(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            that.notifySuccess(that, '操作提示', '操作成功')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            that.msgError(that, '牢记单词操作异常')
          })
    },
    async forgetOneFun() {
      this.notifySuccess(this, '操作提示', '正在标记标记单词已经忘记')
      await this.forgetOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            that.notifySuccess(that, '操作提示', '操作成功')
            that.showNext(false)
          })
          .catch(e => {
            console.error(e)
            that.msgError(that, '忘记单词操作异常')
          })
    },
    countdownSelectHandle(command) {
      this.countdownText = command.text
      this.countdownMin = command.m
      this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
    },
    countdownEndFun() {
      this.countdownMode = !this.countdownMode
      noSleep.disable()
      this.detail.isEnableNoSleepMode = false
      window.location.reload()
    },
    async showPrevious() {
      if (this.detail.showIndex === 0) {
        if (this.page.current === 1) {
          this.msgWarning(this, '当前已经是第一页第一个')
          return
        }
        this.page.current--
        await this.init()
        this.detail.showIndex = this.page.size - 1
      } else {
        this.detail.showIndex--
      }
      await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
    },
    reviewNextWord: async function () {
      if (this.isReview) {
        if (this.detail.showIndex !== this.playWordIndex) {
          this.detail.showIndex = this.playWordIndex
        }
        this.detail.showIndex++
        this.playWordIndex++
      } else {
        this.detail.showIndex++
      }
      await this.skipCurrent()
    },
    pauseAllPalyingAudio() {
      if (this.detail.audioPlayer) {
        this.detail.audioPlayer.pause()
      }
      this.detail.audioPlayerMap.forEach((key, value) => {
        console.log('this.detail.audioPlayerMap key', key)
        console.log('this.detail.audioPlayerMap value', value)
        if (key.paused) {
          return
        }
        key.pause()
      })
    },
    skipSomeAudio: function () {
      console.log('skip some audio')
      this.pauseAllPalyingAudio()
      console.log('this.isLastReviewWordSame()', this.isLastReviewWordSame())
      const isFirstSkip = this.detail.skippedCount % 2 === 0
      this.detail.skippedCount++
      console.log('kiwi isFirstSkip', isFirstSkip)
      if (!this.isChToEn) {
        if (this.isLastReviewWordSame()) {
          const skipIndex = isFirstSkip ? skipWorkSpellingIndexWhenLastIsSameEn2Ch : skipWorkSpellingIndexWhenLastIsSameEn2Ch_2nd
          this.detail.playIndex = skipIndex
          this.detail.audioPlayer = this.getCurrentAudioPlayer(skipIndex)
        } else {
          const skipIndex = isFirstSkip ? skipWorkSpellingIndexEn2Ch : skipWorkSpellingIndexEn2Ch_2nd
          console.log('kiwi skipIndex', skipIndex)
          this.detail.playIndex = skipIndex
          this.detail.audioPlayer = this.getCurrentAudioPlayer(skipIndex)
        }
      } else {
        if (this.isLastReviewWordSame()) {
          const skipIndex = isFirstSkip ? skipWorkSpellingIndexWhenLastIsSameCh2En : skipWorkSpellingIndexWhenLastIsSameCh2En_2nd
          this.detail.playIndex = skipIndex
          this.detail.audioPlayer = this.getCurrentAudioPlayer(skipIndex)
        } else {
          const skipIndex = isFirstSkip ? skipWorkSpellingIndexCh2En : skipWorkSpellingIndexCh2En_2nd
          this.detail.playIndex = skipIndex
          this.detail.audioPlayer = this.getCurrentAudioPlayer(skipIndex)
        }
      }
      console.log('this.detail.audioPlayer', this.detail.audioPlayer)
      this.detail.audioPlayer.play()
    },
    async showNext(isSkipSomeAudio) {
      console.log('isSkipSomeAudio', isSkipSomeAudio)
      console.log('this.detail.isSleepMode', this.detail.isSleepMode)
      if (isSkipSomeAudio === false || isSkipSomeAudio === undefined) {
        await this.reviewNextWord();
      } else {
        this.skipSomeAudio();
      }
    },
    isLastIndexPerPage: function () {
      return this.playWordIndex >= playCountOnce
    },
    isLastPage: function () {
      return this.page.current >= this.page.pages
    },
    async skipCurrent() {
      console.log('skipCurrent')
      // alert('skipCurrent this.detail.showIndex = ' + this.detail.showIndex)
      // alert('skipCurrent this.playWordIndex = ' + this.playWordIndex)
      // alert('skipCurrent this.page.size = ' + this.page.size)
      try {
        if (this.isChToEn) {
          this.detail.showWord = false
        }
        let lastIndexPerPage = this.isLastIndexPerPage()
        let lastPage = this.isLastPage()
        // 最后一页条目数可能小于每页条目数
        console.log('skipCurrent wordName = ', this.detail.paraphraseVO.wordName)
        console.log('skipCurrent audioPlayerUrls = ', this.detail.audioPlayerUrls)
        console.log('skipCurrent audioPlayerMap = ', this.detail.audioPlayerMap)
        console.log('skipCurrent lastPage = ' + lastPage)
        console.log('skipCurrent this.playWordIndex = ' + this.playWordIndex)
        console.log('skipCurrent lastIndexPerPage = ' + lastIndexPerPage)
        console.log('skipCurrent this.detail.showIndex = ' + this.detail.showIndex)
        console.log('skipCurrent this.page.current = ' + this.page.current)
        console.log('skipCurrent this.page.size = ' + this.page.size)
        if (lastPage) {
          let lastPageRemainder = this.page.total % this.page.size
          if (lastIndexPerPage || (lastPageRemainder !== 0 && this.detail.showIndex === lastPageRemainder)) {
            this.msgWarning(this, '当前已经是最后一页最后一个')
            return
          }
        }
        if (lastIndexPerPage) {
          this.page.current++
          await this.init()
        } else {
          if (this.isReview) {
            await this.ignoreCurrentReview(true)
            // 每个单词播放前要计算播放audio数量，词组和单词不一样
            await this.initNextReviseDetail(true)
                .then(() => {
                  if (that.isDownloadReviewAudio) {
                    ++that.playWordIndex
                  } else {
                    that.detail.audioPlayer.play()
                  }
                }).catch(e => {
                  this.msgError(that, '初始化下一个释义详情异常!')
                  console.error('initNextReviseDetail error')
                  console.error(e)
                })
            await this.showDetailNotLoadData()
          } else {
            await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
          }
        }
      } catch (e) {
        alert('skipCurrent error.')
        console.error(e)
      }
    },
    async refreshReviseDetail() {
      this.notifySuccess(this, '操作提示', '正在刷新当前复习资源')
      await this.cleanDetailRevising()
      this.prepareReview()
      await this.recursiveReview()
    },
    async cleanRevising() {
      this.reviseAudioCandidates = []
      this.detail.firstReviewWord = null
      this.detail.secondReviewWord = null
      this.detail.paraphraseVO = {}
      this.detail.dialogVisible = false
      this.detail.audioPlayerToken = new Date().getTime()
      this.detail.audioPlayerMap.clear()
    },
    async cleanInitRevising() {
      // stop playing
      await this.stopPlaying()
      await this.cleanRevising()
      this.detail.showIndex = 0
      this.playWordIndex = 0
      this.listItems = []
      if (this.isChToEn) {
        this.detail.showWord = false
      }
    },
    prepareReview() {
      this.isReviewStop = false
    },
    async cleanDetailRevising() {
      await this.stopPlaying()
      await this.cleanRevising()
    },
    extractReviewAudioUrls: function () {
      console.log('this.isLastReviewWordSame() in extractReviewAudioUrls', this.isLastReviewWordSame())
      let paraphraseId = this.detail.paraphraseVO.paraphraseId
      let wordId = this.detail.paraphraseVO.wordId
      let wordCharacter = this.detail.paraphraseVO.wordCharacter
      let ukPronunciationUrl = this.assemblePronunciationUrl(false)
      let usPronunciationUrl = this.assemblePronunciationUrl(true)
      if (this.isDownloadReviewAudio) {
        let ch2EnUrls = audioUtil.extractedCh2EnUrls(this.isLastReviewWordSame(), paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, this.detail.paraphraseVO.exampleVOList)
        let en2ChUrls = audioUtil.extractedEn2ChUrls(this.isLastReviewWordSame(), paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, this.detail.paraphraseVO.exampleVOList)
        return util.mergeAndFilter(ch2EnUrls, en2ChUrls)
      } else {
        if (this.isChToEn) {
          return audioUtil.extractedCh2EnUrls(this.isLastReviewWordSame(), paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, this.detail.paraphraseVO.exampleVOList);
        } else {
          return audioUtil.extractedEn2ChUrls(this.isLastReviewWordSame(), paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, this.detail.paraphraseVO.exampleVOList);
        }
      }
    },
    getCurrentAudioPlayer: function (index) {
      return this.detail.audioPlayerMap.get(this.detail.audioPlayerUrls[index ? index : this.detail.playIndex])
    },
    setSoundListener: function (sound, token) {
      sound.addEventListener('ended', async function () {
        // that.notifySuccess(that, 'ended ' + i)

        that.isReviewPlaying = false
        if (that.isChToEn) {
          let sleepMs = audioUtil.acquireCh2EnIndexSleepMsMap().get(that.detail.playIndex)
          if (sleepMs) {
            that.notifySuccess(that, '倒计时提示', '停留3秒时间，请在脑海联想对应的单词或句子')
            await util.sleep(sleepMs)
                .then(() => {
                  if (that.detail.playIndex === 1) {
                    that.detail.showWord = true
                  }
                })
          }
        }
        if (token !== that.detail.audioPlayerToken || that.isReviewStop) {
          return
        }
        if (++that.detail.playIndex < that.detail.audioPlayerUrls.length) {
          that.detail.audioPlayer = that.getCurrentAudioPlayer()
          that.detail.audioPlayer.play()
        } else {
          // console.log('that.playWordIndex++ ' + that.playWordIndex)
          ++that.playWordIndex
        }
      })
      sound.addEventListener('play', function () {
        // console.log('onplay: ' + urls[that.detail.playIndex])
        // that.notifySuccess(that, 'play ' + i)
        that.isReviewPlaying = true
        that.detail.reviewLoading = false
      })
      // sound.addEventListener('loadstart', function () {
      //   that.notifySuccess(that, 'loadstart ' + i)
      // })
      // sound.addEventListener('playing', function () {
      //   that.notifySuccess(that, 'playing ' + i)
      // })
      // sound.addEventListener('readystatechange', function () {
      //   that.notifySuccess(that, 'readystatechange ' + i)
      // })
      sound.addEventListener('pause', function () {
        that.isReviewPlaying = false
      })
      sound.addEventListener('error', function () {
        // that.notifySuccess(that, 'error ' + i)
        that.isReviewPlaying = false
        that.detail.reviewLoading = false
      })
    },
    async createReviseQueue(token) {
      if (token !== this.detail.audioPlayerToken) {
        return []
      }

      if (this.isDownloadReviewAudio) {
        this.msgSuccess(this, `${this.detail.paraphraseVO.wordName} audio resources is downloading`, 4000);
      }

      let urls = this.extractReviewAudioUrls()
      console.log('extracting urls', urls)
      await audioUtil.rebuildUrls(urls)
      console.log('rebuildUrls', urls)

      this.detail.audioPlayerUrls = urls

      if (this.isDownloadReviewAudio) {
        let msg = `${this.detail.paraphraseVO.wordName} audio resources successfully downloaded`;
        this.msgSuccess(this, msg, 4000)
        console.log(msg)
      }

      this.detail.playIndex = 0
      for (let i = 0; i < this.detail.audioPlayerUrls.length; i++) {
        // noinspection JSUnusedGlobalSymbols
        let sound = this.detail.audioPlayerMap.get(urls[i]);
        console.log('this.detail.audioPlayerMap', this.detail.audioPlayerMap)
        console.log('this.detail.audioPlayerMap sound', sound)
        if (sound === null || sound === undefined) {
          sound = new Audio(urls[i])
          if (!this.isChToEn) {
            if (!this.isLastReviewWordSame() && i < audioVolumesEn2Ch.length) {
              sound.volume = audioVolumesEn2Ch[i]
            } else if (this.isLastReviewWordSame() && i < audioVolumesEn2ChWhenLastIsSame.length) {
              sound.volume = audioVolumesEn2ChWhenLastIsSame[i]
            }
          }
          sound.loop = false;
          this.setSoundListener(sound, token)

          console.log('this.detail.audioPlayerMap.set(urls[i], sound)', urls[i], sound)
          this.detail.audioPlayerMap.set(urls[i], sound)
        }
      }
    },

  }
}
</script>

<template>
  <div style="margin-top: 30px" v-loading="loading">
    <div style="z-index: 1;">
      <el-card v-if="isReview" class="box-card" style="background-color: #DCDFE6;">
        <div>
          <el-dropdown
              size="mini"
              split-button type="info" @command="countdownSelectHandle">
            <i class="el-icon-stopwatch">&nbsp;</i>{{ countdownText }}
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command="{text:'1小时',m:60}">1小时</el-dropdown-item>
              <el-dropdown-item :command="{text:'2小时',m:120}">2小时</el-dropdown-item>
              <el-dropdown-item :command="{text:'10分钟',m:10}">10分钟</el-dropdown-item>
              <el-dropdown-item :command="{text:'20分钟',m:20}">20分钟</el-dropdown-item>
              <el-dropdown-item :command="{text:'30分钟',m:30}">30分钟</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
        <div v-if="countdownMode">
          <br/>
          <Countdown :endTime="countdownTime"
                     @endFun="countdownEndFun"></Countdown>
        </div>
      </el-card>
      <el-collapse v-for="(item, index) in listItems" accordion>
        <el-collapse-item :title="item.wordName" :name="item.wordId">
          <div>
            <p>
              {{ item.paraphraseEnglish }}
            </p>
            <div>
              {{ isShowParaphrase ? item.meaningChinese : '释义已隐藏' }}
            </div>
          </div>
          <el-button type="text" style="color: #909399"
                     size="mini"
                     @click="showDetail(item.paraphraseId, index)"><i class="el-icon-more-outline"></i>
          </el-button>
          <el-button type="text" style="color: #909399"
                     size="mini"
                     @click="removeParaphraseStarListFun(item.paraphraseId, item.listId)"><i
              class="el-icon-remove-outline"></i>
          </el-button>
        </el-collapse-item>
      </el-collapse>
      <el-pagination
          v-if="isShowPagination"
          style="margin-top: 10px"
          small
          :page-size.sync="page.size"
          :current-page.sync="page.current"
          :page-count="page.pages"
          :pager-count="5"
          :page-sizes="[10,20,50,100]"
          layout="prev,pager,next,jumper"
          @size-change="pageChange"
          @current-change="pageChange"
          :total="page.total">
      </el-pagination>

      <!--释义详情弹窗-->
      <el-dialog
          ref="detailDialog"
          :visible.sync="detail.dialogVisible"
          fullscreen
          width="100%">
        <div slot="title" style="margin-bottom: -35px">
          <v-touch
              @click.stop="autoPlayDialogVisible++"
              @swipeup="stopPlaying"
              @swipedown="showNext(true)"
              @swipeleft="rememberInSleepMode(false)"
              @swiperight="showNext(false)">
            <div v-if="detail.isSleepMode"
                 @click="refreshReviseDetail"
                 :style="{height: innerHeightSleepModePx, background: '#909399'}">
              <br/>
              <el-tag type="info" effect="dark"><i class="el-icon-right"/>&nbsp;右滑跳过</el-tag>
              <br/>
              <el-tag type="info" effect="dark"><i class="el-icon-back"/>&nbsp;左滑记住</el-tag>
              <br/>
              <el-tag type="info" effect="dark"><i class="el-icon-thumb"/>&nbsp;单击从头开始听当前单词/当音频卡住时也可用
              </el-tag>
              <br/>
              <el-tag type="info" effect="dark"><i class="el-icon-top"/>&nbsp;上滑暂停当前播放单词</el-tag>
              <br/>
              <el-tag type="info" effect="dark"><i class="el-icon-bottom"/>&nbsp;下滑跳过spelling</el-tag>
              <br/>
              <el-tag type="info" effect="dark"><i class="el-icon-document-copy"/>&nbsp;滑动两边或者底部白色区域可以下拉或者上拉
              </el-tag>
            </div>
          </v-touch>
          <el-divider v-if="detail.isSleepMode"></el-divider>
          <el-tag type="info" :hit="true" style="font-size: larger; font-weight: bolder; font-family: sans-serif;"
                  @click="detail.showWord = !detail.showWord">
            {{ showWordSpelling }}
          </el-tag>
          &nbsp
          <el-button type="info"
                     v-if="isReview && detail.isSleepMode"
                     @click="switchSleepMode"
                     size="mini">
            <i class="el-icon-thumb"></i>
          </el-button>
        </div>
        <el-card class="box-card">
          <div slot="header">
            <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
              <el-col>
                <el-tag type="info">{{ detail.paraphraseVO.wordCharacter }}</el-tag>
                <el-tag type="info" v-if="detail.paraphraseVO.wordLabel && detail.paraphraseVO.wordLabel !== ''">
                  {{ detail.paraphraseVO.wordLabel }}
                </el-tag>
              </el-col>
            </el-row>
            <el-row v-if="!detail.paraphraseVO.isOverlength" type="flex" justify="end"
                    style="background-color: #8c939d;padding-top: 5px;">
              <el-col v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
                <el-tag type="info"
                        @click="playPronunciation(wordPronunciationVO.pronunciationId, wordPronunciationVO.sourceUrl, wordPronunciationVO.soundmarkType)">
                  {{ wordPronunciationVO.soundmark }}[{{ wordPronunciationVO.soundmarkType }}]
                  <i v-if="wordPronunciationVO.soundmarkType === 'UK'"
                     v-show="!isUKPronunciationPlaying"
                     class="el-icon-video-play"></i>
                  <i v-if="wordPronunciationVO.soundmarkType === 'US'"
                     v-show="!isUSPronunciationPlaying"
                     class="el-icon-video-play"></i>
                  <i v-if="wordPronunciationVO.soundmarkType === 'UK'"
                     v-show="isUKPronunciationPlaying"
                     class="el-icon-loading"></i>
                  <i v-if="wordPronunciationVO.soundmarkType === 'US'"
                     v-show="isUSPronunciationPlaying"
                     class="el-icon-loading"></i>
                </el-tag>
              </el-col>
            </el-row>
            <div v-if="detail.paraphraseVO.isOverlength"
                 v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
              <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
                <el-col>
                  <el-tag type="info"
                          @click="playPronunciation(wordPronunciationVO.pronunciationId, wordPronunciationVO.sourceUrl, wordPronunciationVO.soundmarkType)">
                    {{ wordPronunciationVO.soundmark }}[{{ wordPronunciationVO.soundmarkType }}]
                    <i v-if="wordPronunciationVO.soundmarkType === 'UK'"
                       v-show="!isUKPronunciationPlaying"
                       class="el-icon-video-play"></i>
                    <i v-if="wordPronunciationVO.soundmarkType === 'US'"
                       v-show="!isUSPronunciationPlaying"
                       class="el-icon-video-play"></i>
                    <i v-if="wordPronunciationVO.soundmarkType === 'UK'"
                       v-show="isUKPronunciationPlaying"
                       class="el-icon-loading"></i>
                    <i v-if="wordPronunciationVO.soundmarkType === 'US'"
                       v-show="isUSPronunciationPlaying"
                       class="el-icon-loading"></i>
                  </el-tag>
                </el-col>
              </el-row>
            </div>
            <div @click="detail.showTranslation = !detail.showTranslation">
              <el-alert
                  ref="paraphraseDetail"
                  type="info"
                  :description="detail.showTranslation ? detail.paraphraseVO.meaningChinese : detail.hideTranslationPrompt"
                  :closable="false"
                  effect="dark"
                  style="margin-top: 5px;"
                  center>
                <div slot="title">
                  <div v-for="phrase in detail.paraphraseVO.phraseList">
                    <el-tag type="info">{{ phrase }}</el-tag>
                  </div>
                  <br v-if="detail.paraphraseVO.phraseList"/>
                  <p>{{ this.detail.paraphraseVO.codes }}</p>
                  <div style="word-wrap:break-word; overflow:hidden;">
                    {{ this.detail.paraphraseVO.paraphraseEnglish }}
                  </div>
                </div>
              </el-alert>
            </div>
          </div>
          <div
              v-if="enableParaphraseExamples">
            <el-alert
                type="info"
                title="该释义暂时没有例句"
                center
                effect="light"
                :closable="false">
            </el-alert>
          </div>
          <div v-for="wordParaphraseExampleVO in this.detail.paraphraseVO.exampleVOList"
               @click="detail.showTranslation = !detail.showTranslation">
            <el-alert
                type="info"
                center
                effect="light"
                :description="detail.showTranslation ? wordParaphraseExampleVO.exampleTranslate : '释义已经隐藏，点击该区域显示/隐藏'"
                :closable="false">
              <div slot="title">
                {{ wordParaphraseExampleVO.exampleSentence }}
              </div>
            </el-alert>
          </div>
          <div style="margin-top: 100px"></div>
        </el-card>
      </el-dialog>
      <el-dialog
          :title="isChToEn ? '汉英模式' : '英汉模式（默认）'"
          v-if="!isDownloadReviewAudio"
          :visible="enableFirstIncomeReviewMode"
          :show-close="false"
          width="300px">
        <el-alert
            :closable="false"
            type="warning">
          复习期间如果被异常打断，可以点击恢复复习按钮，将重新开始当前页的复习；
        </el-alert>
        <div slot="footer" class="dialog-footer">
          <el-button type="info" @click="stockReviewStart">确定（继续上次复习）</el-button>
        </div>
      </el-dialog>
    </div>
    <div v-if="enableOperationIcon"
         style="position: fixed; bottom: 15px; right: 15px; z-index: 2147483646; text-align: right; line-height: 30px;">
      <el-button v-if="enableShowDetailIcon" type="info" size="mini"
                 @click="showDetail(detail.paraphraseVO.paraphraseId, detail.showIndex)">
        <i class="el-icon-document"></i>
      </el-button>
      <el-button type="info"
                 v-if="enableSleepModeIcon"
                 @click="switchSleepMode"
                 size="mini">
        <i class="el-icon-thumb"></i>
      </el-button>
      <el-button type="info" size="mini" v-if="showPreviousPageIcon" @click="previousPageFun">
        <i class="el-icon-d-arrow-left"></i>
      </el-button>
      <el-button v-if="showNextPageIcon"
                 type="info" size="mini" @click="nextPageFun">
        <i class="el-icon-d-arrow-right"></i>
      </el-button>

      <br/>
      <el-button v-if="enableSkipSomeAudioIcon" type="info" size="mini"
                 @click="showNext(true)">
        <i class="el-icon-finished"></i>
      </el-button>
      <el-button v-if="enableStopwatchIcon" type="info" size="mini" @click="switchStopWatchMode">
        <i class="el-icon-stopwatch" v-if="!countdownMode"></i>
        <i class="el-icon-switch-button" v-if="countdownMode"></i>
      </el-button>
      <el-button v-if="enableShowPreviousIcon" type="info" size="mini" @click="showPrevious">
        <i class="el-icon-arrow-left"></i>
      </el-button>
      <el-button v-if="enableShowNextIcon" type="info" size="mini" @click="showNext(false)">
        <i class="el-icon-arrow-right"></i>
      </el-button>
      <el-button type="info"
                 v-if="enableStopPlayingIcon"
                 @click="stopPlaying"
                 size="mini">
        <i class="el-icon-video-pause"></i>
      </el-button>
      <el-button type="info"
                 v-if="enableRefreshReviseDetailIcon"
                 @click="refreshReviseDetail"
                 size="mini">
        <i class="el-icon-brush"></i>
      </el-button>

      <br/>

      <el-button v-if="isStockReviewModel && !detail.isUnfoldOperateIcon"
                 type="info" size="mini" @click="rememberOneFun">
        <i class="el-icon-success"></i>
      </el-button>
      <el-button
          v-if="isEnhanceReviewModel && !detail.isUnfoldOperateIcon"
          type="info" size="mini" @click="keepInMindFun">
        <i class="el-icon-medal"></i>
      </el-button>
      <el-button type="info" v-if="detail.paraphraseVO.wordName && !detail.isUnfoldOperateIcon"
                 size="mini" @click="handleShowDetail">
        <i class="el-icon-open"></i>
      </el-button>
      <el-button
          v-if="detail.paraphraseVO.paraphraseId && !detail.isUnfoldOperateIcon"
          type="info" size="mini" @click="forgetOneFun">
        <i class="el-icon-question"></i>
      </el-button>
      <el-button type="info" size="mini"
                 @click="detail.isUnfoldOperateIcon = !detail.isUnfoldOperateIcon">
        <i class="el-icon-s-unfold" v-if="!detail.isUnfoldOperateIcon"></i>
        <i class="el-icon-s-fold" v-if="detail.isUnfoldOperateIcon"></i>
      </el-button>

    </div>
  </div>
</template>
