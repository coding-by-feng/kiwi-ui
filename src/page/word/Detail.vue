<script>
import { getStore, setStore } from '@/util/store'
import msgUtil from '@/util/msg'
import wordSearch from '@/api/wordSearch'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'
import audioPlay from '@/api/audioPlay'
import wordStarList from '@/api/wordStarList'
import { isMobile } from '@/util/util'

let that

let index = 0

export default {
  name: 'wel',
  components: {
    Countdown: $ => import('./Countdown')
  },
  data () {
    return {
      loading: false,
      windowInnerHeight: window.innerHeight,
      dialogHelpVisible: false,
      isShowParaphrase: true,
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
        paraphraseStars: getStore({ name: 'paraphrase_stars' }),
        wordStars: getStore({ name: 'word_stars' }),
        exampleStars: getStore({ name: 'example_stars' }),
        paraphraseCollectMap: new Map(),
        dialogTitle: '',
        collectId: 0
      },
      showCharacterId: 0,
      showCharacter: true,
      isQueryNotResult: false,
      isShowYoudao: false,
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
    isLogin () {
      let accessToken = getStore({ name: 'access_token' })
      return !!accessToken
    },
    getDateOn8Sec () {
      return new Date().getTime() + 1000 * 10
    },
    getWordNameStyle () {
      if (this.getWindowWidth < 350) {
        return `font-family: 'Helvetica Neue'; font-size: large;`
      }
      return `font-family: 'Helvetica Neue'; font-size: xx-large;`
    },
    getWindowWidth () {
      return window.innerWidth
    },
    isSmallWindow () {
      return window.innerWidth <= 400
    },
    isLargeWindow () {
      return window.innerWidth >= 800
    },
    getYoudaoQueryUrl () {
      if (isMobile()) {
        return `https://m.youdao.com/dict?le=eng&q=${this.keyword}`
      } else {
        return `https://dict.youdao.com/w/${this.keyword}/#keyfrom=dict2.top`
      }
    }
  },
  async mounted () {
    await this.init()
    // await this.initPronunciation()
  },
  watch: {
    '$route' () {
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
    async initTabActivate () {
      // 标记当前Tab被激活显示
      let active = this.$route.query.active
      this.isTabActivate = !active || active === 'search'
      this.showWordSelect = false
    },
    async init () {
      // clean data
      this.showCharacterId = 0

      let mode = this.$route.query.mode
      let listType = this.$route.query.listType
      if ('stockReview' === mode && 'word' === listType) {
        let listId = this.$route.query.listId
        if (listId) {
          const loading = this.$loading({
            lock: true,
            text: '自动复习播报单词本资源加载中，请稍等！',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          await wordStarList.findAllWordId(listId).then(response => {
            loading.close()
            let wordIdList = response.data.data
            if (wordIdList && wordIdList.length) {
              this.stockReview(wordIdList)
            }
          }).catch(e => {
            loading.close()
            console.error(e)
          })
        }
      } else {
        await this.initDetail('')
      }
    },
    async initDetail (w) {
      let word = w
      if (this.$route.query.word) {
        word = decodeURI(this.$route.query.word)
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
            this.isQueryNotResult = false
            this.defaultHint = null
          }
          this.isShowYoudao = false
          this.pages = response.data.data.pages
          this.total = response.data.data.total
          this.isForceRequest = false
        } else {
          this.isShowYoudao = true
          if (this.countdownTime < 1) {
            this.isQueryNotResult = true
            this.defaultHint = '单词未收录，正在收录'
            this.isForceRequest = true
          } else {
            this.isQueryNotResult = false
            this.defaultHint = '单词数据从Cambridge抓取不到，请联系作者'
            this.isForceRequest = false
          }
          this.wordInfo = { wordName: '' }
          this.countdownTime = 0
        }
        this.keyword = word
      }).catch(e => {
        console.error(e)
      })
    },
    agileShowDetail (wordInfo) {
      this.wordInfo = wordInfo
      this.isQueryNotResult = false
      this.defaultHint = null
      this.showWordSelect = false
    },
    async initPronunciation () {
      if (this.wordInfo.characterVOList) {
        let characterVOList = this.wordInfo.characterVOList
        for (let i = 0; i < characterVOList.length; i++) {
          let pronunciationVOList = characterVOList[i].pronunciationVOList
          for (let j = 0; j < pronunciationVOList.length; j++) {
            let audio = new Audio()
            audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + pronunciationVOList[j].pronunciationId
            this.pronunciationAudioMap.set(pronunciationVOList[j].pronunciationId, audio)
          }
        }
      }
    },
    async stockReview (wordIdList) {
      for (let i = 0; i < wordIdList.length; i++) {
        let wordId = wordIdList[i]
        await this.queryWordDetailById(wordId).then(response => {
          if (response.data.code) {
            this.wordInfo = response.data.data
            this.playDetail2Audio()
          } else {
            this.wordInfo = { wordName: '' }
          }
        }).catch(e => {
          console.error(e)
        })
      }
      if (index === 0 && this.audioList.length) {
        this.autoPlayDialogVisible = true
      }
    },
    async oneWordPlay () {
      // tts.setAudioText('詹士锋个人测试')
      // tts.playTTS()
      await this.playDetail2Audio()
      await this.stockReviewStart()
    },
    stockReviewStart () {
      this.autoPlayDialogVisible = false
      // console.log(this.audioList)
      if (index === 0 && this.audioList.length) {
        // console.log(this.audioList[0])
        this.wordInfo = this.autoWordList[0]
        this.audioList[0].play()
      }
    },
    async playPronunciation (id, sourceUrl, soundmarkType) {
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
        let audio = new Audio()
        // document.body.appendChild(audio)
        // audio.pause()
        // audio.loop = false
        // audio.type = 'audio/ogg'
        let source = getStore({ name: 'pronunciation_source' })
        if (source === '本地') {
          audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        } else {
          audio.src = sourceUrl
        }
        audio.pause()
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
    handleChange (val) {
      // console.log(val)
    },
    getWordCollectClass () {
      if (this.collect.wordIsCollect) {
        return 'el-icon-remove-outline outline_fix'
      }
      return 'el-icon-circle-plus-outline outline_fix'
    },
    getParaphraseCollectClass (id) {
      let collectListId = this.collect.paraphraseCollectMap.get(id)
      if (collectListId != null) {
        return 'el-icon-remove-outline outline_fix_top_right'
      }
      return 'el-icon-circle-plus-outline outline_fix_top_right'
    },
    checkIsLogin () {
      if (!this.isLogin) {
        this.msgWarning(this, '请先登录再进行收藏操作')
        return false
      }
      return true
    },
    selectShowCharacter (characterId) {
      this.showCharacterId = characterId
      this.showCharacter = false
      setTimeout(() => {
        this.showCharacter = true
      }, 1)
    },
    async wordCollectClickFun () {
      if (!this.checkIsLogin()) {
        return
      }
      // 例句本从缓存读取，提高性能
      if (this.collect.wordStars && this.collect.wordStars.length > 0) {
        this.collect.wordStars = getStore({ name: 'word_stars' })
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
    async paraphraseCollectClickFun (paraphraseId) {
      if (!this.checkIsLogin()) {
        return
      }
      this.collect.collectId = paraphraseId
      if (this.collect.paraphraseStars && this.collect.paraphraseStars.length > 0) {
        this.collect.paraphraseStars = getStore({ name: 'paraphrase_stars' })
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
    async exampleCollectClickFun (exampleId) {
      if (!this.checkIsLogin()) {
        return
      }
      this.collect.collectId = exampleId
      // 例句本从缓存读取，提高性能
      if (this.collect.exampleStars && this.collect.exampleStars.length > 0) {
        this.collect.exampleStars = getStore({ name: 'example_stars' })
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
    listSelectDialogHandleClose () {
      this.collect.listSelectDialogVisible = false
    },
    async selectOneList (listId) {
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      if (this.collect.type === 'word') {
        let data = { wordId: this.wordInfo.wordId, listId: listId }
        await this.putWordStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.doSuccess()
        }).catch(e => {
          console.error(e)
        })
      } else if (this.collect.type === 'paraphrase') {
        let data = { paraphraseId: this.collect.collectId, listId: listId }
        await this.putParaphraseStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.doSuccess()
        }).catch(e => {
          console.error(e)
        })
      } else if (this.collect.type === 'example') {
        let data = { exampleId: this.collect.collectId, listId: listId }
        await this.putExampleStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.doSuccess()
        }).catch(e => {
          console.error(e)
        })
      }
      loading.close()
    },
    playDetail2Audio () {
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
    doSuccess () {
      this.$message.success({
        duration: 1000,
        center: true,
        message: '操作成功'
      })
    },
    removeByWordNameFun () {
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
    countdownEndFun () {
      this.countdownTime++
      this.isQueryNotResult = false
      this.isForceRequest = true
      this.init()
    },
    async pageChange () {
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
  padding-top: 10px;
  background-color: #f9fafc;
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
  top: 5px;
  left: 5px;
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
</style>

<template>
  <el-container>
    <el-header>
      <div v-if="isTabActivate">
        <div style="position: fixed; top: 5px; right: 15px; z-index: 999;">
          <el-button v-if="!showWordSelect && wordInfoList.length>1" size="mini" @click="showWordSelect = true">
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
            :title="decodeURI($route.query.word)"
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
            type="warning"
            :closable="false"
            effect="light"
            center>
          <div slot="title">
            <b :style="getWordNameStyle">{{ wordInfo.wordName }}</b>
          </div>
        </el-alert>
      </div>
    </el-header>
    <el-main>
      <Countdown v-if="isQueryNotResult"
                 :onlySec="true"
                 :endTime="getDateOn8Sec" @endFun="countdownEndFun"></Countdown>
      <el-divider v-if="isQueryNotResult"></el-divider>
      <iframe v-if="isShowYoudao && keyword" :src="getYoudaoQueryUrl"
              frameborder="1"
              width="100%"
              :height="windowInnerHeight"
              scrolling="auto"></iframe>
      <div v-for="wordCharacterVO in wordInfo.characterVOList" v-if="showCharacter">
        <div v-show="showCharacterId == '0' || showCharacterId == wordCharacterVO.characterId">
          <el-row type="flex" class="row-bg" justify="end">
            <el-col>
              <el-tag type="success" v-if="wordCharacterVO.characterCode && wordCharacterVO.characterCode !== ''">
                {{ wordCharacterVO.characterCode }}
              </el-tag>
              <el-tag v-if="wordCharacterVO.tag && wordCharacterVO.tag !== ''">{{ wordCharacterVO.tag }}</el-tag>
              &nbsp;
              <span v-if="isLargeWindow" v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList">
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
                &nbsp;
              </span>
            </el-col>
          </el-row>
          <el-row v-if="!isSmallWindow && !isLargeWindow"
                  type="flex" class="row-bg" justify="end">
            <el-col v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList">
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
          <div v-if="isSmallWindow"
               v-for="wordPronunciationVO in wordCharacterVO.pronunciationVOList">
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
                    <p>{{ wordParaphraseVO.paraphraseEnglish }}</p>
                    <el-button type="text" style="color: #909399">
                      <i :class="getParaphraseCollectClass(wordParaphraseVO.paraphraseId)"
                         style="color: #FFFFFF;"
                         @click.stop="paraphraseCollectClickFun(wordParaphraseVO.paraphraseId)"></i>
                    </el-button>
                    <span v-if="wordParaphraseVO.codes && wordParaphraseVO.codes.length>0"
                          class="outline_fix_top_left">{{ wordParaphraseVO.codes }}</span>
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


