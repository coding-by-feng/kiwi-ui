<script>
import { getStore } from '@/util/store'
import paraphraseStarList from '@/api/paraphraseStarList'
import audioPlay from '../../api/audioPlay'

const sleep = function (time) {
  let startTime = new Date().getTime() + time * 1000
  while (new Date().getTime() < startTime) {}
}

const runUpCh2EnCount = 5 // 需要回想时间
const ridChModeCh2EnAudioCount = 11 // 去除中文汉英模式播放的Audio数
const carryChModeCh2EnAudioCount = 17 // 附带中文汉英模式播放的Audio数
const ridChModeEh2ChAudioCount = 10 // 去除中文英汉模式播放的Audio数
const carryChModeEh2ChAudioCount = 16 // 附带中文英汉模式播放的Audio数
const playWordLoadCountOnce = 1 // 一次播放加载的单词个数
const playCountOnce = 5 // 复习模式每页加载的单词个数
const readCountOnce = 10 // 阅读模式每页加载的单词个数

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
        size: readCountOnce,
        total: 0,
        pages: 0
      },
      detail: {
        loading: true,
        paraphraseVO: {},
        dialogVisible: false,
        rememberLoading: false,
        forgetLoading: false,
        showTranslation: false,
        hideTranslationPrompt: '释义已隐藏，点击灰暗区域隐藏/显示',
        showIndex: 0,
        isSleepMode: false,
        listId: null
      },
      isUKPronunciationPlaying: false,
      isUSPronunciationPlaying: false,
      source: getStore({ name: 'pronunciation_source' }),
      reviewType: getStore({ name: 'review_type' }),
      spellType: getStore({ name: 'spell_type' }),
      enParaType: getStore({ name: 'enPara_type' }),
      listItems: [],
      listRefresh: false,
      autoPlayDialogVisible: 0,
      reviewAudioArr: [],
      isReviewStop: false,
      playWordIndex: -1,
      playStepIndex: -1,
      playCountPerWord: 0,
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
      if (this.isChToEn && newVal === runUpCh2EnCount) {
        sleep(3)
      }
      if (newVal > this.playCountPerWord - 1) {
        this.playStepIndex = 0
        this.playWordIndex++
        this.recursiveReview()
        this.detail.loading = true
      } else {
        console.log('this.playWordIndex' + this.playWordIndex)
        console.log('this.playStepIndex' + this.playStepIndex)
        console.log('this.reviewAudioArr.length' + this.reviewAudioArr.length)
        console.log('this.reviewAudioArr[0].length' + this.reviewAudioArr[0].length)
        console.log(this.playCountPerWord)
        this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
        this.currentPlayAudio.play()
      }
    },
    'playWordIndex' (newVal) {
      if (newVal === 0) return
      if (newVal >= playCountOnce) {
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
              center: true,
              message: '当前复习列表已经复习完'
            })
            this.detail.loading = false
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
  computed: {
    // getCarryChModeCh2EnAudioCount () {
    //   let tmp = carryChModeCh2EnAudioCount
    //   if (this.detail.paraphraseVO.wordCharacter === 'phrase') {
    //     tmp -= 6
    //   } else if (this.spellType === '1') {
    //     tmp -= 6
    //   }
    //   return tmp
    // },
    // getRidChModeCh2EnAudioCount () {
    //   let tmp = ridChModeCh2EnAudioCount
    //   if (this.detail.paraphraseVO.wordCharacter === 'phrase') {
    //     tmp -= 6
    //   } else if (this.spellType === '1') {
    //     tmp -= 4
    //   }
    //   return tmp
    // },
    // getCarryChModeEh2ChAudioCount () {
    //   let tmp = carryChModeEh2ChAudioCount
    //   if (this.detail.paraphraseVO.wordCharacter === 'phrase') {
    //     tmp -= 4
    //   } else if (this.spellType === '1') {
    //     tmp -= 6
    //   }
    //   return tmp
    // },
    // getRidChModeEh2ChAudioCount () {
    //   let tmp = ridChModeEh2ChAudioCount
    //   if (this.detail.paraphraseVO.wordCharacter === 'phrase') {
    //     tmp -= 4
    //   } else if (this.spellType === '1') {
    //     tmp -= 4
    //   }
    //   return tmp
    // }
  },
  methods: {
    ...paraphraseStarList,
    async init () {
      if (this.isReview) {
        // stop playing
        this.stopPlaying()
        // clean data
        this.playWordIndex = 0
        this.playStepIndex = 0
        this.isReviewStop = true
        this.reviewAudioArr = []
        this.listItems = []
        this.detail.paraphraseVO = {}
        if (this.currentPlayAudio) {
          this.currentPlayAudio.pause()
          this.currentPlayAudio = null
        }

        const loading = this.$loading({
          lock: true,
          text: `第${this.page.current}页自动复习资源加载中`,
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        try {
          await this.initList()
          await this.initNextReviewDetail(true)
        } catch (e) {
          alert(e)
          await this.init()
          return
        } finally {
          loading.close()
        }
        this.isReviewStop = false
        this.playWordIndex = 0
        this.playStepIndex = 0
        if (this.page.current > 1) {
          this.autoPlayDialogVisible++ // 只有第一次进入复习需要手动触发
          this.$message.success({
            duration: 2000,
            center: true,
            message: '即将开始复习，请稍等！'
          })
        }
        // 手动触发过的直接播放即可
        if (this.autoPlayDialogVisible > 0) {
          await this.showDetail(this.listItems[0].paraphraseId, 0)
          this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playWordIndex]
          this.currentPlayAudio.play()
        }
      } else {
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
        this.page.size = playCountOnce
        await this.initStockListFun()
        this.listRefresh = false
        return
      } else if (this.reviewMode === 'totalReview' || this.reviewMode === 'totalRead') {
        // 全量模式也只查5个
        this.page.size = playCountOnce
      } else if (this.reviewMode === 'enhanceReview' || this.reviewMode === 'enhanceRead') {
        // 复习模式每页只加载5个单词
        this.page.size = playCountOnce
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
    async initNextReviewDetail (isGetDetail) {
      this.detail.loading = true
      if (isGetDetail) {
        await this.getItemDetail(this.listItems[this.playWordIndex].paraphraseId)
            .then(response => {
              this.detail.paraphraseVO = response.data.data
            })
            .catch(e => {
              loading.close()
              console.error(e)
            })
      }
      await this.reviewDetail(this.detail.paraphraseVO.wordCharacter === 'phrase' || this.spellType === '1')
    },
    async showDetail (paraphraseId, index) {
      this.detail.showIndex = index
      await this.getItemDetail(paraphraseId)
          .then(response => {
            this.detail.paraphraseVO = response.data.data
            // 如果是复习最近收藏
            this.detail.listId = this.listItems[this.detail.showIndex].listId
          })
          .catch(e => {
            console.error(e)
          })
      this.detail.dialogVisible = true
    },
    async removeParaphraseStarListFun (paraphraseId, listId) {
      this.$confirm('即将进行删除, 是否继续?', '删除操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then($ => {
        this.removeParaphraseStar({ paraphraseId: paraphraseId, listId: listId })
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
          center: true,
          message: '点击灰色区域记住或牢记当前复习单词！'
        })
      }
    },
    doSuccess () {
      this.$message.success({
        duration: 1000,
        center: true,
        message: '操作成功'
      })
    },
    async playPronunciation (id, sourceUrl, soundmarkType) {
      if (this.isReview) {
        this.$message.warning({
          duration: 1000,
          message: '自动复习期间不允许播放音标'
        })
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
        // let audio = this.pronunciationAudioMap.get(id)
        let audio = new Audio()
        if (this.source === '本地') {
          audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
        } else {
          audio.src = sourceUrl
        }
        audio.preload = 'auto'
        // audio.pause()
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
    async stockReviewStart () {
      this.autoPlayDialogVisible++
      if (this.reviewAudioArr.length) {
        await this.showDetail(this.listItems[0].paraphraseId, 0)
        // this.calPlayCountPerWord()
        this.currentPlayAudio = this.reviewAudioArr[0][0]
        this.currentPlayAudio.play()
      }
    },
    async recursiveReview () {
      await this.showDetail(this.listItems[this.playWordIndex].paraphraseId, this.playWordIndex)
      // 每个单词播放前要计算播放audio数量，词组和单词不一样
      // this.calPlayCountPerWord()
      await this.initNextReviewDetail(false)
      this.currentPlayAudio = this.reviewAudioArr[this.playWordIndex][this.playStepIndex]
      this.currentPlayAudio.play()
    },
    createPronunciationAudio (isUS) {
      if (!this.detail.paraphraseVO.pronunciationVOList) {
        return audioPlay.createAudioFromText('音标缺失')
      }
      let pronunciation = new Audio()
      let first = isUS ? this.detail.paraphraseVO.pronunciationVOList[1] : this.detail.paraphraseVO.pronunciationVOList[1]
      if (this.source === '本地') {
        pronunciation.src = '/wordBiz/word/pronunciation/downloadVoice/' + first.pronunciationId
      } else {
        pronunciation.src = first.sourceUrl
      }
      // pronunciation.pause()
      pronunciation.preload = 'auto'
      pronunciation.loop = false
      return pronunciation
    },
    async reviewDetail (isNotReviewSpell) {
      let audioQueue = []
      let meaningChinese = this.detail.paraphraseVO.meaningChinese
      if (this.detail.paraphraseVO.meaningChinese) {
        meaningChinese = meaningChinese.replaceAll('…', '什么什么')
        meaningChinese = meaningChinese.replaceAll('...', '什么什么')
      }
      if (this.isChToEn) {
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('接下来复习的单词中文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(meaningChinese))
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一遍中文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(meaningChinese))
        audioQueue.push(audioPlay.createAudioFromText('请在脑海回想对应的单词。'))
        audioQueue.push(audioPlay.createAudioFromText('对应的英文单词是'))

        // 如果是没有音标的词组
        if (isNotReviewSpell) {
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.wordName))
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.wordName))
        } else {
          audioQueue.push(this.createPronunciationAudio())
          audioQueue.push(this.createPronunciationAudio(true))
        }

        if (!isNotReviewSpell) {
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('单词的拼写是：'))
          let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
          audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('再读一次拼写：'))
          audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
        }

        // 如果是没有音标的词组
        if (isNotReviewSpell) {
          audioQueue.push(this.createPronunciationAudio())
          audioQueue.push(this.createPronunciationAudio(true))
        }

        if (this.enParaType === '2') {
          if (this.reviewType === '2') {}
          audioQueue.push(audioPlay.createAudioFromText('英文释义是：'))
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('再读一遍英文释义：'))
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
        }
      } else {
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('接下来复习的单词是：'))

        // 如果是没有音标的词组
        if (isNotReviewSpell) {
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.wordName))
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.wordName))
        } else {
          audioQueue.push(this.createPronunciationAudio())
          audioQueue.push(this.createPronunciationAudio(true))
        }

        if (!isNotReviewSpell) {
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('单词的拼写是：'))
          let wordAlphabet = audioPlay.getWordAlphabet(this.detail.paraphraseVO.wordName)
          audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('再读一次拼写：'))
          audioQueue.push(audioPlay.createAudioFromText(wordAlphabet))
        }

        // 如果是没有音标的词组
        if (!isNotReviewSpell) {
          audioQueue.push(this.createPronunciationAudio())
          audioQueue.push(this.createPronunciationAudio(true))
        }

        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('中文释义是：'))
        audioQueue.push(audioPlay.createAudioFromText(meaningChinese))
        if (this.enParaType === '2') {
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('英文释义是：'))
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
        }
        if (this.reviewType === '2')
          audioQueue.push(audioPlay.createAudioFromText('再读一次中文释义：'))
        audioQueue.push(audioPlay.createAudioFromText(meaningChinese))
        if (this.enParaType === '2') {
          if (this.reviewType === '2')
            audioQueue.push(audioPlay.createAudioFromText('再读一遍英文释义：'))
          audioQueue.push(audioPlay.createAudioFromText(this.detail.paraphraseVO.paraphraseEnglish, true))
        }
      }

      for (let j = 0; j < audioQueue.length; j++) {
        audioQueue[j].addEventListener('ended', function () {
          // console.log('end')
          that.detail.loading = true
          if (!that.isReviewStop) {
            that.playStepIndex++
          }
        })
        // audioQueue[j].addEventListener('play', function () {   //开始播放时触发
        //   console.log('play')
        //   that.detail.loading = false
        //   that.$message.success({
        //     showClose: true,
        //     center: true,
        //     message: `play${j}`
        //   })
        // })
        audioQueue[j].addEventListener('playing', function () {
          // console.log('playing')
          that.detail.loading = false
          // that.$message.success({
          //   showClose: true,
          //   center: true,
          //   message: `playing${j}`
          // })
        })
        // audioQueue[j].addEventListener('loadstart', function () {
        //   // console.log('loadstart' + j)
        //   that.$message.success({
        //     showClose: true,
        //     center: true,
        //     message: `loadstart${j}`
        //   })
        // })
        // audioQueue[j].addEventListener('progress', function () {
        //   // console.log('loadstart' + j)
        //   that.$message.success({
        //     showClose: true,
        //     center: true,
        //     message: `progress${j}`
        //   })
        // })
        // audioQueue[j].addEventListener('waiting', function () {
        //   // console.log('loadstart' + j)
        //   that.$message.success({
        //     showClose: true,
        //     center: true,
        //     message: `waiting${j}`
        //   })
        // })
        // audioQueue[j].addEventListener('stalled', function () {
        //   // console.log('loadstart' + j)
        //   that.$message.success({
        //     showClose: true,
        //     center: true,
        //     message: `stalled${j}`
        //   })
        // })
        // audioQueue[j].addEventListener('progress', function () {
        //   console.log('progress')
        //   that.detail.loading = true
        // })
        // audioQueue[j].addEventListener('waiting', function () {
        //   console.log('waiting')
        //   that.detail.loading = true
        // })
        // audioQueue[j].addEventListener('stalled', function () {
        //   console.log('stalled')
        //   that.detail.loading = true
        // })
      }

      this.reviewAudioArr.push(audioQueue)
      this.playCountPerWord = audioQueue.length
      this.$message.success({
        duration: 2000,
        center: true,
        message: `单词${this.detail.paraphraseVO.wordName}资源加载完毕，即将开始播放！`
      })
    },
    stopPlaying () {
      if (this.playWordIndex < 0 || this.playStepIndex < 0) return
      if (this.reviewAudioArr[this.playWordIndex]) {
        if (this.reviewAudioArr[this.playWordIndex][this.playStepIndex]) {
          this.reviewAudioArr[this.playWordIndex][this.playStepIndex].pause()
        }
      }
    },
    skipCurrentReview () {
      this.$message.success({
        duration: 2000,
        center: true,
        message: `单词${this.detail.paraphraseVO.wordName}已跳过！`
      })

      this.stopPlaying()
      // 跳过当前单词的复习
      this.playStepIndex = this.playCountPerWord
    },
    rememberInSleepMode () {
      if (this.reviewMode === 'stockReview' || this.reviewMode === 'stockRead') {
        this.rememberOneFun()
      } else {
        this.keepInMindFun()
      }
    },
    rememberOneFun () {
      this.skipCurrentReview()
      this.rememberOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(res => {
            this.doSuccess()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    keepInMindFun () {
      this.skipCurrentReview()
      this.keepInMind(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
          .then(res => {
            this.doSuccess()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    forgetOneFun () {
      this.forgetOne(this.detail.paraphraseVO.paraphraseId, this.detail.listId)
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
            center: true,
            message: '当前已经是复习页第一个'
          })
          return
        } else {
          if (this.page.current === 1) {
            this.$message.warning({
              duration: 1000,
              center: true,
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
            center: true,
            message: '已经是当前复习页最后一个'
          })
          return
        } else {
          if (this.page.current === this.page.pages) {
            this.$message.warning({
              duration: 1000,
              center: true,
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
            center: true,
            message: '当前已经是最后一页最后一个'
          })
          return
        }
      }
      await this.showDetail(this.listItems[this.detail.showIndex].paraphraseId, this.detail.showIndex)
    },
    // calPlayCountPerWord () {
    //   if (this.isChToEn) {
    //     if (this.reviewType === '2') {
    //       this.playCountPerWord = this.getCarryChModeCh2EnAudioCount
    //     } else {
    //       this.playCountPerWord = this.getRidChModeCh2EnAudioCount
    //     }
    //   } else {
    //     if (this.reviewType === '2') {
    //       this.playCountPerWord = this.getCarryChModeCh2EnAudioCount
    //     } else {
    //       this.playCountPerWord = this.getRidChModeEh2ChAudioCount
    //     }
    //   }
    // }
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
            {{ isShowParaphrase ? item.meaningChinese : '释义已隐藏' }}
          </div>
        </div>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="showDetail(item.paraphraseId, index)"><i class="el-icon-more-outline"></i>
        </el-button>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="removeParaphraseStarListFun(item.paraphraseId, item.listId)"><i
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
                   v-if="isReview"
                   @click="switchSleepMode"
                   size="mini">
          <i class="el-icon-thumb"></i>
        </el-button>
        <el-button type="info"
                   v-if="isReview"
                   @click="init"
                   size="mini">
          <i class="el-icon-refresh" v-show="!detail.loading"></i>
          <i class="el-icon-loading" v-show="detail.loading"></i>
        </el-button>
        <el-button type="info"
                   size="mini" @click="handleShowDetail">
          <i class="el-icon-open"></i>
        </el-button>
        <el-button type="info" size="mini" v-loading="detail.forgetLoading" @click="forgetOneFun">遗忘</el-button>
      </div>
      <el-card class="box-card">
        <div slot="header">
          <el-row type="flex" justify="end" style="background-color: #8c939d;padding-top: 5px;">
            <el-col>
              <el-tag type="success">{{ detail.paraphraseVO.wordCharacter }}</el-tag>
              <el-tag v-if="detail.paraphraseVO.wordLabel && detail.paraphraseVO.wordLabel !== ''">
                {{ detail.paraphraseVO.wordLabel }}
              </el-tag>
            </el-col>
          </el-row>
          <el-row v-if="!detail.paraphraseVO.isOverlength" type="flex" justify="end"
                  style="background-color: #8c939d;padding-top: 5px;">
            <el-col v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
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
          <div v-if="detail.paraphraseVO.isOverlength"
               v-for="wordPronunciationVO in detail.paraphraseVO.pronunciationVOList">
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
          <div @click="detail.showTranslation = !detail.showTranslation">
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
        </div>
        <div
            v-if="detail.paraphraseVO.exampleVOList && detail.paraphraseVO.exampleVOList.length < 1">
          <el-alert
              type="info"
              title="该释义暂时没有例句"
              center
              effect="light"
              :closable="false">
          </el-alert>
        </div>
        <div v-for="wordParaphraseExampleVO in this.detail.paraphraseVO.exampleVOList">
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
        :visible="autoPlayDialogVisible === 0 && isReview"
        :show-close="false"
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
      <div slot="footer" class="dialog-footer">
        <el-button type="info" @click="stockReviewStart">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
