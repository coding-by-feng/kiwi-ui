<script>
import wordSearch from '@/api/wordSearch'
import wordStarList from '@/api/wordStarList'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'

let that
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
      let word = ''
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
          this.$message.success('保存成功')
        }).catch(e => {
          console.error(e)
        })
      } else if (this.collect.type === 'paraphrase') {
        let data = { paraphraseId: this.collect.collectId, listId: listId }
        await this.putParaphraseStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.$message.success('保存成功')
        }).catch(e => {
          console.error(e)
        })
      } else if (this.collect.type === 'example') {
        let data = { exampleId: this.collect.collectId, listId: listId }
        await this.putExampleStarList(data).then(response => {
          this.collect.listSelectDialogVisible = false
          this.$message.success('保存成功')
        }).catch(e => {
          console.error(e)
        })
      }
      loading.close()
    },
    playDetail2Audio () {
      this.playText('自动语音播报功能正在开发中，复习单词可以脱离双手的操作，洗澡，洗碗，吃饭等时刻都可以学习英语哦，敬请期待！')
    },
    playText(text){
      let url = 'http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&text=' + encodeURI(text)
      let audio = new Audio(url)
      audio.src = url;
      audio.play();
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

    .outline_fix_top {
        position: absolute;
        top: 5px;
        right: 5px;
    }
</style>

<template>
    <el-container>
        <el-header>
            <el-alert
                    type="warning"
                    :closable="false"
                    effect="light"
                    center>
                <div slot="title">
                    <b style="font-family: 'Helvetica Neue'; font-size: xx-large">{{wordInfo.wordName}}</b>
                    <el-button type="text"><i
                            class="el-icon-video-play outline_fix_top"
                            style="color: #76838f"
                            @click="playDetail2Audio"></i>
                    </el-button>
                    <el-button type="text"><i
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
                            <audio id="test" src=""></audio>
                            <i class="el-icon-video-play" v-show="false"></i>
                        </el-tag>
                    </el-col>
                </el-row>
                <div v-for="wordParaphraseVO in wordCharacterVO.wordParaphraseVOList" v>
                    <el-card class="box-card">
                        <div slot="header">
                            <el-alert
                                    type="info"
                                    :description="isShowParaphrase ? wordParaphraseVO.meaningChinese : '释义已隐藏，点击上面图标显示'"
                                    :closable="false"
                                    effect="dark"
                                    center>
                                <div slot="title">
                                    {{wordParaphraseVO.paraphraseEnglish}}
                                    <el-button type="text">
                                        <i class="el-icon-more"
                                           @click="isShowParaphrase = !isShowParaphrase"
                                           style="color: #FFFFFF"></i>
                                    </el-button>
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
    </el-container>
</template>


