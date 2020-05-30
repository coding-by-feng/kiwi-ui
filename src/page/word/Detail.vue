<script>
import wordSearch from '@/api/wordSearch'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'
import audioPlay from '@/api/audioPlay'
import wordStarList from '@/api/wordStarList'

let that

let index = 0

export default {
  name: 'wel',
  components: {},
  data () {
    return {
      isShowParaphrase: false,
      pronunciationAudioMap: new Map(),
      devSwitch: false,
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
        paraphraseCollectMap: new Map(),
        dialogTitle: '',
        collectId: 0
      },
    }
  },
  beforeCreate: function () {
    that = this
  },
  async mounted () {
    await this.init()
    // await this.initPronunciation()
  },
  watch: {
    '$route' () {
      this.init()
    }
  },
  methods: {
    ...wordSearch,
    ...wordStarList,
    ...paraphraseStarList,
    ...exampleStarList,
    async init () {
      let mode = this.$route.query.mode
      if ('autoReview' === mode) {
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
              this.autoReview(wordIdList)
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
        word = this.$route.query.word
      }
      if (word === this.wordInfo.wordName) {
        return
      }
      await this.queryWordDetail(word).then(response => {
        if (response.data.code) {
          this.wordInfo = response.data.data
        } else {
          this.wordInfo = { wordName: '' }
        }
      }).catch(e => {
        console.error(e)
      })
    },
    async initPronunciation () {
      if (this.wordInfo.wordCharacterVOList) {
        let wordCharacterVOList = this.wordInfo.wordCharacterVOList
        for (let i = 0; i < wordCharacterVOList.length; i++) {
          let pronunciationVOList = wordCharacterVOList[i].wordPronunciationVOList
          for (let j = 0; j < pronunciationVOList.length; j++) {
            let audio = new Audio()
            audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + pronunciationVOList[j].pronunciationId
            this.pronunciationAudioMap.set(pronunciationVOList[j].pronunciationId, audio)
          }
        }
      }
    },
    async autoReview (wordIdList) {
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
    autoReviewStart () {
      this.autoPlayDialogVisible = false
      console.log('this.audioList=')
      console.log(this.audioList)
      if (index === 0 && this.audioList.length) {
        console.log(this.audioList[0])
        this.wordInfo = this.autoWordList[0]
        this.audioList[0].play()
      }
    },
    async playPronunciation (id) {
      try {
        // let audio = this.pronunciationAudioMap.get(id)
        let audio = new Audio()
        audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        await audio.play()
      } catch (e) {
        console.error(e)
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
        return 'el-icon-remove-outline outline_fix'
      }
      return 'el-icon-circle-plus-outline outline_fix'
    },
    async wordCollectClickFun () {
      await this.getWordStarList().then(response => {
        this.collect.starListData = response.data.data
        this.collect.type = 'word'
        this.collect.listSelectDialogVisible = true
        this.collect.dialogTitle = '选择想要保存的单词本'
      }).catch(e => {
        console.error(e)
        this.$message.error('单词本数据加载异常')
      })
    },
    async paraphraseCollectClickFun (paraphraseId) {
      this.collect.collectId = paraphraseId
      await this.getParaphraseStarList().then(response => {
        this.collect.starListData = response.data.data
        this.collect.type = 'paraphrase'
        this.collect.listSelectDialogVisible = true
        this.collect.dialogTitle = '选择想要保存的释义本'
      }).catch(e => {
        console.error(e)
        this.$message.error('释义本本数据加载异常')
      })
    },
    async exampleCollectClickFun (exampleId) {
      this.collect.collectId = exampleId
      await this.getExampleStarList().then(response => {
        this.collect.starListData = response.data.data
        this.collect.type = 'example'
        this.collect.listSelectDialogVisible = true
        this.collect.dialogTitle = '选择想要保存的例句本'
      }).catch(e => {
        console.error(e)
        this.$message.error('例句本数据加载异常')
      })
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
      audioPlay.playWordDetail(this.wordInfo, autoAudio)
      autoAudio.addEventListener('ended', function () {
        index++
        that.wordInfo = this.autoWordList[index]
        that.audioList[index].play()
      }, false)
      this.audioList.push(autoAudio)
      this.autoWordList.push(this.wordInfo)
    },
    doSuccess () {
      this.$message.success({
        duration: 1000,
        message: '操作成功'
      })
    }
  }
}

</script>

<style>
    .row-bg {
        padding: 10px 0;
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
</style>

<template>
    <el-container>
        <el-header>
            <el-alert
                    v-if="''!==wordInfo.wordName"
                    type="warning"
                    :closable="false"
                    effect="light"
                    center>
                <div slot="title">
                    <el-button type="text">
                        <i class="el-icon-more outline_fix_top_left"
                           @click="isShowParaphrase = !isShowParaphrase"
                           style="color: #76838f"></i>
                    </el-button>
                    <b style="font-family: 'Helvetica Neue'; font-size: xx-large">{{wordInfo.wordName}}</b>
                    <el-button type="text"><i
                            class="el-icon-video-play outline_fix_top_right"
                            style="color: #76838f"
                            @click="playDetail2Audio"></i>
                    </el-button>
                    <el-button type="text"
                               v-if="wordInfo.wordName.length>0"><i
                            :class="getWordCollectClass()"
                            style="color: #76838f"
                            @click="wordCollectClickFun()"></i>
                    </el-button>
                </div>
            </el-alert>
        </el-header>
        <el-main>
            <div v-for=" (wordCharacterVO) in wordInfo.wordCharacterVOList">
                <el-row type="flex" class="row-bg" justify="end">
                    <el-col>
                        <el-tag type="success">{{wordCharacterVO.wordCharacter}}</el-tag>
                        <el-tag v-if="wordCharacterVO.wordLabel != ''">{{wordCharacterVO.wordLabel}}</el-tag>
                    </el-col>
                    <el-col v-for="wordPronunciationVO in wordCharacterVO.wordPronunciationVOList">
                        <el-tag @click="playPronunciation(wordPronunciationVO.pronunciationId)">
                            {{wordPronunciationVO.soundmark}}[{{wordPronunciationVO.soundmarkType}}]
                            <i class="el-icon-video-play"></i>
                        </el-tag>
                    </el-col>
                </el-row>
                <div v-for="wordParaphraseVO in wordCharacterVO.wordParaphraseVOList" v>
                    <el-card class="box-card">
                        <div slot="header">
                            <el-alert
                                    type="info"
                                    :description="isShowParaphrase ? wordParaphraseVO.meaningChinese : '释义已隐藏，点击上面图标...显示'"
                                    :closable="false"
                                    effect="dark"
                                    center>
                                <div slot="title">
                                    {{wordParaphraseVO.paraphraseEnglish}}
                                    <el-button type="text"><i
                                            :class="getParaphraseCollectClass(wordParaphraseVO.paraphraseId)"
                                            style="color: #FFFFFF"
                                            @click="paraphraseCollectClickFun(wordParaphraseVO.paraphraseId)"></i>
                                    </el-button>
                                </div>
                            </el-alert>
                        </div>
                        <div v-if="wordParaphraseVO.wordParaphraseExampleVOList == null">
                            <el-alert
                                    type="info"
                                    title="该释义暂时没有例句"
                                    center
                                    effect="light"
                                    :closable="false">
                            </el-alert>
                        </div>
                        <div v-for="wordParaphraseExampleVO in wordParaphraseVO.wordParaphraseExampleVOList">
                            <el-alert
                                    type="info"
                                    center
                                    effect="light"
                                    :description="wordParaphraseExampleVO.exampleTranslate"
                                    :closable="false">
                                <div slot="title">
                                    {{wordParaphraseExampleVO.exampleSentence}}
                                    <el-button type="text"><i
                                            class="el-icon-circle-plus-outline outline_fix"
                                            style="color: #76838f"
                                            @click="exampleCollectClickFun(wordParaphraseExampleVO.exampleId)"></i>
                                    </el-button>
                                </div>
                            </el-alert>
                        </div>
                    </el-card>
                    <el-divider></el-divider>
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
                                <el-button type="primary" @click="selectOneList(scope.row.id)">
                                    {{scope.row.listName}}
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
            <span>自动复习计划即将开始，请确认。</span>
            <span slot="footer" class="dialog-footer">
    <el-button @click="autoPlayDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="autoReviewStart">确 定</el-button>
  </span>
        </el-dialog>
    </el-container>
</template>


