<script>
import {getStore, setStore} from '@/util/store'
import msgUtil from '@/util/msg'
import wordSearch from '@/api/wordSearch'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'
import audioPlay from '@/api/audioPlay'
import wordStarList from '@/api/wordStarList'
import kiwiConsts from "@/const/kiwiConsts";
import kiwiConst from "@/const/kiwiConsts";

let that

let index = 0

export default {
  name: 'wel',
  components: {
    Countdown: $ => import('./Countdown')
  },
  data() {
    return {
      loading: false,
      windowInnerHeight: window.innerHeight,
      dialogHelpVisible: false,
      isShowParaphrase: !getStore({name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN}),
      isShowExample: true,
      isUKPronunciationPlaying: false,
      isUSPronunciationPlaying: false,
      pronunciationAudioMap: new Map(),
      devSwitch: false,
      defaultHint: null,
      keyword: null,
      wordInfo: {
        wordName: ''
      },
      audioList: [],
      autoWordList: [],
      autoPlayDialogVisible: false,
      collect: {
        type: '',
        listSelectDialogVisible: false,
        starListData: [],
        paraphraseStars: getStore({name: 'paraphrase_stars'}),
        wordStars: getStore({name: 'word_stars'}),
        exampleStars: getStore({name: 'example_stars'}),
        paraphraseCollectMap: new Map(),
        dialogTitle: '',
        collectId: 0
      },
      showCharacterId: 0,
      showCharacter: true,
      countdownTime: 0,
      isForceRequest: true,

      showWordSelect: false,
      wordInfoList: [],
      isTabActivate: true,

      current: 0,
      size: 10,
      pages: 0,
      total: 0
    }
  },
  beforeCreate: function () {
    that = this
  },
  computed: {
    isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent)
    },
    isLogin() {
      let accessToken = getStore({name: 'access_token'})
      return !!accessToken
    },
    getDateOn8Sec() {
      return new Date().getTime() + 1000 * 10
    },
    getWordNameStyle() {
      if (this.getWindowWidth < 350) {
        return `font-family: 'Helvetica Neue'; font-size: large;`
      }
      return `font-family: 'Helvetica Neue'; font-size: xx-large;`
    },
    getWindowWidth() {
      return window.innerWidth
    },
    isSmallWindow() {
      return window.innerWidth <= 400
    },
    isLargeWindow() {
      return window.innerWidth >= 800
    }
  },
  mounted() {
    // Fix for iPhone Safari: Don't use async in mounted hook
    // Use nextTick and proper error handling instead
    this.$nextTick(async () => {
      try {
        await this.init()
        // await this.initPronunciation()
      } catch (e) {
        console.warn('Initialization failed:', e)
        // Fallback initialization for iOS
        if (this.isIOS) {
          this.$message({
            message: 'Loading content...',
            type: 'info',
            duration: 2000
          })
          // Try again with a delay
          setTimeout(() => {
            this.init().catch(err => {
              console.warn('Delayed initialization also failed:', err)
            })
          }, 1000)
        }
      }
    })
  },
  watch: {
    '$route'() {
      this.initTabActivate()
      if (this.isTabActivate) {
        this.init()
      }
    }
  },
  methods: {
    ...msgUtil,
    ...wordSearch,
    ...wordStarList,
    ...paraphraseStarList,
    ...exampleStarList,
    async initTabActivate() {
      // 标记当前Tab被激活显示
      let active = this.$route.query.active
      this.isTabActivate = !active || active === 'search'
      this.showWordSelect = false
    },
    async init() {
      try {
        // clean data
        this.showCharacterId = 0

        let mode = this.$route.query.mode
        let listType = this.$route.query.listType
        if ('stockReview' === mode && 'word' === listType) {
          let listId = this.$route.query.listId
          if (listId) {
            await wordStarList.findAllWordId(listId).then(response => {
              if (response.data.code) {
                let wordIdList = response.data.data
                this.stockReview(wordIdList)
              }
            }).catch(e => {
              console.warn('Stock review initialization failed:', e)
              // Continue with fallback instead of crashing
              this.initDetail('').catch(fallbackError => {
                console.warn('Fallback initialization also failed:', fallbackError)
              })
            })
          }
        } else {
          await this.initDetail('')
        }
      } catch (e) {
        console.warn('Init method failed:', e)
        // iOS-specific error handling
        if (this.isIOS) {
          this.$message({
            message: 'Content loading encountered an issue. Retrying...',
            type: 'warning',
            duration: 3000
          })
          // Try a simplified initialization
          setTimeout(() => {
            this.initDetail('').catch(retryError => {
              console.warn('Retry initialization failed:', retryError)
              this.$message({
                message: 'Some features may not be available on this device',
                type: 'info',
                duration: 5000
              })
            })
          }, 2000)
        }
      }
    },
    async initDetail(w) {
      let word = w
      if (this.$route.query.originalText) {
        word = decodeURIComponent(this.$route.query.originalText)
      }
      if (word === this.wordInfo.wordName || !word) {
        return
      }
      // 倒计时第二次刷新页面时要重新请求数据
      if (this.countdownTime < 1 && !this.isForceRequest) {
        // 搜索中文时不要重复用同样的参数调用相同的接口
        if (/.*[\u4e00-\u9fa5]+.*$/.test(word)) {
          if (word === this.keyword) {
            return
          }
        } else {
          // 关键词改变时清空搜索列表
          this.wordInfoList = []
        }
      }

      await this.queryWordDetail(word, this.current, this.size).then(response => {
        if (response.data.code && response.data.data.records && response.data.data.records.length > 0) {
          if (response.data.data.records.length > 1) {
            this.wordInfoList = response.data.data.records
            this.initTabActivate()
            if (this.isTabActivate) {
              this.showWordSelect = true
            }
          } else {
            this.wordInfo = response.data.data.records[0]
            this.defaultHint = null
          }
          this.pages = response.data.data.pages
          this.total = response.data.data.total
          this.isForceRequest = false
        } else {
          let originalText = this.$route?.query?.originalText ? decodeURIComponent(this.$route.query.originalText) : ''
          // Preserve all existing URL parameters when navigating to AI response detail
          // but ensure we use a valid AI mode instead of 'detail' mode
          const preservedQuery = {
            ...this.$route.query, // Preserve all existing parameters
            active: 'search',
            selectedMode: kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value, // Always use valid AI mode
            language: getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) ? getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) : kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
            originalText: encodeURI(originalText.toLowerCase()),
            now: new Date().getTime()
          }
          this.$router.push({
            path: '/index/tools/aiResponseDetail',
            query: preservedQuery
          })
        }
        this.keyword = word
      }).catch(e => {
        console.error(e)
      })
    },
    agileShowDetail(wordInfo) {
      this.wordInfo = wordInfo
      this.defaultHint = null
      this.showWordSelect = false
    },
    async playDetail2Audio() {
      try {
        let audioList = []
        let autoWordList = []
        if (this.wordInfo.characterVOList) {
          let characterVOList = this.wordInfo.characterVOList
          for (let i = 0; i < characterVOList.length; i++) {
            let pronunciationVOList = characterVOList[i].pronunciationVOList
            for (let j = 0; j < pronunciationVOList.length; j++) {
              try {
                let audio = new Audio()
                audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + pronunciationVOList[j].pronunciationId
                
                // Add error handling for audio creation
                audio.addEventListener('error', (e) => {
                  console.warn('Audio creation failed:', e)
                })
                
                audioList.push(audio)
                autoWordList.push(this.wordInfo)
              } catch (audioError) {
                console.warn('Failed to create audio for playback:', audioError)
                // Continue with other audio files instead of crashing
              }
            }
          }
        }
        this.audioList = audioList
        this.autoWordList = autoWordList
        
        // iOS warning for auto-play limitations
        if (this.isIOS && audioList.length > 0) {
          console.info('iOS detected: Audio auto-play may require user interaction')
        }
      } catch (e) {
        console.warn('Audio preparation failed:', e)
        // Don't crash the app, just continue without audio
        this.audioList = []
        this.autoWordList = []
      }
    },
    async initPronunciation() {
      try {
        if (this.wordInfo.characterVOList) {
          let characterVOList = this.wordInfo.characterVOList
          for (let i = 0; i < characterVOList.length; i++) {
            let pronunciationVOList = characterVOList[i].pronunciationVOList
            for (let j = 0; j < pronunciationVOList.length; j++) {
              try {
                let audio = new Audio()
                audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + pronunciationVOList[j].pronunciationId
                
                // Add error handling for audio loading
                audio.addEventListener('error', (e) => {
                  console.warn('Audio loading failed:', e)
                })
                
                this.pronunciationAudioMap.set(pronunciationVOList[j].pronunciationId, audio)
              } catch (audioError) {
                console.warn('Failed to create audio for pronunciation:', pronunciationVOList[j].pronunciationId, audioError)
              }
            }
          }
        }
      } catch (e) {
        console.warn('Audio initialization failed on this device:', e)
        // Continue without audio instead of crashing
        if (this.isIOS) {
          this.$message({
            message: 'Audio features may be limited on this device',
            type: 'info',
            duration: 3000
          })
        }
      }
    },
    async stockReview(wordIdList) {
      for (let i = 0; i < wordIdList.length; i++) {
        let wordId = wordIdList[i]
        await this.queryWordDetailById(wordId).then(response => {
          if (response.data.code) {
            this.wordInfo = response.data.data
            this.playDetail2Audio()
          } else {
            this.wordInfo = {wordName: ''}
          }
        }).catch(e => {
          console.error(e)
        })
      }
      if (index === 0 && this.audioList.length) {
        this.autoPlayDialogVisible = true
      }
    },
    async oneWordPlay() {
      // tts.setAudioText('詹士锋个人测试')
      // tts.playTTS()
      await this.playDetail2Audio()
      await this.stockReviewStart()
    },
    stockReviewStart() {
      this.autoPlayDialogVisible = false
      // console.log(this.audioList)
      if (index === 0 && this.audioList.length) {
        // console.log(this.audioList[0])
        this.wordInfo = this.autoWordList[0]
        
        // iOS-specific handling for auto-play
        if (this.isIOS) {
          this.$message({
            message: 'Tap to start audio playback',
            type: 'info',
            duration: 3000,
            onClick: () => {
              try {
                this.audioList[0].play().catch(e => {
                  console.warn('iOS audio auto-play failed:', e)
                })
              } catch (e) {
                console.warn('iOS audio playback error:', e)
              }
            }
          })
        } else {
          // Non-iOS devices - original behavior
          try {
            this.audioList[0].play().catch(e => {
              console.warn('Audio auto-play failed:', e)
            })
          } catch (e) {
            console.warn('Audio playback error:', e)
          }
        }
      }
    },
    async playPronunciation(id, sourceUrl, soundmarkType) {
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
        
        // iOS-specific handling
        if (this.isIOS) {
          // Check if we have a pre-loaded audio
          let preloadedAudio = this.pronunciationAudioMap.get(id)
          if (preloadedAudio) {
            try {
              await preloadedAudio.play()
              return
            } catch (iosError) {
              console.warn('Pre-loaded audio failed on iOS:', iosError)
              // Fall through to create new audio with user interaction
            }
          }
          
          // For iOS, show a message instead of auto-playing
          this.$message({
            message: 'Tap here to play pronunciation',
            type: 'info',
            duration: 2000,
            onClick: async () => {
              try {
                let audio = new Audio()
                let source = getStore({name: 'pronunciation_source'})
                if (source === kiwiConsts.PRONUNCIATION_SOURCE.LOCAL) {
                  audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
                } else {
                  audio.src = sourceUrl
                }
                await audio.play()
              } catch (playError) {
                console.warn('iOS audio playback failed:', playError)
              }
            }
          })
          return
        }
        
        // Non-iOS devices - original behavior
        let audio = new Audio()
        let source = getStore({name: 'pronunciation_source'})
        if (source === kiwiConsts.PRONUNCIATION_SOURCE.LOCAL) {
          audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        } else {
          audio.src = sourceUrl
        }
        
        // Add error handling for audio loading
        audio.addEventListener('error', (e) => {
          console.warn('Audio playback failed:', e)
        })
        
        audio.pause()
        await audio.play()
      } catch (e) {
        console.warn('Audio playback error:', e)
        // Don't crash the app, just log the error
        if (this.isIOS) {
          this.$message({
            message: 'Audio playback not available on this device',
            type: 'warning',
            duration: 2000
          })
        }
      } finally {
        setTimeout(() => {
          if (soundmarkType) {
            this.isUSPronunciationPlaying = false
            this.isUKPronunciationPlaying = false
          }
        }, 1)
      }
    },
    handleChange(val) {
      // console.log(val)
    },
    getWordCollectClass() {
      if (this.collect.wordIsCollect) {
        return 'el-icon-remove-outline outline_fix'
      }
      return 'el-icon-circle-plus-outline outline_fix'
    },
    getParaphraseCollectClass(id) {
      let collectListId = this.collect.paraphraseCollectMap.get(id)
      if (collectListId != null) {
        return 'el-icon-remove-outline outline_fix_top_right'
      }
      return 'el-icon-circle-plus-outline outline_fix_top_right'
    },
    checkIsLogin() {
      if (!this.isLogin) {
        this.msgWarning(this, '请先登录再进行收藏操作')
        return false
      }
      return true
    },
    selectShowCharacter(characterId) {
      this.showCharacterId = characterId
      this.showCharacter = false
      setTimeout(() => {
        this.showCharacter = true
      }, 1)
    },
    async wordCollectClickFun() {
      if (!this.checkIsLogin()) {
        return
      }
      // 例句本从缓存读取，提高性能
      if (this.collect.wordStars && this.collect.wordStars.length > 0) {
        this.collect.wordStars = getStore({name: 'word_stars'})
      } else {
        await this.getWordStarList().then(response => {
          this.collect.wordStars = response.data.data
          setStore({
            name: 'word_stars',
            content: response.data.data,
            type: 'local'
          })
        }).catch(e => {
          console.error(e)
          this.$message.error('单词本数据加载异常')
        })
      }
      this.collect.starListData = this.collect.wordStars
      this.collect.type = 'word'
      this.collect.listSelectDialogVisible = true
      this.collect.dialogTitle = '选择想要保存的单词本'
    },
    async paraphraseCollectClickFun(paraphraseId) {
      if (!this.checkIsLogin()) {
        return
      }
      this.collect.collectId = paraphraseId
      if (this.collect.paraphraseStars && this.collect.paraphraseStars.length > 0) {
        this.collect.paraphraseStars = getStore({name: 'paraphrase_stars'})
      } else {
        await this.getParaphraseStarList().then(response => {
          this.collect.paraphraseStars = response.data.data
          setStore({
            name: 'paraphrase_stars',
            content: response.data.data,
            type: 'local'
          })
        }).catch(e => {
          console.error(e)
          this.$message.error('释义本本数据加载异常')
        })
      }
      this.collect.starListData = this.collect.paraphraseStars
      this.collect.type = 'paraphrase'
      this.collect.listSelectDialogVisible = true
      this.collect.dialogTitle = '选择想要保存的释义本'
    },
    async exampleCollectClickFun(exampleId) {
      if (!this.checkIsLogin()) {
        return
      }
      this.collect.collectId = exampleId
      // 例句本从缓存读取，提高性能
      if (this.collect.exampleStars && this.collect.exampleStars.length > 0) {
        this.collect.exampleStars = getStore({name: 'example_stars'})
      } else {
        await this.getExampleStarList().then(response => {
          this.collect.exampleStars = response.data.data
          setStore({
            name: 'example_stars',
            content: response.data.data,
            type: 'local'
          })
        }).catch(e => {
          console.error(e)
          this.$message.error('例句本数据加载异常')
        })
      }
      this.collect.starListData = this.collect.exampleStars
      this.collect.type = 'example'
      this.collect.listSelectDialogVisible = true
      this.collect.dialogTitle = '选择想要保存的例句本'
    },
    listSelectDialogHandleClose() {
      this.collect.listSelectDialogVisible = false
    },
    async selectOneList(listId) {
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      if (this.collect.type === 'word') {
        let data = {wordId: this.wordInfo.wordId, listId: listId}
        await this.putWordStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.doSuccess()
        }).catch(e => {
          console.error(e)
        })
      } else if (this.collect.type === 'paraphrase') {
        let data = {paraphraseId: this.collect.collectId, listId: listId}
        await this.putParaphraseStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.doSuccess()
        }).catch(e => {
          console.error(e)
        })
      } else if (this.collect.type === 'example') {
        let data = {exampleId: this.collect.collectId, listId: listId}
        await this.putExampleStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.doSuccess()
        }).catch(e => {
          console.error(e)
        })
      }
      loading.close()
    },
    playDetail2Audio() {
      let autoAudio = new Audio()
      autoAudio.pause()
      autoAudio.loop = false
      document.body.appendChild(autoAudio)
      audioPlay.playWordDetail(this.wordInfo, autoAudio)
      autoAudio.addEventListener('ended', function () {
        index++
        if (index >= that.audioList.length) {
          return
        }
        that.wordInfo = that.autoWordList[index]
        that.audioList[index].play()
      }, false)
      this.audioList.push(autoAudio)
      this.autoWordList.push(this.wordInfo)
    },
    doSuccess() {
      this.$message.success({
        duration: 1000,
        center: true,
        message: '操作成功'
      })
    },
    removeByWordNameFun() {
      this.$confirm('即将清除当前单词数据，重新抓取, 是否继续?', '清除操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then($ => {
        if ('' !== this.wordInfo.wordName) {
          this.removeByWordName(this.wordInfo.wordName).then(res => {
            if (res.data.code === 1) {
              this.doSuccess()
              window.location.reload()
            }
          })
        }
      })
    },
    countdownEndFun() {
      this.countdownTime++
      this.isForceRequest = true
      this.init()
    },
    async pageChange() {
      this.loading = true
      this.isForceRequest = true
      try {
        await this.init()
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
  }
}

</script>

<style>
.row-bg {
  width: 88%;
  padding-top: 10px;
  background-color: #DCDFE6;
  margin: 0 auto;
}

.box-card {
  width: 100%;
}

.outline_fix {
  position: absolute;
  right: 5px;
  bottom: 5px;
}

.outline_fix_top_right {
  position: absolute;
  top: 5px;
  right: 5px;
}

.outline_fix_top_left {
  position: absolute;
  text-align: left;
  top: 5px;
  left: 5px;
  width: 90%;
}

.outline_fix_bottom_left {
  position: absolute;
  bottom: 5px;
  left: 5px;
}

.outline_fix_bottom_left_2 {
  position: absolute;
  bottom: 5px;
  left: 25px;
}

/* Consistent Button Styling - Match AiResponseDetail.vue patterns */
.el-button {
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  padding: 8px 16px !important;
  min-width: 80px !important;
}

/* Primary button styling */
.el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  color: white !important;
}

.el-button--primary:hover:not(.is-loading) {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
  color: white !important;
}

.el-button--primary:focus {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
  color: white !important;
}

/* Info button styling */
.el-button--info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
  color: white !important;
}

.el-button--info:hover:not(.is-loading) {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3) !important;
  color: white !important;
}

.el-button--info:focus {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.3) !important;
  color: white !important;
}

/* Text button styling */
.el-button--text {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 4px 8px !important;
  min-width: auto !important;
}

.el-button--text:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Default button styling */
.el-button:not(.el-button--primary):not(.el-button--info):not(.el-button--text) {
  background: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
  color: #6c757d !important;
}

.el-button:not(.el-button--primary):not(.el-button--info):not(.el-button--text):hover:not(.is-loading) {
  background: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Mini button adjustments */
.el-button--mini {
  padding: 6px 12px !important;
  font-size: 12px !important;
  min-width: 60px !important;
}

/* Circle button adjustments */
.el-button.is-circle {
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  min-width: auto !important;
}

/* Loading state styling */
.el-button.is-loading {
  transform: none !important;
  opacity: 0.8;
}

/* Active state */
.el-button:active {
  transform: translateY(0px) !important;
}
</style>

<template>
  <el-container>
    <el-header>
      <div v-if="isTabActivate">
        <div style="position: fixed; top: 5px; right: 15px; z-index: 999;">
          <el-button v-if="!showWordSelect && wordInfoList.length>1" size="mini" @click="showWordSelect = true" circle>
            <i class="el-icon-s-unfold"
               style="color: #76838f;"></i>
          </el-button>
        </div>
        <div style="position: fixed; bottom: 5px; right: 30px; z-index: 999;">
          <el-button @click="dialogHelpVisible = !dialogHelpVisible" size="mini">
            <i class="el-icon-warning"
               style="color: #76838f;"></i>
          </el-button>
          &nbsp;
          <el-dropdown size="mini" @command="selectShowCharacter" placement="top">
            <el-button size="mini" class="el-icon-s-operation"></el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="0">All</el-dropdown-item>
              <div v-for="wordCharacterVO in wordInfo.characterVOList">
                <el-dropdown-item :command="wordCharacterVO.characterId">
                  {{ wordCharacterVO.characterCode }}&nbsp;{{ wordCharacterVO.tag }}
                </el-dropdown-item>
              </div>
            </el-dropdown-menu>
          </el-dropdown>
          &nbsp;
          <el-button style="color: #909399" size="mini"
                     @click="isShowExample = !isShowExample">
            <i class="el-icon-sell"
               style="color: #76838f"></i>
          </el-button>
          <el-button size="mini" style="color: #909399"
                     v-if="wordInfo.wordName.length>0"
                     @click="wordCollectClickFun()">
            <i class="el-icon-circle-plus-outline"
               style="color: #76838f"></i>
          </el-button>
        </div>
        <el-dialog
            v-loading="loading"
            :title="decodeURIComponent($route.query.originalText)"
            :visible.sync="showWordSelect">
          <el-collapse>
            <el-collapse-item v-for="word in wordInfoList">
              <template slot="title">
                <el-button type="info" size="mini" @click="agileShowDetail(word)">{{ word.wordName }}</el-button>
                &nbsp;
              </template>
              <div v-for="characterVO in word.characterVOList" style="margin-bottom: -10px;">
                <p v-for="paraphraseVO in characterVO.paraphraseVOList">
                  <i class="el-icon-caret-right"></i>
                  {{ paraphraseVO.meaningChinese }}
                </p>
              </div>
            </el-collapse-item>
          </el-collapse>
          <el-pagination
              style="margin-top: 10px"
              small
              :page-size.sync="size"
              :current-page.sync="current"
              :page-count="pages"
              :pager-count="5"
              :page-sizes="[10,20,50,100]"
              layout="prev,pager,next"
              @size-change="pageChange"
              @current-change="pageChange"
              :total="total">
          </el-pagination>
        </el-dialog>
      </div>
      <div>
        <p v-if="defaultHint && defaultHint.length>0" style="color: #ed3f14">{{ defaultHint }}</p>
        <el-alert
            v-if="''!==wordInfo.wordName"
            type="info"
            effect="dark"
            :closable="false"
            center>
          <div slot="title">
            <b :style="getWordNameStyle">{{ wordInfo.wordName }}</b>
          </div>
        </el-alert>
      </div>
    </el-header>
    <el-main>
      <div v-for="wordCharacterVO in wordInfo.characterVOList" v-if="showCharacter">
        <div v-show="showCharacterId == '0' || showCharacterId == wordCharacterVO.characterId">
          <el-row type="flex" class="row-bg" justify="end">
            <el-col>
              <el-tag type="info" effect="dark"
                      v-if="wordCharacterVO.characterCode && wordCharacterVO.characterCode !== ''">
                {{ wordCharacterVO.characterCode }}
              </el-tag>
              <el-tag type="info" effect="dark" v-if="wordCharacterVO.tag && wordCharacterVO.tag !== ''">
                {{ wordCharacterVO.tag }}
              </el-tag>
              &nbsp;
              <span v-if="isLargeWindow" v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList">
                <el-tag type="info" effect="dark"
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
                &nbsp;
              </span>
            </el-col>
          </el-row>
          <el-row v-if="!isSmallWindow && !isLargeWindow"
                  type="flex" class="row-bg" justify="end">
            <el-col v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList">
              <el-tag type="info" effect="dark"
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
          <div v-if="isSmallWindow"
               v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList">
            <el-row type="flex" justify="end" class="row-bg">
              <el-col>
                <el-tag type="info" effect="dark"
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
          <div v-for="wordParaphraseVO in wordCharacterVO.paraphraseVOList">
            <el-card class="box-card">
              <div slot="header" @click="isShowParaphrase = !isShowParaphrase">
                <el-alert
                    type="info"
                    :description="isShowParaphrase ? wordParaphraseVO.meaningChinese : '释义已隐藏，点击灰暗区域隐藏/显示'"
                    :closable="false"
                    effect="dark"
                    center>
                  <div slot="title">
                    <div v-if="wordParaphraseVO.phraseList && wordParaphraseVO.phraseList.length"
                         v-for="phraseVO in wordParaphraseVO.phraseList">
                      <p>[ {{ phraseVO }} ]</p>
                    </div>
                    <p style="margin-top: 50px;">
                      {{ wordParaphraseVO.paraphraseEnglish }}
                    </p>
                    <el-button type="text" style="color: #909399">
                      <i :class="getParaphraseCollectClass(wordParaphraseVO.paraphraseId)"
                         style="color: #FFFFFF;"
                         @click.stop="paraphraseCollectClickFun(wordParaphraseVO.paraphraseId)"></i>
                    </el-button>
                    <div v-if="wordParaphraseVO.codes && wordParaphraseVO.codes.length>0"
                         class="outline_fix_top_left">
                      {{ wordParaphraseVO.codes }}
                    </div>
                  </div>
                </el-alert>
              </div>
              <el-alert
                  v-if="!isShowExample"
                  type="info"
                  title="例句已隐藏"
                  center
                  effect="light"
                  :closable="false">
              </el-alert>
              <div v-if="isShowExample">
                <div v-if="wordParaphraseVO.exampleVOList == null">
                  <el-alert
                      type="info"
                      title="该释义暂时没有例句"
                      center
                      effect="light"
                      :closable="false">
                  </el-alert>
                </div>
                <div v-for="wordParaphraseExampleVO in wordParaphraseVO.exampleVOList">
                  <el-alert
                      type="info"
                      center
                      effect="light"
                      :description="wordParaphraseExampleVO.exampleTranslate"
                      :closable="false">
                    <div slot="title">
                      {{ wordParaphraseExampleVO.exampleSentence }}
                      <el-button type="text" style="color: #909399"><i
                          class="el-icon-circle-plus-outline outline_fix"
                          style="color: #76838f"
                          @click="exampleCollectClickFun(wordParaphraseExampleVO.exampleId)"></i>
                      </el-button>
                    </div>
                  </el-alert>
                </div>
              </div>
            </el-card>
            <el-divider></el-divider>
          </div>
        </div>
      </div>
      <el-dialog
          center
          :title="collect.dialogTitle"
          :visible.sync="collect.listSelectDialogVisible"
          :before-close="listSelectDialogHandleClose">
        <el-table
            :data="collect.starListData"
            style="width: 100%">
          <el-table-column
              align="center">
            <template slot-scope="scope">
              <div slot="reference" class="name-wrapper">
                <el-button type="info" @click="selectOneList(scope.row.id)">
                  {{ scope.row.listName }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </el-main>
    <el-dialog
        title="提示"
        :visible.sync="autoPlayDialogVisible"
        width="300px">
      <span>自动复习即将开始，请确认。</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="autoPlayDialogVisible = false">取消</el-button>
    <el-button type="info" @click="stockReviewStart">确定</el-button>
  </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogHelpVisible">
      <div>
        <img width="100%" src="wordCharacter1.png"/>
        <img width="100%" src="wordCharacter2.png"/>
        <img width="100%" src="wordCharacter3.png"/>
        <img width="100%" src="wordCharacter4.png"/>
        <img width="100%" src="wordCharacter5.png"/>
        <img width="100%" src="wordCharacter6.png"/>
        <img width="100%" src="wordCharacter7.png"/>
      </div>
    </el-dialog>

  </el-container>
</template>
