<script>
import {getStore, setStore} from '@/util/store'
import msgUtil from '@/util/msg'
import paraphraseStarList from '@/api/paraphraseStarList'
import audioPlay from '../../api/audioPlay'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'

const sleep = function (time) {
  let startTime = new Date().getTime() + time * 1000
  while (new Date().getTime() < startTime) {
  }
}

const runUpCh2EnCount = 5 // 需要回想时间
const ridChModeCh2EnAudioCount = 11 // 去除中文汉英模式播放的Audio数
const carryChModeCh2EnAudioCount = 17 // 附带中文汉英模式播放的Audio数
const ridChModeEh2ChAudioCount = 22 // 去除中文英汉模式播放的Audio数
const carryChModeEh2ChAudioCount = 40 // 附带中文英汉模式播放的Audio数
const playWordLoadCountOnce = 1 // 一播放加载的单词个数
const playCountOnce = 5 // 复习模式每页加载的单词个数
const readCountOnce = 10 // 阅读模式每页加载的单词个数

let that

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
    Countdown: $ => import('./Countdown')
  },
  data() {
    return {
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
        loading: true,
        reviewLoading: false,
        paraphraseVO: {},
        dialogVisible: false,
        rememberLoading: false,
        forgetLoading: false,
        showTranslation: false,
        hideTranslationPrompt: '释义已隐藏，点击灰暗区域隐藏/显示',
        showIndex: 0,
        isSleepMode: false,
        listId: null,
        sleepClickFirstTime: null,
        sleepClickSecondTime: null,
        previousReviewWord: null,
        apiKey: null
      },
      isUKPronunciationPlaying: false,
      isUSPronunciationPlaying: false,
      source: getStore({name: 'pronunciation_source'}),
      reviewType: getStore({name: 'review_type'}),
      spellType: getStore({name: 'spell_type'}),
      enParaType: getStore({name: 'enPara_type'}),
      isPlayExample: getStore({name: 'is_play_example'}),
      listItems: [],
      listRefresh: false,
      autoPlayDialogVisible: 0,
      isFirstIncome: true,
      reviewAudioArr: [],
      reviewAudioCandidates: [],
      isReviewStop: false,
      isReviewPlaying: false,
      playWordIndex: -1,
      playStepIndex: -1,
      playCountPerWord: 0,
      currentPlayAudio: null,

      countdownMode: false,
      countdownTime: new Date().getTime(),
      countdownMin: 30,
      countdownText: '30分钟',

      // 唯一标识，用来判断复习模式是否长时间停滞
      cmp: new Date().getTime(),
      // 唯一标识的副本，用于判断
      counterpart: null,
      cmpListening: null,
      notDistinctCount: 0,
      isIgnoreOtherError: false
    }
  },
  beforeCreate: function () {
    that = this
  },
  async mounted() {
    await this.init()
  },
  destroyed() {
    if (this.cmpListening) {
      clearInterval(this.cmpListening);
    }
    if (this.isReview && this.reviewAudioArr && this.reviewAudioArr.length > 0) {
      let audio = this.reviewAudioArr[this.playStepIndex]
      if (audio)
        audio.pause()
      this.reviewAudioArr = null
    }
  },
  watch: {
    'listId'() {
      this.init()
    },
    'playStepIndex'(newVal) {
      // noinspection JSVoidFunctionReturnValueUsed
      if (this.isNeedStopReview()) {
        return;
      }

      console.log('playStepIndex=' + newVal);
      console.log('this.playCountPerWord=' + this.playCountPerWord);
      if (newVal === 0) return
      if (this.isChToEn && newVal === runUpCh2EnCount) {
        sleep(3)
      }
      try {
        if (newVal > this.playCountPerWord - 1) {
          this.playStepIndex = 0
          this.playWordIndex++
          this.detail.loading = true
          this.showNext()
        } else {
          console.log(this.reviewAudioArr)
          console.log(this.playStepIndex)
          this.currentPlayAudio = this.reviewAudioArr[this.playStepIndex]
          console.log(this.currentPlayAudio.src)
          this.currentPlayAudio.play()
        }
      } catch (e) {
        console.error(e)
        this.msgError('播放音频异常，正在自动重试！')
        this.refreshReviewDetail()
      }
    },
    'playWordIndex'(newVal) {
      // noinspection JSVoidFunctionReturnValueUsed
      if (this.isNeedStopReview()) {
        return;
      }

      console.log('playWordIndex this.page.current = ' + this.page.current)
      if (newVal === 0) return
      if (newVal >= playCountOnce) {
        this.playWordIndex = 0
        this.reviewAudioArr = []
        if (this.page.pages > this.page.current) {
          this.page.current++
          this.init()
        }
      } else {
        // 最后一页条目数可能小于每页条目数
        if (this.page.current === this.page.pages) {
          let lastPageRemainder = this.page.total % this.page.size
          if (lastPageRemainder === 0) {
            return
          }
          if (newVal === lastPageRemainder) {
            this.$message.warning({
              duration: 3000,
              center: true,
              offset: 200,
              message: '当前复习列表已经复习完'
            })
            this.detail.loading = false
          }
        }
      }
    },
    'countdownMode'(newVal) {
      if (newVal) {
        this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
      }
    }
  },
  computed: {},
  methods: {
    ...paraphraseStarList,
    ...msgUtil,
    getApiKey: async function () {
      this.detail.apiKey = await audioPlay.selectApiKeyForVoiceRss()
    },
    async init() {
      if (this.isReview) {
        await this.getApiKey()
        // clean data
        this.cleanInitReviewing();

        let loading = this.$loading({
          lock: true,
          text: `第${this.page.current}页自动复习资源加载中`,
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        try {
          await this.initList()
          await this.initNextReviewDetail(true)
        } catch (e) {
          console.error(e)
          this.$message.error('初始化加载异常')
        } finally {
          loading.close()
        }

        this.prepareReview()

        if (!this.isFirstIncome) {
          this.autoPlayDialogVisible++ // 只有第一次进入复习需要手动触发
          this.msgSuccess(this, '即将开始复习，请稍等！')
        }
        // 手动触发过的直接播放即可
        if (this.autoPlayDialogVisible > 1) {
          await this.showDetail(this.listItems[0].paraphraseId, 0)
          console.log('------------')
          console.log(this.playWordIndex)
          console.log(this.reviewAudioArr)
          this.playWordIndex = 0
          this.playStepIndex = 0
          this.currentPlayAudio = this.reviewAudioArr[this.playStepIndex]
          this.currentPlayAudio.play()
        }

        // 启动断播监听，一旦网络卡住太久重新刷新，5秒监听一次
        // await this.initCmpListening()
      } else {
        await this.initList()
      }
    },
    async initCmpListening() {
      if (this.cmpListening) {
        clearInterval(this.cmpListening)
        this.cmpListening = null
        this.notDistinctCount = null
      }
      this.cmpListening = setInterval(() => {
        console.log('cmpListening')
        let counterpartTmp = this.cmp
        if (counterpartTmp === this.counterpart) {
          if (this.notDistinctCount > 2) {
            // 自动刷新进入复习需要手动触发
            this.autoPlayDialogVisible = 0
            this.init()
            return
          }
          this.notDistinctCount++
        } else {
          this.counterpart = counterpartTmp
          this.notDistinctCount = 0
        }
      }, 10000)
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
      this.listRefresh = true
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        // 复习模式每页只加载5个单词
        this.page.size = playCountOnce
        await this.initStockListFun()
        this.listRefresh = false
        return
      } else if (this.reviewMode === 'totalReview' || this.reviewMode === 'totalRead') {
        // 全量模式也只查5个
        await this.getReviewBreakpointPageNumber()
        this.page.size = playCountOnce
      } else if (this.reviewMode === 'enhanceReview' || this.reviewMode === 'enhanceRead') {
        // 复习模式每页只加载5个单词
        this.page.size = playCountOnce
        await this.initEnhanceListFun()
        this.listRefresh = false
        return
      }
      await this.initDefaultListFun()
      this.listRefresh = false
    },
    goBack() {
      this.$emit('tableVisibleToggle')
    },
    async initNextReviewDetail(isGetDetail) {
      console.log('initList')
      this.detail.loading = true
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
      await this.reviewDetail(this.detail.paraphraseVO.wordCharacter === kiwiConst.WORD_CHARACTER.PHRASE
          || this.spellType === kiwiConst.SPELL_TYPE.DISABLE)
    },
    async showDetail(paraphraseId, index) {
      this.detail.showIndex = index
      this.detail.loading = false
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
          })
      this.detail.dialogVisible = true

      if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
        this.detail.reviewLoading = true
      }
      this.detail.loading = false
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
        let audio = this.createNewAudio(true)
        if (this.source === '本地') {
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
      await this.getApiKey()
      this.isFirstIncome = false
      this.autoPlayDialogVisible++
      if (this.reviewAudioArr.length) {
        this.playWordIndex = 0
        this.playStepIndex = 0
        await this.showDetail(this.listItems[0].paraphraseId, 0)
        // this.calPlayCountPerWord()
        this.currentPlayAudio = this.reviewAudioArr[0]
        console.log('this.currentPlayAudio')
        console.log(this.currentPlayAudio)
        this.currentPlayAudio.play()
      }
    },
    async recursiveReview() {
      await this.showDetail(this.listItems[this.playWordIndex].paraphraseId, this.playWordIndex)
      // 每个单词播放前要计算播放audio数量，词组和单词不一样
      // this.calPlayCountPerWord()
      await this.initNextReviewDetail(false)
          .then(() => {
            console.log('this.reviewAudioArr')
            console.log(this.reviewAudioArr)
            console.log(this.playWordIndex)
            console.log(this.playStepIndex)
            this.currentPlayAudio = this.reviewAudioArr[this.playStepIndex]
            this.currentPlayAudio.play()
          })
    },
    createPronunciationAudio(isUS) {
      if (!this.detail.paraphraseVO.pronunciationVOList) {
        return audioPlay.createAudioForChinese(this.getAudio(), '音标缺失')
      }
      let pronunciation = this.getAudio()
      let isExistUS = this.detail.paraphraseVO.pronunciationVOList[1]
      let first = isUS && isExistUS ? this.detail.paraphraseVO.pronunciationVOList[1] : this.detail.paraphraseVO.pronunciationVOList[0]
      if (this.source === '本地') {
        pronunciation.src = '/wordBiz/word/pronunciation/downloadVoice/' + first.pronunciationId
      } else {
        pronunciation.src = first.sourceUrl
      }
      return pronunciation
    },
    getAudio: function () {
      let audio = this.reviewAudioCandidates.length ? this.reviewAudioCandidates.pop() : this.createNewAudio();
      console.log('getAudio')
      console.log(audio)
      return audio
    },
    async reviewDetail(isNotReviewSpell) {
      await this.getApiKey()
      let meaningChinese = this.detail.paraphraseVO.meaningChinese;
      let wordCharacter = this.detail.paraphraseVO.wordCharacter

      if (this.detail.paraphraseVO.meaningChinese) {
        meaningChinese = meaningChinese.replaceAll('…', '什么什么')
        meaningChinese = meaningChinese.replaceAll('...', '什么什么')
      }
      if (!this.detail.paraphraseVO.meaningChinese || this.detail.paraphraseVO.meaningChinese === '') {
        meaningChinese = '中文释义缺失'
      }
      let paraphraseEnglish = this.detail.paraphraseVO.paraphraseEnglish
      if (!paraphraseEnglish || this.detail.paraphraseVO.paraphraseEnglish === '') {
        paraphraseEnglish = '英文释义缺失'
      }

      async function createWordSpellAudio() {
        isNotReviewSpell = isNotReviewSpell || this.detail.previousReviewWord === this.detail.paraphraseVO.wordName
        if (!isNotReviewSpell) {
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '单词的拼写是：'))
          }
          let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), wordAlphabet))
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '再读一次拼写：'))
          }
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), wordAlphabet))
        }
      }

      async function createWordParaphraseAudio() {
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '词性是：' + review.translateWordCharacter(wordCharacter)))
        if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '中文释义是：'))
        }
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), meaningChinese))
        if (this.enParaType === kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE) {
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE)
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '英文释义是：'))
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), paraphraseEnglish))
        }
        if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '再读一次中文释义：'))
        }
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), meaningChinese))
        if (this.enParaType === kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE) {
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '再读一遍英文释义：'))
          }
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), paraphraseEnglish))
        }
      }

      async function createExampleAudio() {
        if (this.isPlayExample !== kiwiConst.IS_PLAY_EXAMPLE.ENABLE) {
          return
        }
        let exampleVOList = this.detail.paraphraseVO.exampleVOList
        console.log('exampleVOList = ' + exampleVOList)
        if (exampleVOList && meaningChinese && meaningChinese.length > 0) {
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(++reviewVoiceRssCount, this.getAudio(), '播报单词的例句：'))
          }
          for (let i = 0; i < exampleVOList.length; i++) {
            if (i > 1 || !exampleVOList[i]) {
              break
            }
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), exampleVOList[i].exampleTranslate))
            this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), exampleVOList[i].exampleSentence));
            this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), exampleVOList[i].exampleSentence))
          }
        }
      }

      function createWordSelfAudio() {
        // 如果是没有音标的词组
        if (!isNotReviewSpell) {
          this.reviewAudioArr.push(this.createPronunciationAudio())
          this.reviewAudioArr.push(this.createPronunciationAudio(true))
        }
      }

      if (this.isChToEn) {
        if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '接下来复习的单词中文释义是：'))
        }
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), meaningChinese))
        if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '再读一遍中文释义是：'))
        }
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), meaningChinese))
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '请在脑海回想对应的单词。'))
        this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '对应的英文单词是'))

        // 如果是没有音标的词组
        if (isNotReviewSpell) {
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), this.detail.paraphraseVO.wordName))
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), this.detail.paraphraseVO.wordName))
        } else {
          this.reviewAudioArr.push(this.createPronunciationAudio())
          this.reviewAudioArr.push(this.createPronunciationAudio(true))
        }

        if (!isNotReviewSpell) {
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '单词的拼写是：'))
          }
          let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), wordAlphabet))
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '再读一次拼写：'))
          }
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), wordAlphabet))
        }

        // 如果是没有音标的词组
        if (isNotReviewSpell) {
          this.reviewAudioArr.push(this.createPronunciationAudio())
          this.reviewAudioArr.push(this.createPronunciationAudio(true))
        }

        if (this.enParaType === kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE) {
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '英文释义是：'))
          }
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), paraphraseEnglish))
          if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
            this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '再读一遍英文释义：'))
          }
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), paraphraseEnglish))
        }
      } else {
        if (this.reviewType === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
          this.reviewAudioArr.push(audioPlay.createAudioForChinese(this.getAudio(), '接下来复习的单词是：'))
        }

        // 如果是没有音标的词组
        if (isNotReviewSpell) {
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), this.detail.paraphraseVO.wordName))
          this.reviewAudioArr.push(audioPlay.createAudioForEnglish(this.detail.apiKey, this.getAudio(), this.detail.paraphraseVO.wordName))
        } else {
          this.reviewAudioArr.push(this.createPronunciationAudio())
          this.reviewAudioArr.push(this.createPronunciationAudio(true))
        }

        console.log('this.reviewAudioArr')
        console.log(this.reviewAudioArr)

        createWordSelfAudio.call(this)
        createWordSpellAudio.call(this)
        createWordSelfAudio.call(this)
        createWordSpellAudio.call(this)
        createWordSpellAudio.call(this)
        createWordParaphraseAudio.call(this)
        createWordParaphraseAudio.call(this)
        createExampleAudio.call(this)
        createExampleAudio.call(this)
      }

      this.playCountPerWord = this.reviewAudioArr.length
      this.msgSuccess(this, `单词${this.detail.paraphraseVO.wordName}资源加载完毕，即将开始播放！`)
    },
    createNewAudio(skipListener) {
      let audio = new Audio()
      audio.volume = 0.7
      audio.loop = false
      audio.preload = 'load'

      if (skipListener) {
        return audio;
      }

      audio.addEventListener('ended', function () {
        console.log('end')
        that.isReviewPlaying = false
        that.cmp = new Date().getTime()
        that.reviewAudioCandidates.push(this)
        that.detail.loading = true
        if (!that.isReviewStop) {
          that.playStepIndex++
        }
      });

      audio.addEventListener('error', async function () {
            that.isReviewPlaying = false
            that.detail.reviewLoading = false
            if (that.isIgnoreOtherError) {
              return
            }

            that.isIgnoreOtherError = true;
            console.log('error src=' + this.src)
            // that.$message.error('音频数据加载异常')

            if (this.src.startsWith(kiwiConst.SITES.VOICE_RSS)) {
              let ttsCurrentApiKey = getStore({name: kiwiConst.CACHE_KEY.TTS_CURRENT_API_KEY});
              if (review.isDeprecateApiKeyToday(ttsCurrentApiKey)) {
                review.deprecateApiKeyToday(ttsCurrentApiKey);
                that.msgWarning(that, '当前TTS KEY已经用完，正在自动切换');
              } else {
                that.msgWarning(that, '音频加载异常，正在重新加载')
              }
            } else {
              that.msgWarning(that, '音频加载异常，正在重新加载')
            }

            if (audioPlay.isIos()) {
              audioPlay.playText2Audio('音频加载异常，请点击重新开始播放');
              await that.$confirm('当前的TTS KEY使用次数可能已经用完，请在个人中心切换其他TTS KEY', '免费额度已用完', {
                confirmButtonText: '重新播放',
                showCancelButton: false,
                type: 'warning'
              }).then($ => {
                that.init();
                // window.location.reload()
              });
            } else {
              that.init();
            }

            // that.cmp = new Date().getTime()
            // that.reviewAudioCandidates.push(this)
            // that.detail.loading = true
            // if (!that.isReviewStop) {
            //   that.playWordIndex++
            // }
          }
      )

      audio.addEventListener('playing', function () {
        console.log('playing')
        that.isReviewPlaying = true
        that.detail.loading = false
        that.detail.reviewLoading = false
      })
      audio.addEventListener('play', function () {
        console.log('play')
        that.isReviewPlaying = true
        that.detail.loading = false
        that.detail.reviewLoading = false
      })
      audio.addEventListener('pause', function () {
        that.isReviewPlaying = false
        console.log('pause')
      })
      return audio
    },
    isNeedStopReview() {
      return this.isReviewStop || !this.isReview || this.reviewAudioArr.length === 0
          || this.playStepIndex < 0 || this.playCountPerWord < 1 || this.playWordIndex < 0;
    },
    stopPlaying() {
      this.isReviewStop = true
      if (this.currentPlayAudio) {
        this.currentPlayAudio.pause()
        this.currentPlayAudio = null
      }
      if (this.playWordIndex < 0 || this.playStepIndex < 0) return
      if (this.reviewAudioArr.length) {
        if (this.reviewAudioArr[this.playStepIndex]) {
          this.reviewAudioArr[this.playStepIndex].pause()
        }
      }
    },
    rePlaying() {
      console.log(this.playWordIndex)
      console.log(this.playStepIndex)
      console.log(this.reviewAudioArr)
      if (this.playWordIndex < 0 || this.playStepIndex < 0) return
      if (this.reviewAudioArr.length) {
        if (this.reviewAudioArr[this.playStepIndex]) {
          this.reviewAudioArr[this.playStepIndex].play()
          this.isReviewStop = false
        }
      }
    },
    async ignoreCurrentReview(isShowTip) {
      if (isShowTip) {
        this.msgSuccess(this, `单词${this.detail.paraphraseVO.wordName}已忽略！`);
      }
      this.cleanDetailReviewing()
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
      return diff < 500;
    },
    async rememberInSleepMode(isSleep) {
      // 如果是睡眠模式
      if (isSleep && !this.isDoubleClick()) {
        return
      }
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        this.rememberOneFun()
      } else {
        this.keepInMindFun()
      }
    },
    rememberOneFun() {
      this.rememberOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            this.msgSuccess(this, '单词已经记住')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    keepInMindFun() {
      this.keepInMind(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            this.msgSuccess(this, '单词已经牢记')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    forgetOneFun() {
      this.forgetOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(() => {
            this.msgSuccess(this, '单词已经忘记')
            this.showNext()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
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
      // 如果是睡眠模式
      if (this.detail.isSleepMode && isCheckDoubleClick && !this.isDoubleClick()) {
        return
      }

      let lastIndexPerPage = this.detail.showIndex === this.page.size - 1;
      let lastPage = this.page.current === this.page.pages;
      // 最后一页条目数可能小于每页条目数
      if (lastPage) {
        let lastPageRemainder = this.page.total % this.page.size
        if (lastPageRemainder !== 0 && this.detail.showIndex === lastPageRemainder) {
          this.msgWarning(this, '当前已经是最后一页最后一个')
          return
        }
      }
      if (lastIndexPerPage) {
        this.page.current++
        this.detail.showIndex = 0
        await this.init()
      } else {
        this.detail.showIndex++
        if (this.isReview) {
          await this.ignoreCurrentReview(true)
          // 每个单词播放前要计算播放audio数量，词组和单词不一样
          await this.initNextReviewDetail(true)
              .then(() => {
                console.log('this.reviewAudioArr')
                console.log(this.reviewAudioArr)
                console.log(this.playWordIndex)
                console.log(this.playStepIndex)
                this.currentPlayAudio = this.reviewAudioArr[this.playStepIndex]
                this.currentPlayAudio.play()
              });
        }
        await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex);
      }
    },
    async refreshReviewDetail() {
      this.cleanDetailReviewing()
      this.prepareReview()
      await this.recursiveReview()
    },
    cleanCommonReviewing() {
      this.reviewAudioArr = []
      this.reviewAudioCandidates = []
      this.playStepIndex = 0
      this.detail.previousReviewWord = this.detail.paraphraseVO ? this.detail.paraphraseVO.wordName : null
      this.detail.paraphraseVO = {}
      this.detail.dialogVisible = false
    },
    cleanInitReviewing() {
      // stop playing
      this.stopPlaying()
      this.cleanCommonReviewing()
      this.playWordIndex = 0
      this.listItems = []
    },
    prepareReview() {
      this.isReviewStop = false
    },
    cleanDetailReviewing() {
      this.stopPlaying()
      this.cleanCommonReviewing()
      this.playWordIndex = this.detail.showIndex
    }
  }
}
</script>

<style scoped>
.pin {
  width: 100%;
  height: 100%;
  background: yellow;
  position: absolute;
}
</style>

<template>
  <div style="margin-top: 30px">
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
          v-loading="isReview && detail.reviewLoading"
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
          <el-tag type="info" :hit="true" style="font-size: larger; font-weight: bolder; font-family: sans-serif;">
            {{ detail.paraphraseVO.wordName }}
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
              v-if="detail.paraphraseVO.exampleVOList && detail.paraphraseVO.exampleVOList.length < 1">
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
          :visible="isFirstIncome && isReview && !isReviewStop"
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
    <div v-if="!detail.isSleepMode"
         style="position: fixed; bottom: 37px; right: 30px; z-index: 2147483646; text-align: right; line-height: 30px;">
      <el-button v-if="!detail.dialogVisible && detail.paraphraseVO.paraphraseId" type="info" size="mini"
                 @click="showDetail(detail.paraphraseVO.paraphraseId, detail.showIndex)">
        <i class="el-icon-document"></i>
      </el-button>
      <el-button v-if="detail.dialogVisible" type="info" size="mini" @click="detail.dialogVisible = false">
        <i class="el-icon-circle-close"></i>
      </el-button>
      <el-button v-if="!isReview" type="info" size="mini" @click="showPrevious">
        <i class="el-icon-back"></i>
      </el-button>
      <el-button type="info" size="mini" @click="showNext">
        <i class="el-icon-right"></i>
      </el-button>
      <el-button type="info"
                 v-if="isReview && detail.dialogVisible"
                 @click="switchSleepMode"
                 size="mini">
        <i class="el-icon-thumb"></i>
      </el-button>
      <el-button type="info"
                 v-if="isReview && !isReviewStop"
                 @click="stopPlaying"
                 size="mini">
        <i class="el-icon-video-pause"></i>
      </el-button>
      <el-button type="info"
                 v-if="isReview && isReviewStop"
                 @click="rePlaying"
                 size="mini">
        <i class="el-icon-video-play"></i>
      </el-button>
      <br/>
      <el-button v-if="reviewMode === 'stockReview' || reviewMode === 'stockRead'" type="info" size="mini"
                 v-loading="detail.rememberLoading" @click="rememberOneFun">
        <i class="el-icon-success"></i>
      </el-button>
      <el-button v-if="reviewMode === 'enhanceReview' || reviewMode === 'enhanceRead'" type="info" size="mini"
                 v-loading="detail.rememberLoading" @click="keepInMindFun">
        <i class="el-icon-success"></i>
      </el-button>
      <el-button type="info"
                 v-if="isReview"
                 @click="refreshReviewDetail"
                 size="mini">
        <i class="el-icon-refresh" v-show="!detail.loading"></i>
        <i class="el-icon-loading" v-show="detail.loading"></i>
      </el-button>
      <el-button type="info" v-if="detail.paraphraseVO.wordName"
                 size="mini" @click="handleShowDetail">
        <i class="el-icon-open"></i>
      </el-button>
      <el-button type="info" size="mini" v-loading="detail.forgetLoading" @click="forgetOneFun">
        <i class="el-icon-question"></i>
      </el-button>
    </div>
  </div>
</template>
