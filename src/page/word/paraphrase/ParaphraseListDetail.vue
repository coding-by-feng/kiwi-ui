<script>
import {getStore} from '@/util/store'
import msgUtil from '@/util/msg'
import util from '@/util/util'
import paraphraseStarList from '@/api/paraphraseStarList'
import review from '@/api/review'
import kiwiConsts from '@/const/kiwiConsts'
import audioUtil from '../../../util/audioUtil'
import NoSleep from 'nosleep.js'
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'

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
let tokenCounter = 0

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
    Countdown: () => import('../Countdown.vue'),
    KiwiDropdown,
    KiwiDropdownItem,
    KiwiButton
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
        reviewLoading: false,        // Loading state specifically for review operations
        paraphraseVO: {},            // Current word's paraphrase data from API
        dialogVisible: false,        // Controls visibility of the word detail dialog
        showTranslation: !getStore({name: kiwiConsts.CONFIG_KEY.IS_EN_TO_EN}),  // Whether to show translations
        showWord: true,              // Whether to show the word (hidden in Chinese->English mode)
        hideTranslationPrompt: '释义已隐藏，点击灰暗区域隐藏/显示',  // Message when translations are hidden
        playIndex: 0,                // Current index in the audio sequence
        showIndex: 0,                // Current index in the word list display
        isSleepMode: false,          // Whether sleep mode is active (minimal UI)
        listId: null,                // ID of the current list being reviewed
        firstReviewWord: null,       // Previous word (for detecting repeated words)
        secondReviewWord: null,      // Current word (for detecting repeated words)
        apiKey: null,                // API key for external services
        audioPlayerUrls: [],         // Array of all audio URLs in the current sequence
        audioPlayerMap: new Map(),   // Map of URL to Audio objects for reuse
        audioPlayer: null,           // Current active audio player
        audioPlayerToken: null,      // Token to track audio session validity
        isUnfoldOperateIcon: false,  // Controls visibility of operation icons
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
      countdownText: '1小时'          // Display text for countdown
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
    this.pauseAllPlayingAudio()
    // Revoke blob URLs and release audio objects
    this.detail.audioPlayerUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    this.detail.audioPlayerMap.clear()
    this.detail.audioPlayer = null
    this.detail.audioPlayerUrls = []
    noSleep.disable()
    this.detail.isEnableNoSleepMode = false
    // Remove visibilitychange listener
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler)
      this._visibilityHandler = null
    }
  },
  watch: {
    'listId'() {
      this.init()
    },
    'playWordIndex'(newVal) {
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
      this._visibilityHandler = () => {
        if (document.hidden) {
          this.isReviewStop = true
          this.isReviewPlaying = false
          this.pauseAllPlayingAudio()
        } else {
          this.isReviewStop = false
          this.isReviewPlaying = true
        }
      }
      document.addEventListener('visibilitychange', this._visibilityHandler)
    },
    async init() {
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
        const data = response.data.data
        // Handle both old format (records) and new format (content)
        this.listItems = data.content || data.records
        this.page.pages = data.totalPages || data.pages
        this.page.total = data.totalElements || data.total
        // API returns 0-indexed page number, convert to 1-indexed if needed
        this.page.current = data.number !== undefined ? data.number + 1 : data.current
      }).catch(e => {
        console.error(e)
      })
    },
    async initList() {
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
      return this.detail.firstReviewWord === this.detail.secondReviewWord
    },
    handoffReviewWordSame() {
      this.detail.firstReviewWord = this.detail.secondReviewWord
      this.detail.secondReviewWord = this.detail.paraphraseVO.wordName
    },
    async initNextReviseDetail(isGetDetail) {
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
          audio.src = '/api/word/pronunciation/downloadVoice/' + id
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
        return '/api/word/pronunciation/downloadVoice/' + first.pronunciationId
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
      this.detail.audioPlayerMap.forEach((audioObj) => {
        if (audioObj.paused) {
          return
        }
        audioObj.pause()
      })
    },
    skipSomeAudio: function () {
      this.pauseAllPlayingAudio()
      const isFirstSkip = this.detail.skippedCount % 2 === 0
      this.detail.skippedCount++
      if (!this.isChToEn) {
        if (this.isLastReviewWordSame()) {
          const skipIndex = isFirstSkip ? skipWorkSpellingIndexWhenLastIsSameEn2Ch : skipWorkSpellingIndexWhenLastIsSameEn2Ch_2nd
          this.detail.playIndex = skipIndex
          this.detail.audioPlayer = this.getCurrentAudioPlayer(skipIndex)
        } else {
          const skipIndex = isFirstSkip ? skipWorkSpellingIndexEn2Ch : skipWorkSpellingIndexEn2Ch_2nd
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
      if (this.detail.audioPlayer) {
        this.detail.audioPlayer.play()
      }
    },
    async showNext(isSkipSomeAudio) {
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
      // alert('skipCurrent this.detail.showIndex = ' + this.detail.showIndex)
      // alert('skipCurrent this.playWordIndex = ' + this.playWordIndex)
      // alert('skipCurrent this.page.size = ' + this.page.size)
      try {
        if (this.isChToEn) {
          this.detail.showWord = false
        }
        // In review mode, use playWordIndex; in non-review mode, use showIndex
        let lastIndexPerPage = this.isReview
            ? this.isLastIndexPerPage()
            : this.detail.showIndex >= this.listItems.length
        let lastPage = this.isLastPage()
        // 最后一页条目数可能小于每页条目数
        if (lastPage) {
          let lastPageRemainder = this.page.total % this.page.size
          // Check if we've reached the end of the current page's items
          let isAtEndOfPage = this.isReview
              ? lastIndexPerPage
              : this.detail.showIndex >= this.listItems.length
          if (isAtEndOfPage || (lastPageRemainder !== 0 && this.detail.showIndex >= lastPageRemainder)) {
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
      // Revoke blob URLs to prevent memory leaks
      this.detail.audioPlayerUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      this.reviseAudioCandidates = []
      this.detail.firstReviewWord = null
      this.detail.secondReviewWord = null
      this.detail.paraphraseVO = {}
      this.detail.dialogVisible = false
      this.detail.audioPlayerToken = ++tokenCounter
      this.detail.audioPlayerMap.clear()
      this.detail.audioPlayerUrls = []
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
      let paraphraseId = this.detail.paraphraseVO.paraphraseId
      let wordId = this.detail.paraphraseVO.wordId
      let wordCharacter = this.detail.paraphraseVO.wordCharacter
      let ukPronunciationUrl = this.assemblePronunciationUrl(false)
      let usPronunciationUrl = this.assemblePronunciationUrl(true)

      // Choose appropriate audio sequence based on mode
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
      let idx = (index !== undefined && index !== null) ? index : this.detail.playIndex
      return this.detail.audioPlayerMap.get(this.detail.audioPlayerUrls[idx])
    },
    setSoundListener: function (sound, token) {
      sound.addEventListener('ended', async function () {
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

        // Crucial part - check if we should continue playback
        if (token !== that.detail.audioPlayerToken || that.isReviewStop) {
          return
        }
        if (++that.detail.playIndex < that.detail.audioPlayerUrls.length) {
          that.detail.audioPlayer = that.getCurrentAudioPlayer()
          if (!that.detail.audioPlayer) {
            ++that.playWordIndex
            return
          }
          that.detail.audioPlayer.play()
        } else {
          ++that.playWordIndex
        }
      })
      sound.addEventListener('play', function () {
        // console.log('onplay: ' + urls[that.detail.playIndex])
        // that.notifySuccess(that, 'play ' + i)
        that.isReviewPlaying = true
        that.detail.reviewLoading = false
      })
      sound.addEventListener('pause', function () {
        that.isReviewPlaying = false
      })
      sound.addEventListener('error', function () {
        that.isReviewPlaying = false
        that.detail.reviewLoading = false
        if (token !== that.detail.audioPlayerToken || that.isReviewStop) {
          return
        }
        // Advance past failed audio to prevent review from getting stuck
        if (++that.detail.playIndex < that.detail.audioPlayerUrls.length) {
          that.detail.audioPlayer = that.getCurrentAudioPlayer()
          if (that.detail.audioPlayer) {
            that.detail.audioPlayer.play()
          } else {
            ++that.playWordIndex
          }
        } else {
          ++that.playWordIndex
        }
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
      await audioUtil.rebuildUrls(urls)

      // Token may have changed during async rebuild — abandon stale queue
      if (token !== this.detail.audioPlayerToken) {
        return []
      }

      this.detail.audioPlayerUrls = urls

      if (this.isDownloadReviewAudio) {
        let msg = `${this.detail.paraphraseVO.wordName} audio resources successfully downloaded`;
        this.msgSuccess(this, msg, 4000)
      }

      this.detail.playIndex = 0
      for (let i = 0; i < this.detail.audioPlayerUrls.length; i++) {
        // noinspection JSUnusedGlobalSymbols
        let sound = this.detail.audioPlayerMap.get(urls[i]);
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

          this.detail.audioPlayerMap.set(urls[i], sound)
        }
      }
    },

  }
}
</script>

<template>
  <div class="list-container" v-loading="loading">
    <div style="z-index: 1;">
      <el-card v-if="isReview" class="box-card timer-card">
        <div>
          <KiwiDropdown @command="countdownSelectHandle" class="timer-dropdown">
            <span class="timer-trigger">
              <i class="el-icon-stopwatch"></i>
              <span>{{ countdownText }}</span>
              <i class="el-icon-arrow-down"></i>
            </span>
            <template slot="dropdown">
              <KiwiDropdownItem :command="{text:'1小时',m:60}">1小时</KiwiDropdownItem>
              <KiwiDropdownItem :command="{text:'2小时',m:120}">2小时</KiwiDropdownItem>
              <KiwiDropdownItem :command="{text:'10分钟',m:10}">10分钟</KiwiDropdownItem>
              <KiwiDropdownItem :command="{text:'20分钟',m:20}">20分钟</KiwiDropdownItem>
              <KiwiDropdownItem :command="{text:'30分钟',m:30}">30分钟</KiwiDropdownItem>
            </template>
          </KiwiDropdown>
        </div>
        <div v-if="countdownMode">
          <br/>
          <Countdown :endTime="countdownTime"
                     @endFun="countdownEndFun"></Countdown>
        </div>
      </el-card>
      <el-collapse v-for="(item, index) in listItems" :key="item.paraphraseId || index" accordion class="kiwi-collapse">
        <el-collapse-item :title="item.wordName" :name="item.wordId">
          <div class="collapse-content">
            <p class="paraphrase-english">
              {{ item.paraphraseEnglish }}
            </p>
            <div class="paraphrase-translation">
              {{ isShowParaphrase ? item.meaningChinese : '释义已隐藏' }}
            </div>
            <div class="collapse-actions">
              <KiwiButton class="collapse-action-button info"
                         type="text"
                         size="mini"
                         @click="showDetail(item.paraphraseId, index)"
                         title="查看详情">
                <i class="el-icon-more-outline"></i>
              </KiwiButton>
              <KiwiButton class="collapse-action-button danger"
                         type="text"
                         size="mini"
                         @click="removeParaphraseStarListFun(item.paraphraseId, item.listId)"
                         title="从收藏移除">
                <i class="el-icon-remove-outline"></i>
              </KiwiButton>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <el-pagination
          v-if="isShowPagination"
          class="list-pagination"
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
          custom-class="paraphrase-detail-dialog"
          width="100%">
        <div slot="title" class="dialog-title-bar">
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
              <span class="sleep-tip-badge"><i class="el-icon-right"/>&nbsp;右滑跳过</span>
              <br/>
              <span class="sleep-tip-badge"><i class="el-icon-back"/>&nbsp;左滑记住</span>
              <br/>
              <span class="sleep-tip-badge"><i class="el-icon-thumb"/>&nbsp;单击从头开始听当前单词/当音频卡住时也可用
              </span>
              <br/>
              <span class="sleep-tip-badge"><i class="el-icon-top"/>&nbsp;上滑暂停当前播放单词</span>
              <br/>
              <span class="sleep-tip-badge"><i class="el-icon-bottom"/>&nbsp;下滑跳过spelling</span>
              <br/>
              <span class="sleep-tip-badge"><i class="el-icon-document-copy"/>&nbsp;滑动两边或者底部白色区域可以下拉或者上拉
              </span>
            </div>
          </v-touch>
          <el-divider v-if="detail.isSleepMode"></el-divider>
          <span class="word-spelling" @click="detail.showWord = !detail.showWord">
            {{ showWordSpelling }}
          </span>
          &nbsp
          <KiwiButton type="info"
                     v-if="isReview && detail.isSleepMode"
                     @click="switchSleepMode"
                     size="mini">
            <i class="el-icon-thumb"></i>
          </KiwiButton>
        </div>

        <!-- Detail content card (lightweight, custom styled) -->
        <div class="detail-card">
          <!-- Meta tags row -->
          <div class="detail-meta" v-if="detail.paraphraseVO.paraphraseId">
            <span class="meta-tag" v-if="detail.paraphraseVO.wordCharacter">{{ detail.paraphraseVO.wordCharacter }}</span>
            <span class="meta-tag" v-if="detail.paraphraseVO.wordLabel && detail.paraphraseVO.wordLabel !== ''">
              {{ detail.paraphraseVO.wordLabel }}
            </span>
          </div>

          <!-- Pronunciations -->
          <div class="pronunciations" v-if="!detail.paraphraseVO.isOverlength && detail.paraphraseVO.pronunciationVOList">
            <span class="pronunciation-badge"
                  v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList"
                  :key="wordPronunciationVO.pronunciationId"
                  @click="playPronunciation(wordPronunciationVO.pronunciationId, wordPronunciationVO.sourceUrl, wordPronunciationVO.soundmarkType)">
              {{ wordPronunciationVO.soundmark }}[{{ wordPronunciationVO.soundmarkType }}]
              <i v-if="wordPronunciationVO.soundmarkType === 'UK'" v-show="!isUKPronunciationPlaying" class="el-icon-video-play"></i>
              <i v-if="wordPronunciationVO.soundmarkType === 'US'" v-show="!isUSPronunciationPlaying" class="el-icon-video-play"></i>
              <i v-if="wordPronunciationVO.soundmarkType === 'UK'" v-show="isUKPronunciationPlaying" class="el-icon-loading"></i>
              <i v-if="wordPronunciationVO.soundmarkType === 'US'" v-show="isUSPronunciationPlaying" class="el-icon-loading"></i>
            </span>
          </div>
          <div v-if="detail.paraphraseVO.isOverlength && detail.paraphraseVO.pronunciationVOList">
            <div class="pronunciations" v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList" :key="wordPronunciationVO.pronunciationId">
              <span class="pronunciation-badge"
                    @click="playPronunciation(wordPronunciationVO.pronunciationId, wordPronunciationVO.sourceUrl, wordPronunciationVO.soundmarkType)">
                {{ wordPronunciationVO.soundmark }}[{{ wordPronunciationVO.soundmarkType }}]
                <i v-if="wordPronunciationVO.soundmarkType === 'UK'" v-show="!isUKPronunciationPlaying" class="el-icon-video-play"></i>
                <i v-if="wordPronunciationVO.soundmarkType === 'US'" v-show="!isUSPronunciationPlaying" class="el-icon-video-play"></i>
                <i v-if="wordPronunciationVO.soundmarkType === 'UK'" v-show="isUKPronunciationPlaying" class="el-icon-loading"></i>
                <i v-if="wordPronunciationVO.soundmarkType === 'US'" v-show="isUSPronunciationPlaying" class="el-icon-loading"></i>
              </span>
            </div>
          </div>

          <!-- Paraphrase main content & translation (click to toggle) -->
          <div class="paraphrase-content" @click="detail.showTranslation = !detail.showTranslation">
            <div class="phrase-list" v-if="detail.paraphraseVO.phraseList && detail.paraphraseVO.phraseList.length">
              <span v-for="(phrase, idx) in detail.paraphraseVO.phraseList" :key="idx" class="phrase-chip">{{ phrase }}</span>
            </div>
            <p class="paraphrase-codes" v-if="detail.paraphraseVO.codes">{{ this.detail.paraphraseVO.codes }}</p>
            <div class="paraphrase-english-text">
              {{ this.detail.paraphraseVO.paraphraseEnglish }}
            </div>
            <div class="translation-box">
              {{ detail.showTranslation ? detail.paraphraseVO.meaningChinese : detail.hideTranslationPrompt }}
            </div>
          </div>

          <!-- Examples -->
          <div v-if="enableParaphraseExamples" class="info-notice">该释义暂时没有例句</div>

          <div v-for="wordParaphraseExampleVO in this.detail.paraphraseVO.exampleVOList"
               :key="wordParaphraseExampleVO.exampleId || wordParaphraseExampleVO.exampleSentence"
               class="example-item"
               @click="detail.showTranslation = !detail.showTranslation">
            <div class="example-title">{{ wordParaphraseExampleVO.exampleSentence }}</div>
            <div class="example-translation">
              {{ detail.showTranslation ? wordParaphraseExampleVO.exampleTranslate : '释义已经隐藏，点击该区域显示/隐藏' }}
            </div>
          </div>

          <div style="margin-top: 100px"></div>
        </div>
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
          <KiwiButton type="info" @click="stockReviewStart">确定（继续上次复习）</KiwiButton>
        </div>
      </el-dialog>
    </div>
    <div v-if="enableOperationIcon"
         style="position: fixed; bottom: 15px; right: 15px; z-index: 2147483646; text-align: right; line-height: 30px;">
      <KiwiButton v-if="enableShowDetailIcon" type="info" size="mini"
                 @click="showDetail(detail.paraphraseVO.paraphraseId, detail.showIndex)">
        <i class="el-icon-document"></i>
      </KiwiButton>
      <KiwiButton type="info"
                 v-if="enableSleepModeIcon"
                 @click="switchSleepMode"
                 size="mini">
        <i class="el-icon-thumb"></i>
      </KiwiButton>
      <KiwiButton type="info" size="mini" v-if="showPreviousPageIcon" @click="previousPageFun">
        <i class="el-icon-d-arrow-left"></i>
      </KiwiButton>
      <KiwiButton v-if="showNextPageIcon"
                 type="info" size="mini" @click="nextPageFun">
        <i class="el-icon-d-arrow-right"></i>
      </KiwiButton>

      <br/>
      <KiwiButton v-if="enableSkipSomeAudioIcon" type="info" size="mini"
                 @click="showNext(true)">
        <i class="el-icon-finished"></i>
      </KiwiButton>
      <KiwiButton v-if="enableStopwatchIcon" type="info" size="mini" @click="switchStopWatchMode">
        <i class="el-icon-stopwatch" v-if="!countdownMode"></i>
        <i class="el-icon-switch-button" v-if="countdownMode"></i>
      </KiwiButton>
      <KiwiButton v-if="enableShowPreviousIcon" type="info" size="mini" @click="showPrevious">
        <i class="el-icon-arrow-left"></i>
      </KiwiButton>
      <KiwiButton v-if="enableShowNextIcon" type="info" size="mini" @click="showNext(false)">
        <i class="el-icon-arrow-right"></i>
      </KiwiButton>
      <KiwiButton type="info"
                 v-if="enableStopPlayingIcon"
                 @click="stopPlaying"
                 size="mini">
        <i class="el-icon-video-pause"></i>
      </KiwiButton>
      <KiwiButton type="info"
                 v-if="enableRefreshReviseDetailIcon"
                 @click="refreshReviseDetail"
                 size="mini">
        <i class="el-icon-brush"></i>
      </KiwiButton>

      <br/>

      <KiwiButton v-if="isStockReviewModel && !detail.isUnfoldOperateIcon"
                 type="info" size="mini" @click="rememberOneFun">
        <i class="el-icon-success"></i>
      </KiwiButton>
      <KiwiButton
          v-if="isEnhanceReviewModel && !detail.isUnfoldOperateIcon"
          type="info" size="mini" @click="keepInMindFun">
        <i class="el-icon-medal"></i>
      </KiwiButton>
      <KiwiButton type="info" v-if="detail.paraphraseVO.wordName && !detail.isUnfoldOperateIcon"
                 size="mini" @click="handleShowDetail">
        <i class="el-icon-open"></i>
      </KiwiButton>
      <KiwiButton
          v-if="detail.paraphraseVO.paraphraseId && !detail.isUnfoldOperateIcon"
          type="info" size="mini" @click="forgetOneFun">
        <i class="el-icon-question"></i>
      </KiwiButton>
      <KiwiButton type="info" size="mini"
                 @click="detail.isUnfoldOperateIcon = !detail.isUnfoldOperateIcon">
        <i class="el-icon-s-unfold" v-if="!detail.isUnfoldOperateIcon"></i>
        <i class="el-icon-s-fold" v-if="detail.isUnfoldOperateIcon"></i>
      </KiwiButton>

    </div>
  </div>
</template>

<style scoped>
.list-container {
  margin: 20px 0 10px;
  padding: 0 4px;
}

/* Ensure any top buttons/toolbar doesn't overlap the list */
.list-container .kiwi-collapse:first-of-type {
  margin-top: 6px;
}

/* Dialog title bar spacing to avoid overlap with content */
.dialog-title-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Timer card - glassmorphic design */
.timer-card {
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  box-shadow: var(--shadow-card);
  margin-bottom: 16px;
  padding: 16px;
}

/* Timer dropdown styling */
.timer-dropdown .timer-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--gradient-info);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: 0 2px 12px rgba(var(--color-info-rgb), 0.35);
  position: relative;
  overflow: hidden;
}

.timer-dropdown .timer-trigger::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s ease;
}

.timer-dropdown .timer-trigger:hover::before {
  left: 100%;
}

.timer-dropdown .timer-trigger i {
  font-size: 18px;
}

.timer-dropdown .timer-trigger .el-icon-arrow-down {
  font-size: 12px;
  margin-left: 4px;
  transition: transform var(--transition-fast);
}

.timer-dropdown .timer-trigger:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 20px rgba(var(--color-info-rgb), 0.45);
  transform: translateY(-1px);
}

/* Collapse card styling - modern glassmorphic design */
::v-deep .kiwi-collapse .el-collapse-item {
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 14px;
  transition: var(--transition-fast);
}

::v-deep .kiwi-collapse .el-collapse-item:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

::v-deep .kiwi-collapse .el-collapse-item__header {
  padding: 16px 20px;
  background: var(--bg-container);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid var(--border-color-light);
  transition: var(--transition-fast);
  position: relative;
}

::v-deep .kiwi-collapse .el-collapse-item__header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--gradient-primary);
  border-radius: 0 4px 4px 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

::v-deep .kiwi-collapse .el-collapse-item__header:hover {
  color: var(--color-primary);
  background: var(--bg-highlight);
}

::v-deep .kiwi-collapse .el-collapse-item__header:hover::before {
  opacity: 1;
}

::v-deep .kiwi-collapse .el-collapse-item.is-active > .el-collapse-item__header {
  color: var(--color-primary);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

::v-deep .kiwi-collapse .el-collapse-item.is-active > .el-collapse-item__header::before {
  opacity: 1;
}

::v-deep .kiwi-collapse .el-collapse-item__wrap {
  background: var(--bg-card);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
}

::v-deep .kiwi-collapse .el-collapse-item__content {
  padding: 20px;
  color: var(--text-primary);
}

.collapse-content {
  line-height: 1.8;
}

.paraphrase-english {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.7;
}

.paraphrase-translation {
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: 14px;
  color: var(--text-secondary);
  font-size: 14px;
  transition: var(--transition-fast);
}

.paraphrase-translation:hover {
  border-color: var(--border-color);
  background: var(--bg-highlight);
}

.collapse-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color-light);
}

.collapse-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #fff !important;
  background: var(--gradient-primary) !important;
  border: none !important;
  border-radius: var(--radius-md) !important;
  padding: 0 !important;
  transition: var(--transition-fast);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.25);
}

.collapse-action-button i {
  font-size: 16px;
}

.collapse-action-button.info {
  background: var(--gradient-info) !important;
  box-shadow: 0 2px 8px rgba(var(--color-info-rgb), 0.25);
}

.collapse-action-button.danger {
  background: var(--gradient-danger) !important;
  box-shadow: 0 2px 8px rgba(var(--color-danger-rgb), 0.25);
}

.collapse-action-button:hover {
  filter: brightness(1.1);
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-glow);
}

.collapse-action-button:active {
  transform: translateY(0) scale(0.98);
}

.list-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* Detail dialog content styles - modern card design */
.detail-card {
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  box-shadow: var(--shadow-card);
  padding: 20px;
  margin-bottom: 100px;
}

.detail-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  background: var(--gradient-primary);
  color: #fff;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.25);
}

.pronunciations {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.pronunciation-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: var(--transition-fast);
}

.pronunciation-badge:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
  box-shadow: var(--shadow-sm);
}

.pronunciation-badge i {
  font-size: 14px;
}

.paraphrase-content {
  margin-top: 8px;
}

.phrase-list {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.phrase-chip {
  display: inline-flex;
  align-items: center;
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-xl);
  padding: 4px 12px;
  font-size: 12px;
  transition: var(--transition-fast);
}

.phrase-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

::v-deep .paraphrase-detail-dialog {
  background: var(--bg-body);
}

::v-deep .paraphrase-detail-dialog .el-dialog__header {
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  border-bottom: 1px solid var(--border-color-light);
  padding: 16px 20px;
}

::v-deep .paraphrase-detail-dialog .el-dialog__body {
  background: var(--bg-body);
  color: var(--text-primary);
  padding: 20px;
}

::v-deep .paraphrase-detail-dialog .el-dialog__close {
  color: var(--text-secondary);
  font-size: 20px;
}

::v-deep .paraphrase-detail-dialog .el-dialog__close:hover {
  color: var(--color-primary);
}

.paraphrase-codes {
  color: var(--text-muted);
  font-size: 13px;
  margin: 4px 0 8px 0;
  font-style: italic;
}

.paraphrase-english-text {
  word-wrap: break-word;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.8;
}

.translation-box {
  margin-top: 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: 16px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  cursor: pointer;
  transition: var(--transition-fast);
}

.translation-box:hover {
  border-color: var(--border-color);
  background: var(--bg-highlight);
}

.info-notice {
  margin-top: 16px;
  background: rgba(var(--color-success-rgb), 0.08);
  border: 1px dashed var(--color-success);
  color: var(--color-success);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  text-align: center;
  font-size: 14px;
}

.example-item {
  margin-top: 16px;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  padding: 16px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.example-item:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.example-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  font-size: 15px;
  line-height: 1.6;
}

.example-translation {
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-sm);
  padding: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  transition: var(--transition-fast);
}

.example-translation:hover {
  border-color: var(--border-color);
}

.word-spelling {
  font-size: 20px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.word-spelling:hover {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
}

.sleep-tip-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 13px;
  margin: 4px;
  backdrop-filter: blur(4px);
}

.sleep-tip-badge i {
  font-size: 16px;
}

/* Floating action buttons - improved styling */
.list-container > div[style*="position: fixed"] {
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  padding: 12px;
  box-shadow: var(--shadow-card);
}

@media (max-width: 768px) {
  ::v-deep .kiwi-collapse .el-collapse-item__header {
    padding: 14px 16px;
    font-size: 14px;
  }

  ::v-deep .kiwi-collapse .el-collapse-item__content {
    padding: 16px;
  }

  .paraphrase-english {
    font-size: 14px;
  }

  .detail-card {
    padding: 16px;
    margin-bottom: 80px;
  }

  .collapse-action-button {
    width: 32px;
    height: 32px;
  }

  .collapse-action-button i {
    font-size: 14px;
  }

  .word-spelling {
    font-size: 18px;
  }

  .example-title {
    font-size: 14px;
  }

  .translation-box,
  .example-translation {
    padding: 12px;
    font-size: 14px;
  }
}

/* Animation for collapse items */
::v-deep .kiwi-collapse .el-collapse-item {
  animation: fadeSlideIn 0.3s ease;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* TTS Audio Generation Progress */
.audio-generation-progress {
  margin-top: 14px;
  padding: 12px;
  background: rgba(var(--color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-md);
}

.audio-generation-progress .progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.audio-generation-progress .progress-info i {
  color: var(--color-primary);
  font-size: 16px;
}

.audio-generation-progress .progress-bar {
  height: 6px;
  background: var(--bg-container);
  border-radius: 3px;
  overflow: hidden;
}

.audio-generation-progress .progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* TTS Audio Status Indicator */
.audio-status-indicator {
  margin-top: 14px;
}

.audio-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
}

.audio-status-badge.available {
  background: rgba(var(--color-success-rgb), 0.12);
  color: var(--color-success);
  border: 1px solid rgba(var(--color-success-rgb), 0.25);
}

.audio-status-badge.generating {
  background: rgba(var(--color-primary-rgb), 0.12);
  color: var(--color-primary);
  border: 1px solid rgba(var(--color-primary-rgb), 0.25);
}

.audio-status-badge.unavailable {
  background: rgba(var(--color-warning-rgb), 0.12);
  color: var(--color-warning);
  border: 1px solid rgba(var(--color-warning-rgb), 0.25);
}

.audio-status-badge i {
  font-size: 14px;
}
</style>
