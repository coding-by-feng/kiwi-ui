<script>
import paraphraseStarList from '@/api/paraphraseStarList'
import audioPlay from '../../api/audioPlay'

let that
let index = 0
let isClearOldAudio = false

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
    }
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
        dialogVisible: false
      },
      listItems: [],
      listRefresh: false,
      autoPlayDialogVisible: false,
      reviewAudioArr: []
    }
  },
  beforeCreate: function () {
    that = this
  },
  mounted () {
    this.init()
  },
  watch: {
    'listId' () {
      this.init()
    }
    // 'reviewAudioArr' () {
    //   console.log('reviewAudioArr change')
    //   this.reviewLoadingText = `自动复习释义本单词已加载${this.reviewAudioArr.length}个，请稍等！`
    // }
  },
  computed: {
    // reviewLoadingText () {
    //   return `自动复习释义本单词已加载${that.reviewAudioArr.length}个，请稍等！`
    // }
  },
  methods: {
    ...paraphraseStarList,
    async init () {
      if (this.isReview) {
        const loading = this.$loading({
          lock: true,
          text: '自动复习资源加载中',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        await this.initList()
        for (let i = 0; i < this.listItems.length; i++) {
          // await this.showDetail(this.listItems[i].paraphraseId)
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
        if (this.page.current > 1) {
          this.reviewAudioArr[0][0].play()
          await this.showDetail(this.listItems[0].paraphraseId)
        } else {
          this.autoPlayDialogVisible = !this.autoPlayDialogVisible
        }
      } else {
        // todo 对listId进行非空等判断
        if (this.listId < 1) {
          return
        }
        await this.initList()
      }
    },
    async initList () {
      this.listRefresh = true
      await this.getListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
      }).catch(e => {
        console.error(e)
      })
      this.listRefresh = false
    },
    goBack () {
      this.$emit('tableVisibleToggle')
    },
    async showDetail (paraphraseId) {
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
      if (this.isReview) {
        this.reviewAudioArr = []
        isClearOldAudio = true
        await this.init()
      } else {
        await this.initList()
      }
    },
    doSuccess () {
      this.$message.success({
        duration: 1000,
        message: '操作成功'
      })
    },
    async playPronunciation (id) {
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
    async autoReviewStart () {
      this.autoPlayDialogVisible = false
      if (this.reviewAudioArr.length) {
        await this.showDetail(this.listItems[0].paraphraseId)
        console.log(this.reviewAudioArr[0][0])
        this.reviewAudioArr[0][0].play()
      }
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
      console.log('reviewDetail，wordName=' + this.detail.paraphraseVO.wordName)
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
          // console.log('ended, that.reviewAudioArr[index].length=' + that.reviewAudioArr[index].length)
          // console.log('ended, index=' + index)
          // console.log('ended, j=' + j)
          if (isClearOldAudio) {
            // console.log('ClearOldAudio finish')
            audioQueue = []
            this.reviewAudioArr = []
            isClearOldAudio = false
            return
          }
          if (j < audioQueue.length - 1) {
            audioQueue[j + 1].play()
          } else if (j === audioQueue.length - 1) {
            index++
            if (index === that.listItems.length) {
              that.reviewAudioArr = []
              if (that.page.pages > that.page.current) {
                that.page.current++
                index = 0
                that.init()
              }
            } else {
              that.showDetail(that.listItems[index].paraphraseId)
              that.reviewAudioArr[index][0].play()
            }
          }
        }, false)
      }

      console.log('audioQueue')
      console.log(audioQueue)

      this.reviewAudioArr.push(audioQueue)

      this.$message.success({
        duration: 1000,
        message: `单词${this.detail.paraphraseVO.wordName}资源加载完毕`
      })
    }
  }
}
</script>

<style scoped>
</style>

<template>
    <div style="margin-top: 10px">
        <el-collapse v-for="item in listItems" accordion>
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
                           @click="showDetail(item.paraphraseId)"><i class="el-icon-more-outline"></i>
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
                layout="prev, pager, next, sizes"
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
                            :description="detail.paraphraseVO.meaningChinese"
                            :closable="false"
                            effect="dark"
                            style="margin-top: 5px;"
                            center>
                        <div slot="title">
                            <p>{{this.detail.paraphraseVO.paraphraseEnglish}}</p>
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
            <el-button type="primary" @click="handleDetailClose">确 定</el-button>
        </el-dialog>
        <el-dialog
                title="提示"
                :visible.sync="autoPlayDialogVisible"
                width="300px">
            <span>自动复习即将开始，请确认。</span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="autoPlayDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="autoReviewStart">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>
