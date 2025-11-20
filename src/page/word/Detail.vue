<script>
import {getStore, setStore} from '@/util/store'
import msgUtil from '@/util/msg'
import wordSearch from '@/api/wordSearch'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'
import audioPlay from '@/api/audioPlay'
import wordStarList from '@/api/wordStarList'
import kiwiConsts from '@/const/kiwiConsts'

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
      isShowParaphrase: !getStore({name: kiwiConsts.CONFIG_KEY.IS_EN_TO_EN}),
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
      if (this.shouldSkipDetailInit()) {
        return
      }
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
    shouldSkipDetailInit() {
      const currentPath = this.$route?.path
      const selectedMode = this.$route?.query?.selectedMode

      if (currentPath === kiwiConsts.ROUTES.AI_RESPONSE_DETAIL) {
        return true
      }

      if (selectedMode && selectedMode !== 'detail') {
        return true
      }

      return false
    },
    async initTabActivate() {
      // 标记当前Tab被激活显示
      let active = this.$route.query.active
      this.isTabActivate = !active || active === 'search'
      this.showWordSelect = false
    },
    async init() {
      if (this.shouldSkipDetailInit()) {
        return
      }
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
      if (this.shouldSkipDetailInit()) {
        return
      }
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
          if (this.shouldSkipDetailInit()) {
            return
          }
          const routeQuery = this.$route?.query || {}
          const originalText = routeQuery.originalText ? decodeURIComponent(routeQuery.originalText) : ''
          const aiModes = Object.values(kiwiConsts.SEARCH_AI_MODES).map(mode => mode.value)
          const selectedMode = aiModes.includes(routeQuery.selectedMode)
            ? routeQuery.selectedMode
            : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
          const storedLanguage = getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE})
          const storedNativeLanguage = getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG})
          const preservedQuery = {
            ...routeQuery,
            active: 'search',
            selectedMode,
            language: routeQuery.language || storedLanguage || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
            nativeLanguage: routeQuery.nativeLanguage || storedNativeLanguage || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
            originalText: originalText ? encodeURIComponent(originalText) : '',
            now: new Date().getTime()
          }
          this.$router.push({
            path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL,
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
    async initPronunciation() {
      try {
        if (this.wordInfo.characterVOList) {
          let characterVOList = this.wordInfo.characterVOList
          for (let i = 0; i < characterVOList.length; i++) {
            let pronunciationVOList = characterVOList[i].pronunciationVOList
            for (let j = 0; j < pronunciationVOList.length; j++) {
              try {
                let audio = new Audio()
                audio.src = `${kiwiConsts.API_BASE.WORD_BIZ}/pronunciation/downloadVoice/` + pronunciationVOList[j].pronunciationId

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
      this.playDetail2Audio()
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
        
        // Attempt to play immediately on all devices (including iOS)
        // Prefer preloaded audio if available
        let audio = this.pronunciationAudioMap.get(id) || new Audio()
        if (!(audio instanceof HTMLAudioElement)) {
          // Safety: ensure we have an Audio instance
          audio = new Audio()
        }
        let source = getStore({name: 'pronunciation_source'})
        if (!audio.src || audio.src === window.location.href) {
          if (source === kiwiConsts.PRONUNCIATION_SOURCE.LOCAL) {
            audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
          } else {
            audio.src = sourceUrl
          }
        }

        // Add error handling for audio loading
        audio.addEventListener('error', (e) => {
          console.warn('Audio playback failed:', e)
        })

        try {
          audio.pause()
          await audio.play()
        } catch (playErr) {
          console.warn('Audio play() was blocked or failed:', playErr)
          // Only show a tap prompt if playback was blocked (common on iOS without gesture)
          this.$message({
            message: 'Tap here to play pronunciation',
            type: 'info',
            duration: 2000,
            onClick: async () => {
              try {
                await audio.play()
              } catch (retryErr) {
                console.warn('Retry audio playback failed:', retryErr)
              }
            }
          })
        }
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

<template>
  <el-container>
    <el-header>
      <div class="ai-container">
        <div v-if="isTabActivate">
          <div class="floating-controls floating-controls-top">
            <el-button v-if="!showWordSelect && wordInfoList.length>1" size="mini" @click="showWordSelect = true" circle>
              <i class="el-icon-s-unfold"></i>
            </el-button>
          </div>
          <div class="floating-controls floating-controls-bottom">
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
            <el-button size="mini" @click="isShowExample = !isShowExample">
              <i class="el-icon-sell"></i>
            </el-button>
            <el-button size="mini"
                       v-if="wordInfo.wordName.length>0"
                       @click="wordCollectClickFun()">
              <i class="el-icon-circle-plus-outline"></i>
            </el-button>
          </div>
          <el-dialog
              v-loading="loading"
              :title="decodeURIComponent($route.query.originalText)"
              :visible.sync="showWordSelect"
              custom-class="word-select-dialog">
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
                background
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
              center
              class="header-title-alert">
            <div slot="title">
              <b :style="getWordNameStyle">{{ wordInfo.wordName }}</b>
            </div>
          </el-alert>
        </div>
      </div>
    </el-header>
    <el-main>
      <div class="ai-container word-detail">
        <div v-for="wordCharacterVO in wordInfo.characterVOList" v-if="showCharacter">
          <div v-show="showCharacterId == '0' || showCharacterId == wordCharacterVO.characterId">
            <el-row type="flex" class="row-bg" justify="right">
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
                    type="flex" class="row-bg" justify="right">
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
              <el-row type="flex" justify="right" class="row-bg">
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
                      <el-button type="text">
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
                        <el-button type="text"><i
                            class="el-icon-circle-plus-outline outline_fix"
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
      </div>
      <el-dialog
          center
          :title="collect.dialogTitle"
          :visible.sync="collect.listSelectDialogVisible"
          custom-class="star-list-dialog"
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
        width="300px"
        custom-class="confirm-dialog">
      <span>自动复习即将开始，请确认。</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="autoPlayDialogVisible = false">取消</el-button>
    <el-button type="info" @click="stockReviewStart">确定</el-button>
  </span>
    </el-dialog>
  </el-container>
</template>

<style scoped>
/* ==========================================
   Detail.vue — Fully refreshed styles (2025-10)
   Goals: modern, readable, responsive, accessible
   Notes: keep class hooks, enhance Element UI via deep selectors
   ========================================== */

/* Layout & rhythm */
.ai-container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 12px 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Subtle section separators for pronunciation rows */
.row-bg {
  width: 100%;
  padding: 6px 0;
  margin: 0 auto 8px auto;
  background: transparent;
  border-bottom: 1px dashed var(--border-color-light);
}

/* Floating controls — compact, glassmorphism chips */
.floating-controls {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: var(--bg-card); /* Fallback or solid base */
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  /* Optional: if we want glass effect, we can use a semi-transparent token if available, 
     but for now standardizing on card bg is safer for themes */
}
.floating-controls-top { top: 12px; right: 16px; }
.floating-controls-bottom { bottom: 12px; right: 16px; }
.floating-controls .el-button {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 20px;
  box-shadow: var(--shadow-card);
  transition: all 0.2s ease;
}
.floating-controls .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.floating-controls .el-button i[class^='el-icon-'] { color: var(--text-secondary); }
.floating-controls .el-button:hover i[class^='el-icon-'] { color: var(--color-primary); }
.floating-controls .el-button:focus { outline: 2px solid var(--color-primary); outline-offset: 1px; }

/* Page lead/title — gradient chip with the word */
.header-title-alert { margin: 12px 0 0 0; }
.header-title-alert >>> .el-alert {
  background: var(--gradient-primary);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.header-title-alert >>> .el-alert__content { padding: 14px 18px; }
.header-title-alert >>> .el-alert__title,
.header-title-alert >>> .el-alert__description { color: #ffffff; }

/* Paraphrase cards */
.box-card {
  width: 100%;
  margin: 20px 0;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.box-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }

/* Use alert as a visual header */
.box-card >>> .el-card__header { padding: 0; border-bottom: none; cursor: pointer; }
.box-card >>> .el-card__header .el-alert {
  background: var(--gradient-info);
  color: #ffffff;
  border: none;
  border-radius: 0;
  transition: filter 0.2s ease, transform 0.2s ease;
}
.box-card >>> .el-card__header .el-alert:hover { filter: brightness(1.03); transform: translateY(-1px); }
.box-card >>> .el-card__header .el-alert .el-alert__title,
.box-card >>> .el-card__header .el-alert .el-alert__description { color: #ffffff; }

/* Pronunciation chips */
.word-detail >>> .el-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-container);
  color: var(--text-primary);
}
.word-detail >>> .el-tag:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); filter: brightness(1.02); }
.word-detail >>> .el-tag .el-icon-video-play { color: var(--color-primary); }
.word-detail >>> .el-tag .el-icon-loading { color: var(--color-success); }
.word-detail >>> .el-tag:focus { outline: 2px solid var(--color-primary); outline-offset: 2px; }

/* Alerts inside paraphrase body and examples */
.word-detail >>> .el-alert.is-light {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
}
.word-detail >>> .el-alert.is-light::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--gradient-primary);
}
.word-detail >>> .el-alert .el-alert__content { line-height: 1.7; color: var(--text-primary); }
.word-detail >>> .el-alert .el-alert__title { text-align: justify; }

/* Divider spacing */
.word-detail >>> .el-divider { margin: 14px 0; background-color: var(--border-color-light); }

/* Dialog polish: word select, star list, confirm */
.word-select-dialog >>> .el-dialog__header,
.star-list-dialog >>> .el-dialog__header,
.confirm-dialog >>> .el-dialog__header {
  background: var(--gradient-primary);
  color: #fff;
  border-bottom: none;
  padding: 14px 16px;
}
.word-select-dialog >>> .el-dialog__title,
.star-list-dialog >>> .el-dialog__title,
.confirm-dialog >>> .el-dialog__title { color: #fff; font-weight: 600; }
.word-select-dialog >>> .el-dialog__headerbtn .el-dialog__close,
.star-list-dialog >>> .el-dialog__headerbtn .el-dialog__close,
.confirm-dialog >>> .el-dialog__headerbtn .el-dialog__close { color: #fff; }
.word-select-dialog >>> .el-dialog__body,
.star-list-dialog >>> .el-dialog__body,
.confirm-dialog >>> .el-dialog__body {
  background-color: var(--bg-body);
  color: var(--text-primary);
}
.word-select-dialog >>> .el-dialog__body { padding-top: 10px; }

/* Collapse in word-select dialog */
.word-select-dialog >>> .el-collapse-item__header {
  background: var(--bg-container);
  border-bottom: 1px solid var(--border-color);
  padding: 10px 12px;
  font-weight: 500;
  color: var(--text-primary);
}
.word-select-dialog >>> .el-collapse-item__header:hover { background: var(--bg-sidebar-active); }
.word-select-dialog >>> .el-collapse-item__wrap { background: var(--bg-card); border-bottom: 1px solid var(--border-color-light); }
.word-select-dialog >>> .el-collapse-item__content { padding: 10px 16px 6px 16px; color: var(--text-secondary); }

/* Pagination chips */
.word-select-dialog >>> .el-pagination.is-background .btn-prev,
.word-select-dialog >>> .el-pagination.is-background .btn-next,
.word-select-dialog >>> .el-pagination.is-background .el-pager li { border-radius: 8px; background-color: var(--bg-container); color: var(--text-secondary); }
.word-select-dialog >>> .el-pagination.is-background .el-pager li.active {
  background: var(--gradient-primary);
  color: #fff;
}
.word-select-dialog >>> .el-pagination.is-background .el-pager li:not(.active):hover { color: var(--color-primary); }

/* Table buttons inside star list dialog */
.star-list-dialog >>> .el-button.el-button--info {
  background: var(--gradient-info) !important;
  border: none !important;
  color: #fff !important;
}

/* Dialog footers */
.dialog-footer { text-align: center; padding: 16px 20px; }
.dialog-footer .el-button {
  margin: 0 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  min-width: 120px;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-card);
}
.dialog-footer .el-button:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }
.dialog-footer .el-button--info {
  background: var(--gradient-info) !important;
  border: none !important;
  color: #fff !important;
}
.dialog-footer .el-button--primary {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: #fff !important;
}
.dialog-footer .el-button:not(.el-button--primary):not(.el-button--info) {
  background: var(--bg-container) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-secondary) !important;
}

/* Utility placements retained */
.outline_fix { position: absolute; right: 6px; bottom: 6px; }
.outline_fix_top_right { position: absolute; top: 6px; right: 6px; }
.outline_fix_top_left {
  position: absolute; top: 8px; left: 8px; width: auto;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.outline_fix_bottom_left { position: absolute; bottom: 6px; left: 6px; }
.outline_fix_bottom_left_2 { position: absolute; bottom: 6px; left: 26px; }

/* Selection color */
.word-detail ::selection { background: var(--color-primary); color: #fff; }
.word-detail ::-moz-selection { background: var(--color-primary); color: #fff; }

/* Responsive tweaks */
@media (max-width: 992px) {
  .ai-container { padding: 10px 14px; }
  .header-title-alert >>> .el-alert { border-radius: 10px; }
}
@media (max-width: 768px) {
  .ai-container { padding: 8px 12px; }
  .box-card { border-radius: 10px; margin: 14px 0; }
  .row-bg { margin-bottom: 6px; }
  .floating-controls { gap: 6px; padding: 4px; border-radius: 14px; }
  .floating-controls-top { top: 10px; right: 12px; }
  .floating-controls-bottom { bottom: 10px; right: 12px; }
}
@media (max-width: 420px) {
  .floating-controls { right: 8px; }
}
</style>
