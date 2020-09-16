<script>
import { getStore } from '@/util/store'
import paraphraseStarList from '@/api/paraphraseStarList'
import audioPlay from '../../api/audioPlay'

const sleep = function (time) {
  let startTime = new Date().getTime() + time * 1000
  while (new Date().getTime() < startTime) {}
}

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
  data () {
    return {
      innerHeight: window.innerHeight + 'px',
      innerWidth: window.innerWidth + 'px',
      page: {
        current: 1,
        size: 10,
        total: 0,
        pages: 0
      },
      detail: {
        paraphraseVO: {},
        dialogVisible: false,
        rememberLoading: false,
        forgetLoading: false,
        showTranslation: false,
        hideTranslationPrompt: '释义已经隐藏，点击上方灯泡显示',
        showIndex: 0,
        isSleepMode: false
      },
      source: getStore({ name: 'pronunciation_source' }),
      reviewType: getStore({ name: 'review_type' }),
      listItems: [],
      listRefresh: false,
      autoPlayDialogVisible: false,
      reviewAudioArr: [],
      isReviewStop: false,
      playWordIndex: 0,
      playStepIndex: 0,
      playCountOnce: 5,
      playCountPerWord: 14,
      currentPlayAudio: null,

      countdownMode: false,
      countdownTime: new Date().getTime(),
      countdownMin: 30,
      countdownText: '30分钟'
    }
  },
  beforeCreate: function () {
    that = this
  },
  async mounted () {
    await this.init()
  },
  watch: {
    'listId' () {
      this.init()
    },
    'playStepIndex' (newVal) {
      if (newVal === 0) return
      if (this.isChToEn && newVal === 5) {
        sleep(3)
      }
      if (newVal > this.playCountPerWord) {
        this.playStepIndex = 0
        this.playWordIndex++
        this.recursiveReview()
      } else {
        this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
        this.currentPlayAudio.play()
      }
    },
    'playWordIndex' (newVal) {
      if (newVal === 0) return
      if (newVal >= this.playCountOnce) {
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
              message: '当前复习列表已经复习完'
            })
          }
        }
      }
    },
    'countdownMode' (newVal) {
      if (newVal) {
        this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
      }
    },
    // async 'isReviewRestart' (newVal) {
    //   if (!newVal) {
    //     this.isReviewStop = false
    //     this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
    //     this.autoPlayDialogVisible = true
    //     // await this.currentPlayAudio.play()
    //   } else {
    //     this.isReviewStop = true
    //     this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
    //     await this.currentPlayAudio.pause()
    //   }
    // }
  },
  computed: {},
  methods: {
    ...paraphraseStarList,
    async init () {
      if (this.isReview) {

        // clean data
        this.isReviewStop = true
        this.reviewAudioArr = []
        this.listItems = []
        this.detail.paraphraseVO = {}
        if (this.currentPlayAudio) {
          this.currentPlayAudio.pause()
          this.currentPlayAudio = null
        }

        if (this.isChToEn) {
          if (this.reviewType === '2') {
            this.playCountPerWord = 17
          } else {
            this.playCountPerWord = 11
          }
        } else {
          if (this.reviewType === '2') {
            this.playCountPerWord = 14
          } else {
            this.playCountPerWord = 8
          }
        }

        const loading = this.$loading({
          lock: true,
          text: `第${this.page.current}页自动复习资源加载中`,
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        await this.initList()
        for (let i = 0; i < this.listItems.length; i++) {
          await this.getItemDetail(this.listItems[i].paraphraseId)
              .then(response => {
                this.detail.paraphraseVO = response.data.data
              })
              .catch(e => {
                loading.close()
                console.error(e)
              })
          await this.reviewDetail()
        }
        loading.close()
        this.isReviewStop = false
        this.playWordIndex = 0
        this.playStepIndex = 0
        if (this.page.current > 1) {
          this.$message.success({
            duration: 2000,
            message: '即将开始复习，请稍等！'
          })
          await this.showDetail(this.listItems[0].paraphraseId, 0)
          this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playWordIndex]
          this.currentPlayAudio.play()
        } else {
          this.autoPlayDialogVisible = !this.autoPlayDialogVisible
        }
      } else {
        if (this.listId < 1) {
          return
        }
        await this.initList()
      }
    },
    async initStockListFun () {
      await this.getReviewListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
      }).catch(e => {
        console.error(e)
      })
    },
    async initEnhanceListFun () {
      await this.getEnhanceListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
      }).catch(e => {
        console.error(e)
      })
    },
    async initDefaultListFun () {
      await this.getListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
      }).catch(e => {
        console.error(e)
      })
    },
    async initList () {
      this.listRefresh = true
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        // 复习模式每页只加载5个单词
        this.page.size = this.playCountOnce
        await this.initStockListFun()
        this.listRefresh = false
        return
      } else if (this.reviewMode === 'totalReview' || this.reviewMode === 'totalRead') {
        // 全量模式也只查5个
        this.page.size = this.playCountOnce
      } else if (this.reviewMode === 'enhanceReview' || this.reviewMode === 'enhanceRead') {
        // 复习模式每页只加载5个单词
        this.page.size = this.playCountOnce
        await this.initEnhanceListFun()
        this.listRefresh = false
        return
      }
      await this.initDefaultListFun()
      this.listRefresh = false
    },
    goBack () {
      this.$emit('tableVisibleToggle')
    },
    async showDetail (paraphraseId, index) {
      this.detail.showIndex = index
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      await this.getItemDetail(paraphraseId)
          .then(response => {
            this.detail.paraphraseVO = response.data.data
          })
          .catch(e => {
            console.error(e)
          })
      this.detail.dialogVisible = true
      loading.close()
    },
    async removeParaphraseStarListFun (paraphraseId) {

      this.$confirm('即将进行删除, 是否继续?', '删除操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then($ => {
        this.removeParaphraseStar({ paraphraseId: paraphraseId, listId: this.listId })
            .then(response => {
              this.doSuccess()
              this.initList()
            })
            .catch(e => {
              this.$message.error(e)
            })
      }).finally($ => {
        loading.close()
      })
    },
    handleDetailClose () {
      this.detail.dialogVisible = false
    },
    handleShowDetail () {
      if (this.isReview) {
        this.$message.warning({
          duration: 1000,
          message: '自动复习期间不允许调整到单词详情'
        })
        return
      }

      this.detail.dialogVisible = false
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: { active: 'search', word: this.detail.paraphraseVO.wordName }
      })
    },
    async pageChange () {
      await this.init()
    },
    switchSleepMode () {
      this.detail.isSleepMode = !this.detail.isSleepMode
      if (this.detail.isSleepMode) {
        this.$message.warning({
          duration: 3000,
          message: '点击灰色区域记住或牢记当前复习单词！'
        })
      }
    },
    doSuccess () {
      this.$message.success({
        duration: 1000,
        message: '操作成功'
      })
    },
    async playPronunciation (id, sourceUrl) {
      if (this.isReview) {
        this.$message.warning({
          duration: 1000,
          message: '自动复习期间不允许播放音标'
        })
        return
      }
      try {
        // let audio = this.pronunciationAudioMap.get(id)
        let audio = new Audio()
        if (this.source === '本地') {
          audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        } else {
          audio.src = sourceUrl
        }
        audio.pause()
        await audio.play()
      } catch (e) {
        console.error(e)
      }
    },
    async stockReviewStart () {
      this.autoPlayDialogVisible = false

      if (this.reviewAudioArr.length) {
        await this.showDetail(this.listItems[0].paraphraseId, 0)
        this.currentPlayAudio = this.reviewAudioArr[0][0]
        this.currentPlayAudio.play()
      }
    },
    async recursiveReview () {
      await this.showDetail(this.listItems[this.playWordIndex].paraphraseId, this.playWordIndex)
      this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
      this.currentPlayAudio.play()
    },
    createPronunciationAudio () {
      if (!this.detail.paraphraseVO.pronunciationVOList) {
        return audioPlay.createAudioFromText('音标缺失')
      }
      let pronunciation = new Audio()
      if (this.source === '本地') {
        pronunciation.src = '/wordBiz/word/pronunciation/downloadVoice/' + this.detail.paraphraseVO.pronunciationVOList[0].pronunciationId
      } else {
        pronunciation.src = this.detail.paraphraseVO.pronunciationVOList[0].sourceUrl
      }
      pronunciation.pause()
      pronunciation.loop = false
      return pronunciation
    },
    async reviewDetail () {
      let audioQueue = []
      if (this.isChToEn) {
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('接下来复习的单词中文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.meaningChinese))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一遍中文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.meaningChinese))
        audioQueue.push(audioPlay.createAudioFromText('请在脑海回想对应的单词。'))
        audioQueue.push(audioPlay.createAudioFromText('对应的英文单词是'))
        audioQueue.push(this.createPronunciationAudio())
        audioQueue.push(this.createPronunciationAudio())
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('单词的拼写是：'))
        let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
        audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一次拼写：'))
        audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
        audioQueue.push(this.createPronunciationAudio())
        audioQueue.push(this.createPronunciationAudio())
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('英文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一遍英文释义：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
      } else {
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('接下来复习的单词是：'))
        audioQueue.push(this.createPronunciationAudio())
        audioQueue.push(this.createPronunciationAudio())
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('单词的拼写是：'))
        let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
        audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一次拼写：'))
        audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
        audioQueue.push(this.createPronunciationAudio())
        audioQueue.push(this.createPronunciationAudio())
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('中文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.meaningChinese))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('英文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一遍英文释义：'))
        audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
      }

      for (let j = 0; j < audioQueue.length; j++) {
        audioQueue[j].addEventListener('ended', function () {
          if (!that.isReviewStop) {
            that.playStepIndex++
          }
        }, false)
      }

      this.reviewAudioArr.push(audioQueue)

      this.$message.success({
        duration: 1000,
        message: `单词${this.detail.paraphraseVO.wordName}资源加载完毕`
      })
    },
    rememberInSleepMode () {
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        this.rememberOneFun()
      } else {
        this.keepInMindFun()
      }
    },
    rememberOneFun () {
      this.rememberOne(this.detail.paraphraseVO.paraphraseId, this.listId)
          .then(res => {
            this.doSuccess()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    keepInMindFun () {
      this.keepInMind(this.detail.paraphraseVO.paraphraseId, this.listId)
          .then(res => {
            this.doSuccess()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    forgetOneFun () {
      this.forgetOne(this.detail.paraphraseVO.paraphraseId, this.listId)
          .then(res => {
            this.doSuccess()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    countdownSelectHandle (command) {
      this.countdownText = command.text
      this.countdownMin = command.m
      this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
    },
    countdownEndFun () {
      this.countdownMode && (this.isReviewStop = true)
      this.countdownMode = !this.countdownMode
    },
    async countdownEndReplay () {
      this.isReviewStop = false
      await this.init()
    },
    async showPrevious () {
      if (this.detail.showIndex === 0) {
        if (this.isReview) {
          this.$message.warning({
            duration: 1000,
            message: '当前已经是复习页第一个'
          })
          return
        } else {
          if (this.page.current === 1) {
            this.$message.warning({
              duration: 1000,
              message: '当前已经是第一页第一个'
            })
            return
          }
          this.page.current--
          await this.init()
          this.detail.showIndex = this.page.size - 1
        }
      } else {
        this.detail.showIndex--
      }
      await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
    },
    async showNext () {
      if (this.detail.showIndex === this.page.size - 1) {
        if (this.isReview) {
          this.$message.warning({
            duration: 1000,
            message: '已经是当前复习页最后一个'
          })
          return
        } else {
          if (this.page.current === this.page.pages) {
            this.$message.warning({
              duration: 1000,
              message: '当前已经是最后一页最后一个'
            })
            return
          }
          this.page.current++
          await this.init()
          this.detail.showIndex = 0
        }
      } else {
        this.detail.showIndex++
      }
      // 最后一页条目数可能小于每页条目数
      if (this.page.current === this.page.pages) {
        let lastPageRemainder = this.page.total % this.page.size
        if (lastPageRemainder !== 0 && this.detail.showIndex === lastPageRemainder) {
          this.$message.warning({
            duration: 1000,
            message: '当前已经是最后一页最后一个'
          })
          return
        }
      }
      await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
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
  <div style="margin-top: 10px">
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
        <Countdown v-if="countdownMode" :endTime="countdownTime"
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
            {{ isShowParaphrase ? item.meaningChinese : '释义已隐藏，点击灯泡显示' }}
          </div>
        </div>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="isShowParaphrase = !isShowParaphrase"><i class="el-icon-s-opportunity"></i>
        </el-button>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="showDetail(item.paraphraseId, index)"><i class="el-icon-more-outline"></i>
        </el-button>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="removeParaphraseStarListFun(item.paraphraseId)"><i
            class="el-icon-remove-outline"></i>
        </el-button>
      </el-collapse-item>
    </el-collapse>
    <el-pagination
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
        :show-close="false"
        top="0vh"
        width="100%">
      <div slot="title">
        <div v-if="detail.isSleepMode" :style="{height: innerHeight, background: '#909399', marginBottom: '35px'}"
             @click.stop="rememberInSleepMode">
        </div>
        <el-button type="info" size="mini" @click="showPrevious">
          <i class="el-icon-back"></i>
        </el-button>
        &nbsp;
        <el-tag type="info" :hit="true">
          <B style="font-size: larger ">{{ detail.paraphraseVO.wordName }}</B>
        </el-tag>
        &nbsp;
        <el-button type="info" size="mini" @click="showNext">
          <i class="el-icon-right"></i>
        </el-button>
      </div>
      <div>
        <el-button v-if="reviewMode === 'stockReview' || reviewMode === 'stockRead'" type="info" size="mini"
                   v-loading="detail.rememberLoading" @click="rememberOneFun">记住
        </el-button>
        <el-button v-if="reviewMode === 'enhanceReview' || reviewMode === 'enhanceRead'" type="info" size="mini"
                   v-loading="detail.rememberLoading" @click="keepInMindFun">牢记
        </el-button>
        <el-button type="info"
                   @click="detail.showTranslation = !detail.showTranslation"
                   size="mini">
          <i class="el-icon-s-opportunity"></i>
        </el-button>
        <el-button type="info"
                   v-if="isReview"
                   @click="switchSleepMode"
                   size="mini">
          <i class="el-icon-thumb"></i>
        </el-button>
        <el-button type="info"
                   v-if="isReview"
                   @click="init"
                   size="mini">
          恢复播放
        </el-button>
        <el-button type="info"
                   v-if="!isReview"
                   size="mini" @click="handleShowDetail">
          <i class="el-icon-open"></i>
        </el-button>
        <el-button type="info" size="mini" @click="handleDetailClose">
          <i class="el-icon-close"></i>
        </el-button>
        <el-button type="info" size="mini" v-loading="detail.forgetLoading" @click="forgetOneFun">遗忘</el-button>
      </div>
      <el-card class="box-card">
        <div slot="header">
          <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
            <el-col>
              <el-tag type="success">{{ detail.paraphraseVO.wordCharacter }}</el-tag>
              <el-tag v-if="detail.paraphraseVO.wordLabel !== ''">
                {{ detail.paraphraseVO.wordLabel }}
              </el-tag>
            </el-col>
          </el-row>
          <el-row v-if="!detail.paraphraseVO.isOverlength" type="flex" justify="end"
                  style="background-color: #8c939d;padding-top: 5px;">
            <el-col v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
              <el-tag @click="playPronunciation(wordPronunciationVO.pronunciationId, wordPronunciationVO.sourceUrl)">
                {{ wordPronunciationVO.soundmark }}[{{ wordPronunciationVO.soundmarkType }}]
                <i class="el-icon-video-play"></i>
              </el-tag>
            </el-col>
          </el-row>
          <div v-if="detail.paraphraseVO.isOverlength"
               v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
            <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
              <el-col>
                <el-tag @click="playPronunciation(wordPronunciationVO.pronunciationId, wordPronunciationVO.sourceUrl)">
                  {{ wordPronunciationVO.soundmark }}[{{ wordPronunciationVO.soundmarkType }}]
                  <i class="el-icon-video-play"></i>
                </el-tag>
              </el-col>
            </el-row>
          </div>
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
              <br/>
              <div style="word-wrap:break-word; overflow:hidden;">
                {{ this.detail.paraphraseVO.paraphraseEnglish }}
              </div>
              <span class="outline_fix_top_left">{{ this.detail.paraphraseVO.codes }}</span>
            </div>
          </el-alert>
        </div>
        <div
            v-if="detail.paraphraseVO.paraphraseExampleVOList && detail.paraphraseVO.paraphraseExampleVOList.length < 1">
          <el-alert
              type="info"
              title="该释义暂时没有例句"
              center
              effect="light"
              :closable="false">
          </el-alert>
        </div>
        <div v-for="wordParaphraseExampleVO in this.detail.paraphraseVO.paraphraseExampleVOList">
          <el-alert
              type="info"
              center
              effect="light"
              :description="wordParaphraseExampleVO.exampleTranslate"
              :closable="false">
            <div slot="title">
              {{ wordParaphraseExampleVO.exampleSentence }}
              <el-button type="text" style="color: #909399"><i
                  class="el-icon-circle-plus-outline outline_fix" style="color: #FFFFFF"></i>
              </el-button>
            </div>
          </el-alert>
        </div>
      </el-card>
    </el-dialog>
    <el-dialog
        :title="isChToEn ? '汉英模式' : '英汉模式（默认）'"
        :visible.sync="autoPlayDialogVisible"
        width="300px">
      <el-alert
          :closable="false"
          type="warning">
        复习期间最好不要切换App，最多可以在浏览器内部新开窗口；
      </el-alert>
      <el-alert
          :closable="false"
          type="warning">
        如果被异常打断，可以点击恢复复习按钮，将重新开始当前页的复习；
      </el-alert>
      <spanactionVO.status slot="footer" class="dialog-footer">
        <el-button @click="autoPlayDialogVisible = false">取消</el-button>
        <el-button type="info" @click="stockReviewStart">确定</el-button>
      </spanactionVO.status>
    </el-dialog>
  </div>
</template>
