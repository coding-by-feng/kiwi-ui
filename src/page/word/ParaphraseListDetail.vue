<script>
import {getStore, setStore} from '@/util/store'
import msgUtil from '@/util/msg'
import util from '@/util/util'
import paraphraseStarList from '@/api/paraphraseStarList'
import audioPlay from '../../api/audioPlay'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'
import {Howl, Howler} from 'howler';
import howlerUtil from '../../util/howlerUtil'
import NoSleep from 'nosleep.js'

const playCountOnce = 20 // 复习模式每页加载的单词个数
const readCountOnce = 20 // 阅读模式每页加载的单词个数

let that
let noSleep

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
      innerHeightHalfPx: window.innerHeight / 2 + 'px',
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
        showTranslation: false,
        showWord: true,
        hideTranslationPrompt: '释义已隐藏，点击灰暗区域隐藏/显示',
        showIndex: 0,
        isSleepMode: false,
        listId: null,
        sleepClickFirstTime: null,
        sleepClickSecondTime: null,
        previousReviewWord: null,
        apiKey: null,
        howlerPlayerQueue: [],
        howlerPlayer: null,
        howlerPlayerToken: null,
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
      countdownMin: 30,
      countdownText: '30分钟'
    }
  },
  beforeCreate: function () {
    that = this
    noSleep = new NoSleep()
    Howler.html5PoolSize = 30
    Howler.autoSuspend = false
  },
  async mounted() {
    await this.init()
  },
  destroyed() {
    if (this.detail.howlerPlayer) {
      this.detail.howlerPlayer.stop()
      this.detail.howlerPlayer = null
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
        return;
      }

      this.skipCurrent()
    },
    'countdownMode'(newVal) {
      if (newVal) {
        this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
        noSleep.enable()
      }
    }
  },
  computed: {
    showWordSpelling() {
      return this.detail.showWord ? this.detail.paraphraseVO.wordName : '点击切换是否显示单词'
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
      return (this.isReview && !this.detail.isSleepMode && !this.isFirstIncome) || !this.isReview;
    },
    enableShowDetailIcon() {
      return !this.detail.dialogVisible && this.detail.paraphraseVO.paraphraseId;
    },
    enableSleepModeIcon() {
      return this.isReview && this.detail.dialogVisible;
    },
    enableFirstIncomeReviewMode() {
      return this.isFirstIncome && this.isReview && !this.isReviewStop;
    },
    enableParaphraseExamples() {
      return this.detail.paraphraseVO.exampleVOList && this.detail.paraphraseVO.exampleVOList.length < 1;
    },
    isDetailLoading() {
      return this.isReview && this.detail.reviewLoading;
    },
    isListItemsNotEmpty() {
      return this.listItems && this.listItems.length > 0;
    },
  },
  methods: {
    ...paraphraseStarList,
    ...msgUtil,
    async init() {
      console.log('init...')
      try {
        this.loading = true
        if (this.isReview) {
          // clean data
          await this.cleanInitRevising();

          try {
            await this.initList()
            await this.initNextReviseDetail(true)
          } catch (e) {
            console.error(e)
            this.$message.error('初始化加载异常')
            this.loading = false
            return
          }

          if (!this.isFirstIncome) {
            this.autoPlayDialogVisible++ // 只有第一次进入复习需要手动触发
            this.msgSuccess(this, '即将开始复习，请稍等！')
          }
          // 手动触发过的直接播放即可
          if (this.autoPlayDialogVisible > 1) {
            if (this.isListItemsNotEmpty) {
              await this.showDetail(this.listItems[0].paraphraseId, 0);
            }
            this.detail.howlerPlayer.play()
          }
        } else {
          await this.initList()
          if (this.isListItemsNotEmpty) {
            await this.showDetail(this.listItems[0].paraphraseId, 0);
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
    async initNextReviseDetail(isGetDetail) {
      console.log('initNextReviewDetail this.playWordIndex = ' + this.playWordIndex)
      console.log('initNextReviewDetail this.listItems[this.playWordIndex] = ' + this.listItems[this.playWordIndex])
      let loading = this.buildNotGlobalLoading();
      this.prepareReview()
      if (isGetDetail) {
        await this.getItemDetail(this.listItems[this.playWordIndex].paraphraseId)
            .then(response => {
              this.detail.paraphraseVO = response.data.data
              if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
                this.detail.paraphraseVO.wordCharacter = kiwiConst.WORD_CHARACTER.PHRASE
              }
            })
            .catch(e => {
              loading.close()
              console.error(e)
            })
      }
      this.detail.howlerPlayerQueue = this.createReviseQueue(this.detail.howlerPlayerToken);
      console.log('initNextReviewDetail this.detail.howlerPlayerQueue=' + this.detail.howlerPlayerQueue)
      this.detail.howlerPlayer = this.detail.howlerPlayerQueue[0];
      loading.close()
    },
    async showDetail(paraphraseId, index) {
      if (null !== index && undefined !== index) {
        this.detail.showIndex = index
      }
      await this.getItemDetail(paraphraseId)
          .then(response => {
            this.detail.paraphraseVO = response.data.data
            if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
              this.detail.paraphraseVO.wordCharacter = kiwiConst.WORD_CHARACTER.PHRASE
            }
            // 如果是复习最近收藏
            this.detail.listId = this.listItems[this.detail.showIndex].listId
          })
          .catch(e => {
            console.error(e)
            that.msgError(that, '加载释义详情异常')
          });
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
              this.$message.error(e)
            })
      }).finally(() => {
        loading.close()
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
        this.msgSuccess('点击灰色区域记住或牢记当前复习单词！')
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
        // let audio = this.pronunciationAudioMap.get(id)
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
    async stockReviewStart() {
      try {
        this.playWordIndex = 0;
        this.autoPlayDialogVisible++;
        this.isFirstIncome = false;
        await this.showDetail(this.listItems[0].paraphraseId, 0);
        this.detail.howlerPlayer.play();
      } catch (e) {
        alert(e)
        console.error(e)
      }
    },
    async recursiveReview() {
      await this.showDetail(this.listItems[this.playWordIndex].paraphraseId, this.playWordIndex)
      await this.initNextReviseDetail(false)
          .then(() => {
            that.detail.howlerPlayer.play()
          })
    },
    assemblePronunciationUrl(isUS) {
      if (!this.detail.paraphraseVO.pronunciationVOList) {
        return null
      }
      let url
      let isExistUS = this.detail.paraphraseVO.pronunciationVOList[1]
      let first = isUS && isExistUS ? this.detail.paraphraseVO.pronunciationVOList[1] : this.detail.paraphraseVO.pronunciationVOList[0]
      if (this.source === kiwiConst.PRONUNCIATION_SOURCE.LOCAL) {
        url = '/wordBiz/word/pronunciation/downloadVoice/' + first.pronunciationId
      } else {
        url = first.sourceUrl
      }
      return url
    },
    createPronunciationAudio(isUS) {
      if (!this.detail.paraphraseVO.pronunciationVOList) {
        return audioPlay.createAudioForChinese(this.getAudio(), '音标缺失')
      }
      let pronunciation = this.getAudio()
      let isExistUS = this.detail.paraphraseVO.pronunciationVOList[1]
      let first = isUS && isExistUS ? this.detail.paraphraseVO.pronunciationVOList[1] : this.detail.paraphraseVO.pronunciationVOList[0]
      if (this.source === kiwiConst.PRONUNCIATION_SOURCE.LOCAL) {
        pronunciation.src = '/wordBiz/word/pronunciation/downloadVoice/' + first.pronunciationId
      } else {
        pronunciation.src = first.sourceUrl
      }
      return pronunciation
    },
    getAudio: function () {
      return this.reviseAudioCandidates.length ? this.reviseAudioCandidates.pop() : this.createNewAudio()
    },
    extractParaphraseMeaningChinese: function () {
      let meaningChinese = this.detail.paraphraseVO.meaningChinese;
      if (meaningChinese) {
        meaningChinese = meaningChinese.replaceAll('…', '什么什么')
        meaningChinese = meaningChinese.replaceAll('...', '什么什么')
      }
      if (!meaningChinese || this.detail.paraphraseVO.meaningChinese === '') {
        meaningChinese = '中文释义缺失'
      }
      return meaningChinese;
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
      return this.isReviewStop || !this.isReview || this.playWordIndex < 0;
    },
    async stopPlaying() {
      console.log('stopPlaying')
      this.isReviewStop = true
      this.isReviewPlaying = false
      Howler.stop()
    },
    rePlayingNotRefresh() {
      if (this.detail.howlerPlayer) {
        this.detail.howlerPlayer.play()
      }
    },
    async ignoreCurrentReview(isShowTip) {
      console.log('ignoreCurrentReview')
      if (isShowTip) {
        this.msgSuccess(this, `单词${this.detail.paraphraseVO.wordName}已忽略！`);
      }
      await this.cleanDetailRevising()
      this.isReviewStop = false
    },
    isDoubleClick() {
      let diff = 1000
      if (this.detail.sleepClickFirstTime) {
        this.detail.sleepClickSecondTime = new Date().getTime()
        diff = this.detail.sleepClickSecondTime - this.detail.sleepClickFirstTime
        this.detail.sleepClickFirstTime = null
        this.detail.sleepClickSecondTime = null
      } else {
        this.detail.sleepClickFirstTime = new Date().getTime()
      }
      console.log('diff = ' + diff)
      return diff < 800;
    },
    async rememberInSleepMode(isSleep) {
      // 如果是睡眠模式
      if (isSleep && !this.isDoubleClick()) {
        return
      }
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        await this.rememberOneFun()
      } else {
        await this.keepInMindFun()
      }
    },
    buildNotGlobalLoading: function () {
      return this.$loading({
        lock: true,
        text: `正在操作`,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
    },
    async rememberOneFun() {
      let loading = this.buildNotGlobalLoading()
      await this.rememberOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            this.msgSuccess(this, '单词已经记住')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
          .finally(() => {
            loading.close()
          })
    },
    async keepInMindFun() {
      let loading = this.buildNotGlobalLoading()
      await this.keepInMind(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            this.msgSuccess(this, '单词已经牢记')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
          .finally(() => {
            loading.close()
          })
    },
    async forgetOneFun() {
      let loading = this.buildNotGlobalLoading()
      await this.forgetOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            this.msgSuccess(this, '单词已经忘记')
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
          .finally(() => {
            loading.close()
          })
    },
    countdownSelectHandle(command) {
      this.countdownText = command.text
      this.countdownMin = command.m
      this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
    },
    countdownEndFun() {
      this.isReviewStop = true
      this.countdownMode = !this.countdownMode
      noSleep.disable()
      window.location.reload()
    },
    async countdownEndReplay() {
      this.isReviewStop = false
      await this.init()
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
    async showNext(isCheckDoubleClick) {
      console.log('showNext')
      // 如果是睡眠模式
      if (this.detail.isSleepMode && isCheckDoubleClick && !this.isDoubleClick()) {
        return
      }

      this.detail.showIndex++
      if (this.isReview) {
        if (this.detail.showIndex !== this.playWordIndex) {
          this.playWordIndex = this.detail.showIndex;
        } else {
          this.playWordIndex++
        }
      }
      await this.skipCurrent()
    },
    async skipCurrent() {
      console.log('skipCurrent')
      console.log('skipCurrent this.detail.showIndex = ' + this.detail.showIndex)
      console.log('skipCurrent this.playWordIndex = ' + this.playWordIndex)
      console.log('skipCurrent this.page.size = ' + this.page.size)
      try {
        let lastIndexPerPage = this.detail.showIndex >= this.page.size;
        let lastPage = this.page.current === this.page.pages;
        // 最后一页条目数可能小于每页条目数
        console.log('skipCurrent lastPage = ' + lastPage)
        console.log('skipCurrent lastIndexPerPage = ' + lastIndexPerPage)
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
            await this.ignoreCurrentReview(true);
            // 每个单词播放前要计算播放audio数量，词组和单词不一样
            await this.initNextReviseDetail(true)
                .then(() => {
                  that.detail.howlerPlayer.play()
                }).catch(e => {
                  this.msgError(that, '初始化下一个释义详情异常!')
                  console.error('initNextReviseDetail error')
                  console.error(e)
                });
            await this.showDetailNotLoadData()
          } else {
            await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex);
          }
        }
      } catch (e) {
        alert('skipCurrent error.')
        console.error(e)
      }
    },
    async refreshReviseDetail() {
      this.cleanDetailRevising()
      this.prepareReview()
      await this.recursiveReview()
    },
    async cleanRevising() {
      Howler.unload()
      this.reviseAudioCandidates = []
      this.detail.previousReviewWord = this.detail.paraphraseVO ? this.detail.paraphraseVO.wordName : null
      this.detail.paraphraseVO = {}
      this.detail.dialogVisible = false
      this.detail.howlerPlayerToken = new Date().getTime()
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
    extractHowlUrls: function () {
      let paraphraseId = this.detail.paraphraseVO.paraphraseId;
      let wordId = this.detail.paraphraseVO.wordId;
      let wordCharacter = this.detail.paraphraseVO.wordCharacter;
      let ukPronunciationUrl = this.assemblePronunciationUrl(false)
      let usPronunciationUrl = this.assemblePronunciationUrl(true)
      let lastIsSame = this.detail.previousReviewWord === this.detail.paraphraseVO.wordName;
      if (this.isChToEn) {
        return howlerUtil.extractedCh2EnUrls(paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, this.detail.paraphraseVO.exampleVOList);
      } else {
        return howlerUtil.extractedEn2ChUrls(lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, this.detail.paraphraseVO.exampleVOList);
      }
    },
    createReviseQueue(token) {
      let urls = this.extractHowlUrls();
      let queueLength = urls.length
      let sounds = []
      let playIndex = 0
      console.log('queueLength=' + queueLength)
      let ch2EnIndexSleepMsMap = howlerUtil.acquireCh2EnIndexSleepMsMap();
      for (let i = 0; i < queueLength; i++) {
        // noinspection JSUnusedGlobalSymbols
        let sound = new Howl({
          src: urls[i],
          autoplay: false,
          loop: false,
          volume: 0.5,
          html5: true,
          format: ['mp3'],
          onend: async function () {
            // console.log('onend playIndex=' + playIndex)
            // console.log('onend: ' + urls[playIndex])
            that.isReviewPlaying = false
            if (that.isChToEn) {
              let sleepMs = ch2EnIndexSleepMsMap.get(playIndex);
              if (sleepMs) {
                await util.sleep(sleepMs)
              }
            }
            if (token !== that.detail.howlerPlayerToken) {
              return
            }
            if (++playIndex < queueLength) {
              that.detail.howlerPlayer = sounds[playIndex];
              that.detail.howlerPlayer.play();
            } else {
              // console.log('that.playWordIndex++ ' + that.playWordIndex)
              ++that.playWordIndex;
            }
          },
          onloaderror: async function () {
            // console.log('onloaderror: ' + urls[playIndex])
            that.isReviewPlaying = false
            that.detail.reviewLoading = false
            that.msgError(that, '音频数据加载异常')
            Howler.unload()
            ++playIndex
            review.deprecateReviewAudio(that.detail.paraphraseVO.paraphraseId)
          },
          onplay: function () {
            // console.log('onplay: ' + urls[playIndex])
            that.isReviewPlaying = true
            that.detail.reviewLoading = false
          },
          onpause: function () {
            // console.log('onpause: ' + urls[playIndex])
            that.isReviewPlaying = false
          }
        });
        sounds.push(sound)
      }
      return sounds
    },

  }
}
</script>

<template>
  <div style="margin-top: 30px" v-loading="loading">
    <div style="z-index: 1;">
      <el-card v-if="isReview" class="box-card" style="background-color: #DCDFE6;">
        <div>
          <el-switch
              v-if="isReview"
              v-model="countdownMode"
              active-color="#409EFF"
              inactive-color="#909399">
          </el-switch>
          &nbsp;
          <el-dropdown
              size="mini"
              split-button type="info" @command="countdownSelectHandle">
            <i class="el-icon-stopwatch">&nbsp;</i>{{ countdownText }}
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command="{text:'10分钟',m:10}">10分钟</el-dropdown-item>
              <el-dropdown-item :command="{text:'20分钟',m:20}">20分钟</el-dropdown-item>
              <el-dropdown-item :command="{text:'30分钟',m:30}">30分钟</el-dropdown-item>
              <el-dropdown-item :command="{text:'1小时',m:60}">1小时</el-dropdown-item>
              <el-dropdown-item :command="{text:'2小时',m:120}">2小时</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          &nbsp;
          <el-button
              v-if="!countdownMode && isReviewStop"
              type="info"
              size="mini"
              @click="countdownEndReplay">
            <i class="el-icon-video-play"></i>
          </el-button>
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
          v-loading="isDetailLoading"
          ref="detailDialog"
          :visible.sync="detail.dialogVisible"
          fullscreen
          width="100%">
        <div slot="title" style="margin-bottom: -35px">
          <div v-if="detail.isSleepMode"
               :style="{height: innerHeightHalfPx, background: '#909399'}"
               @click.stop="rememberInSleepMode(true)">
          </div>
          <div v-if="detail.isSleepMode"
               :style="{height: innerHeightHalfPx, background: '#DEB887', marginTop: '50%;'}"
               @click.stop="showNext(true)">
          </div>
          <el-divider v-if="detail.isSleepMode"></el-divider>
          <el-tag type="info" :hit="true" style="font-size: larger; font-weight: bolder; font-family: sans-serif;"
                  @click="detail.showWord = !detail.showWord">
            {{ showWordSpelling }}
          </el-tag>
          &nbsp;
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
                <el-tag type="success">{{ detail.paraphraseVO.wordCharacter }}</el-tag>
                <el-tag v-if="detail.paraphraseVO.wordLabel && detail.paraphraseVO.wordLabel !== ''">
                  {{ detail.paraphraseVO.wordLabel }}
                </el-tag>
              </el-col>
            </el-row>
            <el-row v-if="!detail.paraphraseVO.isOverlength" type="flex" justify="end"
                    style="background-color: #8c939d;padding-top: 5px;">
              <el-col v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
                <el-tag
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
                  <el-tag
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
                    <el-tag type="warning">{{ phrase }}</el-tag>
                  </div>
                  <br v-if="detail.paraphraseVO.phraseList"/>
                  {{ this.detail.paraphraseVO.codes }}
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
         style="position: fixed; bottom: 37px; right: 30px; z-index: 2147483646; text-align: right; line-height: 30px;">
      <el-button v-if="enableShowDetailIcon" type="primary" size="mini"
                 @click="showDetail(detail.paraphraseVO.paraphraseId, detail.showIndex)">
        <i class="el-icon-document"></i>
      </el-button>
      <el-button v-if="detail.dialogVisible" type="primary" size="mini" @click="detail.dialogVisible = false">
        <i class="el-icon-circle-close"></i>
      </el-button>
      <el-button v-if="!isReview" type="primary" size="mini" @click="showPrevious">
        <i class="el-icon-arrow-left"></i>
      </el-button>
      <el-button type="primary" size="mini" @click="showNext">
        <i class="el-icon-arrow-right"></i>
      </el-button>
      <el-button type="primary"
                 v-if="enableSleepModeIcon"
                 @click="switchSleepMode"
                 size="mini">
        <i class="el-icon-thumb"></i>
      </el-button>
      <el-button type="primary"
                 v-if="isReview && !isReviewStop"
                 @click="stopPlaying"
                 size="mini">
        <i class="el-icon-video-pause"></i>
      </el-button>
      <el-button type="primary"
                 v-if="isReview && isReviewStop"
                 @click="refreshReviseDetail"
                 size="mini">
        <i class="el-icon-video-play"></i>
      </el-button>
      <br/>
      <el-button v-if="isStockReviewModel"
                 type="primary" size="mini" @click="rememberOneFun">
        <i class="el-icon-success"></i>
      </el-button>
      <el-button
          v-if="isEnhanceReviewModel"
          type="primary" size="mini" @click="keepInMindFun">
        <i class="el-icon-medal"></i>
      </el-button>
      <el-button type="primary"
                 v-if="isReview"
                 @click="refreshReviseDetail"
                 size="mini">
        <i class="el-icon-refresh"></i>
      </el-button>
      <el-button type="primary" v-if="detail.paraphraseVO.wordName"
                 size="mini" @click="handleShowDetail">
        <i class="el-icon-open"></i>
      </el-button>
      <el-button
          v-if="detail.paraphraseVO.paraphraseId"
          type="primary" size="mini" @click="forgetOneFun">
        <i class="el-icon-question"></i>
      </el-button>
    </div>
  </div>
</template>
