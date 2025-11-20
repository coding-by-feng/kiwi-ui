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
    Countdown: $ => import('./Countdown'),
    KiwiButton: () => import('@/components/ui/KiwiButton'),
    KiwiDropdown: () => import('@/components/ui/KiwiDropdown'),
    KiwiDropdownItem: () => import('@/components/ui/KiwiDropdownItem'),
    KiwiDialog: () => import('@/components/ui/KiwiDialog')
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
      if (!word) {
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
  <div>
    <div class="detail-header">
      <div class="ai-container">
        <div v-if="isTabActivate">
          <div class="floating-controls floating-controls-top">
            <KiwiButton v-if="!showWordSelect && wordInfoList.length>1" size="mini" @click="showWordSelect = true" circle icon="el-icon-s-unfold"></KiwiButton>
          </div>
          <div class="floating-controls floating-controls-bottom">
            <KiwiButton size="mini"
                       v-if="wordInfo.wordName.length>0"
                       @click="wordCollectClickFun()" icon="el-icon-circle-plus-outline">
            </KiwiButton>
          </div>
          
          <!-- Word Select Dialog -->
          <KiwiDialog
              :title="decodeURIComponent($route.query.originalText)"
              :visible.sync="showWordSelect"
              width="90%"
              center>
            <div class="word-select-list">
               <div v-for="word in wordInfoList" :key="word.wordId" class="word-select-item">
                  <div class="word-select-header">
                    <KiwiButton type="info" size="mini" @click="agileShowDetail(word)">{{ word.wordName }}</KiwiButton>
                  </div>
                  <div class="word-select-meanings">
                    <div v-for="characterVO in word.characterVOList" :key="characterVO.characterId">
                      <p v-for="paraphraseVO in characterVO.paraphraseVOList" :key="paraphraseVO.paraphraseId">
                        <i class="el-icon-caret-right"></i>
                        {{ paraphraseVO.meaningChinese }}
                      </p>
                    </div>
                  </div>
               </div>
            </div>
            <el-pagination
                style="margin-top: 10px; text-align: center;"
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
          </KiwiDialog>
        </div>
        
        <div>
          <p v-if="defaultHint && defaultHint.length>0" style="color: #ed3f14">{{ defaultHint }}</p>
          <div v-if="''!==wordInfo.wordName" class="header-title-alert">
             <div class="alert-content">
               <b :style="getWordNameStyle">{{ wordInfo.wordName }}</b>
             </div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-main">
      <div class="ai-container word-detail">
        <div v-for="wordCharacterVO in wordInfo.characterVOList" v-if="showCharacter" :key="wordCharacterVO.characterId">
          <div v-show="showCharacterId == '0' || showCharacterId == wordCharacterVO.characterId">
            
            <!-- Pronunciation Row -->
            <div class="detail-row pronunciation-row">
                <span class="detail-tag" v-if="wordCharacterVO.characterCode && wordCharacterVO.characterCode !== ''">
                  {{ wordCharacterVO.characterCode }}
                </span>
                <span class="detail-tag" v-if="wordCharacterVO.tag && wordCharacterVO.tag !== ''">
                  {{ wordCharacterVO.tag }}
                </span>
                
                <span v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList" :key="wordPronunciationVO.pronunciationId" class="pronunciation-item">
                  <span class="detail-tag pronunciation-tag"
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
                  </span>
                </span>
            </div>

            <!-- Paraphrase List -->
            <div v-for="wordParaphraseVO in wordCharacterVO.paraphraseVOList" :key="wordParaphraseVO.paraphraseId">
              <div class="detail-card">
                <div class="card-header" @click="isShowParaphrase = !isShowParaphrase">
                  <div class="detail-alert info-alert">
                     <div class="alert-content">
                       <div>
                          <div v-if="wordParaphraseVO.phraseList && wordParaphraseVO.phraseList.length"
                               v-for="(phraseVO, pIndex) in wordParaphraseVO.phraseList" :key="pIndex">
                            <p>[ {{ phraseVO }} ]</p>
                          </div>
                          <p style="margin-top: 10px;">
                            {{ wordParaphraseVO.paraphraseEnglish }}
                          </p>
                          <p style="margin-top: 8px; color: var(--text-secondary); font-size: 0.9em;">
                            {{ wordParaphraseVO.meaningChinese }}
                          </p>
                          <div class="action-icon">
                            <i :class="getParaphraseCollectClass(wordParaphraseVO.paraphraseId)"
                               style="color: var(--text-placeholder); cursor: pointer;"
                               @click.stop="paraphraseCollectClickFun(wordParaphraseVO.paraphraseId)"></i>
                          </div>
                          <div v-if="wordParaphraseVO.codes && wordParaphraseVO.codes.length>0"
                               class="outline_fix_top_left">
                            {{ wordParaphraseVO.codes }}
                          </div>
                       </div>
                     </div>
                  </div>
                </div>
                
                <div class="card-body" v-if="isShowExample">
                   <div v-if="!wordParaphraseVO.exampleVOList" class="detail-alert light-alert">
                      <div class="alert-content">该释义暂时没有例句</div>
                   </div>
                   <div v-else v-for="wordParaphraseExampleVO in wordParaphraseVO.exampleVOList" :key="wordParaphraseExampleVO.exampleId" class="example-item">
                      <div class="detail-alert light-alert">
                        <div class="alert-content">
                          <div class="example-sentence">
                            {{ wordParaphraseExampleVO.exampleSentence }}
                            <i class="el-icon-circle-plus-outline example-collect-icon"
                               @click="exampleCollectClickFun(wordParaphraseExampleVO.exampleId)"></i>
                          </div>
                          <div class="example-translate">
                            {{ wordParaphraseExampleVO.exampleTranslate }}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
                
                <div class="card-body" v-if="!isShowExample">
                   <div class="detail-alert light-alert">
                      <div class="alert-content">例句已隐藏</div>
                   </div>
                </div>
              </div>
              <hr class="detail-divider">
            </div>
          </div>
        </div>
      </div>
      
      <!-- Collect List Dialog -->
      <KiwiDialog
          center
          :title="collect.dialogTitle"
          :visible.sync="collect.listSelectDialogVisible"
          width="400px">
        <div class="collect-list">
           <div v-for="item in collect.starListData" :key="item.id" class="collect-item">
              <KiwiButton type="info" @click="selectOneList(item.id)" style="width: 100%;">
                {{ item.listName }}
              </KiwiButton>
           </div>
        </div>
      </KiwiDialog>
    </div>

    <!-- Auto Play Dialog -->
    <KiwiDialog
        title="提示"
        :visible.sync="autoPlayDialogVisible"
        width="300px">
      <span>自动复习即将开始，请确认。</span>
      <span slot="footer" class="dialog-footer">
        <KiwiButton @click="autoPlayDialogVisible = false">取消</KiwiButton>
        <KiwiButton type="info" @click="stockReviewStart">确定</KiwiButton>
      </span>
    </KiwiDialog>
  </div>
</template>

<style scoped>
.detail-container {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-body);
}

.ai-container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 12px 16px;
}

/* Floating controls */
.floating-controls {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}
.floating-controls-top { top: 12px; right: 16px; }
.floating-controls-bottom { bottom: 12px; right: 16px; }

/* Header Alert */
.header-title-alert {
  margin: 12px 0 0 0;
  background: var(--gradient-primary);
  color: #ffffff;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 14px 18px;
  text-align: center;
}

/* Detail Row */
.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}

.pronunciation-row {
  padding: 6px 0;
  border-bottom: 1px dashed var(--border-color-light);
}

/* Tags */
.detail-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-container);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.detail-tag:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
  filter: brightness(1.02);
}
.pronunciation-tag i {
  margin-left: 4px;
}
.pronunciation-tag .el-icon-video-play { color: var(--color-primary); }
.pronunciation-tag .el-icon-loading { color: var(--color-success); }

/* Detail Card */
.detail-card {
  width: 100%;
  margin: 20px 0;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.detail-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.card-header {
  cursor: pointer;
}

/* Alerts */
.detail-alert {
  padding: 12px 16px;
  border-radius: 0;
  position: relative;
}
.info-alert {
  background: var(--gradient-info);
  color: #ffffff;
  transition: filter 0.2s ease;
}
.info-alert:hover {
  filter: brightness(1.03);
}

.light-alert {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin: 10px;
  position: relative;
  overflow: hidden;
}
.light-alert::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--gradient-primary);
}

.alert-content {
  line-height: 1.6;
  color: inherit;
}
.light-alert .alert-content {
  color: var(--text-primary);
  padding-left: 8px;
}

/* Action Icons */
.action-icon {
  margin-top: 10px;
  text-align: right;
}
.outline_fix_top_left {
  position: absolute; top: 8px; left: 8px; width: auto;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}

/* Example Items */
.example-item {
  margin-bottom: 8px;
}
.example-sentence {
  font-weight: 500;
  margin-bottom: 4px;
}
.example-translate {
  color: var(--text-secondary);
  font-size: 0.9em;
}
.example-collect-icon {
  cursor: pointer;
  margin-left: 8px;
  color: var(--color-primary);
}

/* Divider */
.detail-divider {
  border: 0;
  height: 1px;
  background: var(--border-color-light);
  margin: 14px 0;
}

/* Word Select List */
.word-select-item {
  margin-bottom: 15px;
  border-bottom: 1px solid var(--border-color-light);
  padding-bottom: 10px;
}
.word-select-header {
  margin-bottom: 5px;
}
.word-select-meanings {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Collect List */
.collect-item {
  margin-bottom: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .ai-container { padding: 8px 12px; }
  .detail-card { border-radius: 10px; margin: 14px 0; }
  .floating-controls { gap: 6px; padding: 4px; border-radius: 14px; }
  .floating-controls-top { top: 10px; right: 12px; }
  .floating-controls-bottom { bottom: 10px; right: 12px; }
}
</style>
