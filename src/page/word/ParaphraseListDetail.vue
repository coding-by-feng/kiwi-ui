<script>
import paraphraseStarList from '@/api/paraphraseStarList'
import audioPlay from '../../api/audioPlay'

let that

export default {
  name: 'wordStarListDetail',
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
    }
  },
  components: {
    Countdown: $ => import('./Countdown')
  },
  data () {
    return {
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
        showIndex: 0
      },
      listItems: [],
      listRefresh: false,
      autoPlayDialogVisible: false,
      reviewAudioArr: [],
      isReviewStop: false,
      playWordIndex: 0,
      playStepIndex: 0,
      playCountOnce: 5,
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
    'playStepIndex' (nval) {
      if (nval === 0) return
      if (nval > 14) {
        this.playStepIndex = 0
        this.playWordIndex++
        this.recursiveReview()
      } else {
        this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
        this.currentPlayAudio.play()
      }
    },
    'playWordIndex' (nval) {
      if (nval === 0) return
      if (nval >= this.playCountOnce) {
        this.playWordIndex = 0
        this.reviewAudioArr = []
        if (this.page.pages > this.page.current) {
          this.page.current++
          this.init()
        }
      }
    },
    'countdownMode' (nval) {
      if (nval) {
        this.countdownTime = new Date().getTime() + 1000 * 60 * this.countdownMin
      }
    }
  },
  computed: {},
  methods: {
    ...paraphraseStarList,
    async init () {
      if (this.isReview) {
        this.isReviewStop = true
        this.reviewAudioArr = []
        if (this.currentPlayAudio) {
          this.currentPlayAudio.pause()
          this.currentPlayAudio = null
        }
        const loading = this.$loading({
          lock: true,
          text: '自动复习资源加载中',
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
      this.removeParaphraseStar({ paraphraseId: paraphraseId, listId: this.listId })
        .then(response => {
          this.doSuccess()
          this.initList()
        })
        .catch(e => {
          console.error(e)
          this.$message.error(e)
        })
    },
    handleDetailClose () {
      this.detail.dialogVisible = false
    },
    async pageChange () {
      await this.init()
    },
    doSuccess () {
      this.$message.success({
        duration: 1000,
        message: '操作成功'
      })
    },
    async playPronunciation (id) {
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
        audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        audio.pause()
        audio.loop = false
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
      let pronunciation = new Audio()
      pronunciation.src = '/wordBiz/word/pronunciation/downloadVoice/' + this.detail.paraphraseVO.wordPronunciationVOList[0].pronunciationId
      pronunciation.pause()
      pronunciation.loop = false
      // document.body.appendChild(pronunciation)
      return pronunciation
    },
    async reviewDetail () {
      let audioQueue = []
      audioQueue.push(audioPlay.createAudioFromText('接下来复习的单词是：'))

      audioQueue.push(this.createPronunciationAudio())
      audioQueue.push(this.createPronunciationAudio())

      audioQueue.push(audioPlay.createAudioFromText('单词的拼写是：'))
      let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
      audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
      audioQueue.push(audioPlay.createAudioFromText('再读一次拼写：'))
      audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))

      audioQueue.push(this.createPronunciationAudio())
      audioQueue.push(this.createPronunciationAudio())

      audioQueue.push(audioPlay.createAudioFromText('中文释义是：'))
      audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.meaningChinese))
      audioQueue.push(audioPlay.createAudioFromText('英文释义是：'))
      audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish))
      audioQueue.push(audioPlay.createAudioFromText('再读一遍英文释义：'))
      audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish))

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
    showPrevious () {
      if (this.detail.showIndex === 0) {
        this.$message.warning({
          duration: 1000,
          message: '已经是第一个'
        })
        return
      }
      this.detail.showIndex--
      this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
    },
    showNext () {
      if (this.detail.showIndex === this.page.size - 1) {
        this.$message.warning({
          duration: 1000,
          message: '已经是最后一个'
        })
        return
      }
      this.detail.showIndex++
      this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
    }
  }
}
</script>

<style scoped>
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
                        split-button type="primary" @command="countdownSelectHandle">
                    <i class="el-icon-stopwatch">&nbsp;</i>{{countdownText}}
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
                        type="primary"
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
                        {{item.paraphraseEnglish}}
                    </p>
                    <div>
                        {{isShowParaphrase ? item.meaningChinese : '释义已隐藏，点击灯泡显示'}}
                    </div>
                </div>
                <el-button type="text"
                           size="mini"
                           @click="isShowParaphrase = !isShowParaphrase"><i class="el-icon-s-opportunity"></i>
                </el-button>
                <el-button type="text"
                           size="mini"
                           @click="showDetail(item.paraphraseId, index)"><i class="el-icon-more-outline"></i>
                </el-button>
                <el-button type="text"
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
        <el-dialog
                :title="detail.paraphraseVO.wordName"
                :visible.sync="detail.dialogVisible"
                :before-close="handleDetailClose"
                width="100%">
            <el-card class="box-card">
                <div slot="header">
                    <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
                        <el-col>
                            <el-tag type="success">{{detail.paraphraseVO.wordCharacter}}</el-tag>
                            <el-tag v-if="detail.paraphraseVO.wordLabel !== ''">
                                {{detail.paraphraseVO.wordLabel}}
                            </el-tag>
                        </el-col>
                    </el-row>
                    <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
                        <el-col v-for="wordPronunciationVO in detail.paraphraseVO.wordPronunciationVOList">
                            <el-tag @click="playPronunciation(wordPronunciationVO.pronunciationId)">
                                {{wordPronunciationVO.soundmark}}[{{wordPronunciationVO.soundmarkType}}]
                                <i class="el-icon-video-play"></i>
                            </el-tag>
                        </el-col>
                    </el-row>
                    <el-alert
                            ref="paraphraseDetail"
                            type="info"
                            :description="detail.showTranslation ? detail.paraphraseVO.meaningChinese : detail.hideTranslationPrompt"
                            :closable="false"
                            effect="dark"
                            style="margin-top: 5px;"
                            center>
                        <div slot="title">
                            <p>{{this.detail.paraphraseVO.paraphraseEnglish}}
                                <el-button type="text"
                                           @click="detail.showTranslation = !detail.showTranslation"
                                           size="mini">
                                    <i class="el-icon-s-opportunity" style="color: #FFFFFF"></i>
                                </el-button>
                            </p>
                        </div>
                    </el-alert>
                </div>
                <div v-if="detail.paraphraseVO.wordParaphraseExampleVOList && detail.paraphraseVO.wordParaphraseExampleVOList.length < 1">
                    <el-alert
                            type="info"
                            title="该释义暂时没有例句"
                            center
                            effect="light"
                            :closable="false">
                    </el-alert>
                </div>
                <div v-for="wordParaphraseExampleVO in this.detail.paraphraseVO.wordParaphraseExampleVOList">
                    <el-alert
                            type="info"
                            center
                            effect="light"
                            :description="wordParaphraseExampleVO.exampleTranslate"
                            :closable="false">
                        <div slot="title">
                            {{wordParaphraseExampleVO.exampleSentence}}
                            <el-button type="text"><i
                                    class="el-icon-circle-plus-outline outline_fix" style="color: #FFFFFF"></i>
                            </el-button>
                        </div>
                    </el-alert>
                </div>
            </el-card>
            <el-button type="primary" @click="showPrevious">
                <i class="el-icon-caret-left"></i>
            </el-button>
            <el-button type="primary" v-loading="detail.rememberLoading" @click="rememberOneFun">已记住</el-button>
            <el-button type="primary" v-loading="detail.forgetLoading" @click="forgetOneFun">已遗忘</el-button>
            <el-button type="primary" @click="showNext">
                <i class="el-icon-caret-right"></i>
            </el-button>
        </el-dialog>
        <el-dialog
                title="提示"
                :visible.sync="autoPlayDialogVisible"
                width="300px">
            <span>自动复习即将开始，请确认。</span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="autoPlayDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="stockReviewStart">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>
