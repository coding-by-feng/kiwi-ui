<script>
import {getStore} from '@/util/store'
import msgUtil from '@/util/msg'
import util from '@/util/util'
import paraphraseStarList from '@/api/paraphraseStarList'
import review from '@/api/review'
import kiwiConsts from '@/const/kiwiConsts'
import audioUtil from '../../../util/audioUtil'
import NoSleep from 'nosleep.js'

const playCountOnce = 20 // 复习模式每页加载的单词个数
const readCountOnce = 20 // 阅读模式每页加载的单词个数
// AUDIO MANAGEMENT CONSTANTS
// These constants control the audio skipping behavior and volumes for different modes
// They determine which indices to skip to when users want to bypass certain parts of the audio
const skipWorkSpellingIndexEn2Ch = 10            // Index to skip to in English-to-Chinese mode (first time)
const skipWorkSpellingIndexEn2Ch_2nd = 17        // Index to skip to in English-to-Chinese mode (second time)
const skipWorkSpellingIndexWhenLastIsSameEn2Ch = 4    // Skip index when consecutive words are the same
const skipWorkSpellingIndexWhenLastIsSameEn2Ch_2nd = 11 // Second skip index for consecutive same words
// Similar constants for Chinese-to-English mode
const skipWorkSpellingIndexCh2En = 12
const skipWorkSpellingIndexCh2En_2nd = 19
const skipWorkSpellingIndexWhenLastIsSameCh2En = 7
const skipWorkSpellingIndexWhenLastIsSameCh2En_2nd = 14
// Volume presets for the volume value of different audio segments
const audioVolumesEn2Ch = [0.3, 0.3, 1, 1, 1, 0.3, 0.3, 1, 1, 1, 0.3, 1, 1, 1, 1, 1, 1, /*examples*/]
const audioVolumesEn2ChWhenLastIsSame = [0.3, 0.3, 0.3, 0.3, 0.3, 1, 1, 1, 1, 1, 1, /*examples*/]

// STATE VARIABLES
// The component uses many state variables to track the review process:
// - page: tracks pagination state
// - detail: complex object containing the current paraphrase being reviewed
// - audioPlayerMap: Maps URLs to Audio objects for efficient reuse
// - isFirstIncome: Tracks if this is the first time entering review mode
// - reviseAudioCandidates: Collection of audio elements for cleanup
// - playWordIndex: Critical index that drives the review progression

// KEY COMPUTED PROPERTIES
// isStockReviewModel & isEnhanceReviewModel: Determine which review mode is active
// enableOperationIcon, enableShowDetailIcon, etc.: Control which UI elements are displayed
// These properties are essential for the UI state management

// CORE METHODS
// createReviseQueue: Builds the audio queue for a word/phrase review session
// initNextReviseDetail: Prepares the next word's audio resources
// skipCurrent: Handles the logic to move to the next word
// refreshReviseDetail: Rebuilds the audio queue when needed
// The audio handling is quite complex with multiple nested promises and state tracking

// EVENT HANDLING
// The component uses both Vue events and raw DOM events:
// - Vue touch events for swipe gestures in mobile view
// - DOM audio events (ended, play, pause) to drive the review flow
// - Visibility change event to pause review when tab is inactive

// CACHING
// The component implements a sophisticated caching system:
// - Uses IndexedDB (via util/db.js) to store audio data
// - Creates object URLs for cached audio to improve performance
// Rebuilds URL references for each review session

// USER EXPERIENCE FEATURES
// - NoSleep integration prevents device from sleeping during review
// - Countdown timer feature for timed study sessions
// - Sleep mode with minimal UI for distraction-free learning
// - Support for both Chinese-to-English and English-to-Chinese review modes

// REVIEW CORE FUNCTIONALITY
// The reviewing system follows this general flow:
// 1. Load words/phrases from a list (initList)
// 2. For each word, prepare audio resources (initNextReviseDetail)
// 3. Play audio sequences with precise timing (createReviseQueue)
// 4. Track user progress and allow various interactions
// 5. Move to the next word automatically or via user action (skipCurrent)

// REVIEW MODES
// stockReview: Regular review mode - presents words with standard interval
// enhanceReview: For words marked for intensive review
// stockRead/enhanceRead: Similar to review but optimized for reading practice
// downloadReviewAudio: Mode to pre-download audio files for offline use
// Each mode has slightly different behavior in terms of audio sequencing and UI

// LANGUAGE DIRECTION HANDLING
// isChToEn: Boolean that determines direction of study (Chinese → English or English → Chinese)
// The component behaves differently based on this setting:
// - In Ch→En mode, the word is initially hidden (detail.showWord = false)
// - Different audio sequences are used (extractedCh2EnUrls vs extractedEn2ChUrls)
// - Different pause timings are implemented to give time for recall

// WORD TRACKING & LEARNING ALGORITHM
// The component tracks which words the user knows:
// - rememberOneFun: Marks a word as remembered (less frequent review)
// - keepInMindFun: Marks a word as "well-known" (even less frequent)
// - forgetOneFun: Marks a word as not known (more frequent review)
// This implements a simple spaced repetition algorithm

// AUDIO SEQUENCE GENERATION
// extractReviewAudioUrls: Creates the sequence of audio files to play
// Key sequence elements include:
// 1. Pronunciation (UK/US)
// 2. Spelling (for non-consecutive words)
// 3. Character/part-of-speech information
// 4. Definitions in target and source languages
// 5. Example sentences (if enabled)
// The sequence varies based on review mode and language direction

// AUDIO PLAYBACK MANAGEMENT
// setSoundListener: Sets up event listeners for audio playback
// The 'ended' event is crucial - it triggers the next audio or word
// Playback state is tracked in isReviewPlaying and detail.playIndex
// Volume is dynamically adjusted for different parts of the sequence

// PAGINATION & PROGRESS TRACKING
// The component loads words in batches (controlled by playCountOnce)
// page.current tracks the current page
// playWordIndex tracks progress within the current page
// When page is complete, automatically loads the next page

// SLEEP MODE FEATURE
// detail.isSleepMode: When enabled, displays a minimal UI
// optimized for passive listening without visual distractions
// Includes swipe gestures for control without looking at screen

// CONTINUOUS STUDY SESSION SUPPORT
// countdownMode: Implements a timer for study sessions
// NoSleep integration prevents device sleep during long sessions
// visibilitychange listener pauses when user switches tabs/apps

// SKIP FUNCTIONALITY
// skipSomeAudio: Critical feature that lets users skip spelling
// and get to the definition faster
// Uses predefined indices based on the audio sequence to jump ahead
// Different skipping points depending on language direction and context

// STATE PERSISTENCE
// getReviewBreakpointPageNumber: Restores review progress
// when returning to previously started review session
// Allows users to continue from where they left off


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
    Countdown: () => import('../Countdown.vue')
  },
  data() {
    return {
      // Controls the loading overlay for the entire component
      loading: false,

      // Screen dimension variables for layout calculations
      innerHeightPx: window.innerHeight + 'px',         // Full screen height
      innerHeightSleepModePx: window.innerHeight * 9 / 10 + 'px',  // Height for sleep mode (90% of screen)
      innerWidthPx: window.innerWidth + 'px',           // Full screen width
      innerWidthHalfPx: window.innerWidth / 2 + 'px',   // Half screen width (for split layouts)

      // Pagination state for word list
      page: {
        current: 1,                  // Current page number
        size: readCountOnce,         // Number of items per page
        total: 0,                    // Total number of items across all pages
        pages: 0                     // Total number of pages
      },

      // Controls pagination visibility during page transitions
      isShowPagination: true,

      // Core object containing all review state and UI state
      detail: {
        reviewLoading: false,
        paraphraseVO: {},
        dialogVisible: false,
        showTranslation: !getStore({name: kiwiConsts.CONFIG_KEY.IS_EN_TO_EN}),
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
        isEnableNoSleepMode: false,  // Whether NoSleep is active (prevents device sleep)
        skippedCount: 0,             // Tracks how many times skip has been used (affects skip behavior)
      },

      // Pronunciation playback state
      isUKPronunciationPlaying: false,   // Whether UK pronunciation is currently playing
      isUSPronunciationPlaying: false,   // Whether US pronunciation is currently playing

      // User settings from local storage
      source: getStore({name: 'pronunciation_source'}),  // Pronunciation source (Cambridge/Local)
      reviewType: getStore({name: 'review_type'}),       // Review type (with/without Chinese)
      spellType: getStore({name: 'spell_type'}),         // Whether to include spelling
      enParaType: getStore({name: 'enPara_type'}),       // Whether to include English paraphrase
      isPlayExample: getStore({name: 'is_play_example'}),  // Whether to play examples

      // Word list and review state
      listItems: [],                 // Array of words/phrases to review
      autoPlayDialogVisible: 0,      // Counter for auto-play dialog (0=never shown, 1+=shown)
      isFirstIncome: true,           // Whether this is first entry into review
      reviseAudioCandidates: [],     // Collection of audio elements for cleanup
      isReviewStop: false,           // Whether review is stopped
      isReviewPlaying: false,        // Whether audio is currently playing
      playWordIndex: -1,             // Index of current word in review sequence

      // Countdown timer state
      countdownMode: false,          // Whether countdown timer is active
      countdownTime: new Date().getTime(),  // End time for countdown
      countdownMin: 60,              // Duration in minutes
      countdownText: '1小时'         // Display text for countdown
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
      this.pauseAllPlayingAudio()
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
      console.log('watching this.playWordIndex = ' + this.playWordIndex)
      // noinspection JSVoidFunctionReturnValueUsed
      if (this.isNeedStopReview() || this.isReviewPlaying || newVal === 0) {
        console.log('watching this.')
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
    isDownloadReviewAudioModel() {
      return this.reviewMode === kiwiConsts.REVIEW_MODEL.DOWNLOAD_REVIEW_AUDIO
    },
    isStockReviewModel() {
      return this.detail.paraphraseVO.paraphraseId && (this.reviewMode === kiwiConsts.REVIEW_MODEL.STOCK_REVIEW
          || this.reviewMode === kiwiConsts.REVIEW_MODEL.STOCK_READ)
    },
    isEnhanceReviewModel() {
      return this.detail.paraphraseVO.paraphraseId && (this.reviewMode === kiwiConsts.REVIEW_MODEL.ENHANCE_REVIEW
          || this.reviewMode === kiwiConsts.REVIEW_MODEL.ENHANCE_READ)
    },
    enableOperationIcon() {
      return (this.isReview && !this.detail.isSleepMode && !this.isFirstIncome) || !this.isReview
    },
    enableShowDetailIcon() {
      return this.detail.paraphraseVO.paraphraseId && (this.reviewMode === kiwiConsts.REVIEW_MODEL.STOCK_REVIEW
          || this.reviewMode === kiwiConsts.REVIEW_MODEL.STOCK_READ)
    },
    enableShowEnhanceDetailIcon() {
      return this.detail.paraphraseVO.paraphraseId && (this.reviewMode === kiwiConsts.REVIEW_MODEL.ENHANCE_REVIEW
          || this.reviewMode === kiwiConsts.REVIEW_MODEL.ENHANCE_READ)
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
      return this.detail && !this.detail.isUnfoldOperateIcon && this.isReview && this.detail.dialogVisible
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
    // These methods track consecutive identical words to optimize the audio sequence
    // When the same word appears twice, spelling can be skipped to avoid repetition

    // isNeedStopReview
    // Controls when review should be stopped, checking various conditions
    // Ensures audio playback doesn't continue in inappropriate states

    // stockReviewStart
    // Entry point for the standard review process
    // Initializes playback state and UI for the review session

    // recursiveReview
    // Handles the progression through review items
    // Ensures smooth transition between words with proper audio preparation

    // rebuildUrls
    // Critical for performance - processes all audio URLs in parallel
    // Uses caching system to avoid redundant downloads and improve playback start time

    // createUniqueThreadToRebuildSoundUrl
    // Implements a promise-based approach to handle audio URL preparation
    // Either retrieves cached audio from IndexedDB or downloads from server

    // pauseAllPlayingAudio
    // Safety method to ensure all audio is stopped when needed
    // Prevents audio overlap issues when changing states

    // getCurrentAudioPlayer
    // Retrieves the appropriate audio player object for the current playback position
    // Part of the audio resource management system

    // cleanRevising & cleanInitRevising & cleanDetailRevising
    // Memory management methods that prevent audio resource leaks
    // Essential for long review sessions without performance degradation

    ...paraphraseStarList,
    ...msgUtil,
    listenerMinBrowser() {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          that.isReviewStop = true
          that.isReviewPlaying = false
          that.pauseAllPlayingAudio()
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

      // Optionally load word details
      if (isGetDetail) {
        this.handoffReviewWordSame()
        await this.getItemDetail(this.listItems[this.playWordIndex].paraphraseId)
            .then(response => {
              this.detail.paraphraseVO = response.data.data
              if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
                this.detail.paraphraseVO.wordCharacter = kiwiConsts.WORD_CHARACTER.PHRASE
              }
            })
            .catch(e => {
              console.error(e)
            })
      }

      // This is where the audio queue is created
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

      // Set current index if provided
      if (null !== index && undefined !== index) {
        this.detail.showIndex = index
      }

      // Track consecutive words
      this.handoffReviewWordSame()

      // Load word details from API
      await this.getItemDetail(paraphraseId)
          .then(response => {
            this.detail.paraphraseVO = response.data.data
            if (this.detail.paraphraseVO.wordName.indexOf(' ') > 0) {
              this.detail.paraphraseVO.wordCharacter = kiwiConsts.WORD_CHARACTER.PHRASE
            }
            // Track list ID for each word
            this.detail.listId = this.listItems[this.detail.showIndex].listId
            loading.close()
          }).catch(e => {
            console.error(e)
            that.msgError(that, '加载释义详情异常')
            loading.close()
          })

      // Show dialog with word details
      this.detail.dialogVisible = true

      // Set review loading state if needed
      if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
        this.detail.reviewLoading = true
      }

      // Track review count
      review.increaseCounter(kiwiConsts.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
    },

    async showDetailNotLoadData() {
      console.log('showDetailNotLoadData')
      this.detail.dialogVisible = true
      if (this.isReview && !this.isReviewStop && !this.isReviewPlaying) {
        this.detail.reviewLoading = true
      }

      // noinspection ES6MissingAwait
      review.increaseCounter(kiwiConsts.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
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
    handleShowDetail() {
      this.detail.dialogVisible = false
      this.$router.push({
        path: kiwiConsts.ROUTES.DETAIL,
        query: {active: 'search', originalText: this.detail.paraphraseVO.wordName}
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
        if (this.source === kiwiConsts.PRONUNCIATION_SOURCE.LOCAL) {
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
// Initiates the review process for stock review mode
    stockReviewStart() {
      try {
        // Reset to first word
        this.playWordIndex = 0
        this.autoPlayDialogVisible++
        this.isFirstIncome = false

        // For Chinese to English mode, show translations
        if (this.isChToEn) {
          this.detail.showTranslation = true
        }

        // Load details of first word and play audio
        this.showDetail(this.listItems[0].paraphraseId, 0)
            .then(() => {
              that.detail.audioPlayer.play()
            })
      } catch (e) {
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
      if (this.source === kiwiConsts.PRONUNCIATION_SOURCE.LOCAL) {
        return '/wordBiz/word/pronunciation/downloadVoice/' + first.pronunciationId
      } else {
        return first.sourceUrl
      }
    },
    assemblePronunciationUrl(isUS) {
      if (!this.detail.paraphraseVO.pronunciationVOList || this.detail.paraphraseVO.pronunciationVOList.length < 1) {
        return audioUtil.assembleReviseAudioUrl(this.detail.paraphraseVO.wordId, kiwiConsts.REVIEW_AUDIO_TYPE.PHRASE_PRONUNCIATION)
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
      this.pauseAllPlayingAudio()
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
    pauseAllPlayingAudio() {
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
      this.pauseAllPlayingAudio()
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
            if (this.playWordIndex < this.listItems.length - 1) {
              this.playWordIndex++
              await this.initNextReviseDetail(true)
              if (!this.isDownloadReviewAudio && this.detail.audioPlayer) {
                this.detail.audioPlayer.play()
              }
            }
          } else {
            if (this.detail.showIndex < this.listItems.length - 1) {
              this.detail.showIndex++
              await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
            } else {
              this.page.current++
              await this.init()
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    },
  }
}
</script>
