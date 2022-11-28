<script>
import kiwiConsts from "@/const/kiwiConsts";
import {readFile, escapeHTML} from '@/util/fileUtil'
import NoSleep from 'nosleep.js'
import msgUtil from '@/util/msg'
import {removeBlankLines} from '@/util/util'
import {Howl, Howler} from 'howler';
import {toFixedNum} from '@/util/mathUtil'

const PER_SHOW_LINES_SIZE = 4

let that
let noSleep

export default {
  data() {
    return {
      innerHeightPx: window.innerHeight * 0.7 + 'px',
      currentGrammar: null,
      currentGrammarHint: '请选择当前的语法篇章',
      currentMp3TotalTime: 0,
      currentItemsIndex: 0,
      currentGrammarTxtLength: 0,
      currentGrammarItems: [],
      currentGrammarItemsShowTime: [],
      currentGrammarItemsFirstPlayTime: null,
      currentGrammarPlayPercentage: 0,
      isPlaying: false,
      currentGrammarHowl: null,
      countdownFun: null,
      GRAMMAR_EN_TO_CH_HINT: kiwiConsts.GRAMMAR_EN_TO_CH_HINT,
      loading: false,
      canAdjustCurrentItem: false,
      thisStopDuration: 0,
      thisStopStartTime: null
    }
  },
  beforeCreate: function () {
    that = this
    noSleep = new NoSleep()
    Howler.html5PoolSize = 30
    Howler.autoSuspend = false
  },
  destroyed() {
    this.cleaningAll()
  },
  computed: {},
  methods: {
    ...msgUtil,
    cleaningAll() {
      this.cleaning(true, true, true, true)
    },
    cleaning(isCleanHowl, isCleanCountDown, isCleanItems, isCleanItemsRelatedData) {
      if (isCleanHowl && this.currentGrammarHowl) {
        Howler.stop()
        this.currentGrammarHowl = null;
        this.isPlaying = false
      }
      if (isCleanCountDown && this.countdownFun) {
        clearInterval(this.countdownFun)
      }
      if (isCleanItems) {
        this.currentItemsIndex = 0;
        this.currentGrammarItems = []
        this.currentGrammarPlayPercentage = 0
        this.thisStopDuration = 0
        this.thisStopStartTime = null
      }
      if (isCleanItemsRelatedData) {
        this.currentGrammarItemsShowTime = []
      }
      noSleep.disable()
    },
    selectGrammar(command) {
      this.loading = true
      this.cleaningAll()
      this.currentGrammar = command
      this.currentGrammarHint = kiwiConsts.GRAMMAR_EN_TO_CH_HINT.get(command)
      let grammarTxt = readFile('grammar/txt/' + command + '.txt');
      grammarTxt = removeBlankLines(grammarTxt)
      this.currentGrammarTxtLength = grammarTxt.length
      let grammarTxtLines = grammarTxt.split('\n');
      for (let i = 0; i < grammarTxtLines.length; i += PER_SHOW_LINES_SIZE) {
        let item = ''
        for (let j = 0; j < PER_SHOW_LINES_SIZE; j++) {
          if (i + j < grammarTxtLines.length) {
            item += grammarTxtLines[i + j] + '\n';
          }
        }
        console.log(item)
        if (item !== '') {
          this.currentGrammarItems.push(item);
        }
      }
      this.loading = false
    },
    nextItem: function () {
      console.log('nextItem this.currentItemsIndex = ' + this.currentItemsIndex)
      if (this.currentItemsIndex >= this.currentGrammarItems.length) {
        msgUtil.msgSuccess(this, '已经到底部啦')
        return
      }
      this.currentItemsIndex++;
      this.$refs.grammarPlane.next()
    },
    prevItem: function () {
      if (this.currentItemsIndex < 1) {
        msgUtil.msgSuccess(this, '已经到顶部啦')
        return
      }
      this.currentItemsIndex--;
      this.$refs.grammarPlane.prev()
    },
    startPlay() {
      console.log('startPlay')
      this.loading = true
      if (!this.currentGrammarHowl) {
        this.currentGrammarHowl = new Howl({
          src: ['grammar/mp3/' + this.currentGrammar + '.mp3'],
          autoplay: false,
          loop: false,
          volume: 0.5,
          html5: true,
          format: ['mp3'],
          onplay: function () {
            console.log('onplay this._duration = ' + this._duration)
            that.currentMp3TotalTime = this._duration
            that.cleaning(false, true, false, true)

            let now = new Date();
            let timePerUnit = that.currentMp3TotalTime / that.currentGrammarTxtLength;
            for (let i = 0; i < that.currentGrammarItems.length; i++) {
              if (i < 1) {
                that.currentGrammarItemsShowTime.push(now.getTime() + that.currentGrammarItems[0].length * timePerUnit * 1000);
              } else {
                let nextTimeInFuture = that.currentGrammarItemsShowTime[i - 1] + that.currentGrammarItems[i].length * timePerUnit * 1000;
                that.currentGrammarItemsShowTime.push(nextTimeInFuture);
              }
            }

            if (that.thisStopStartTime) {
              that.thisStopDuration += new Date().getTime() - that.thisStopStartTime.getTime()
              console.log('that.thisStopDuration = ' + that.thisStopDuration)
            }
            that.countdownFun = setInterval(() => {
              that.currentGrammarPlayPercentage = toFixedNum(that.currentItemsIndex / that.currentGrammarItems.length, 2)
              if (that.canAdjustCurrentItem) {
                return
              }
              if (that.currentItemsIndex < that.currentGrammarItems.length) {
                let future = new Date().getTime() - that.thisStopDuration
                if (future > that.currentGrammarItemsShowTime[that.currentItemsIndex]) {
                  that.nextItem()
                }
              }
            }, 300)

            that.isPlaying = true
            noSleep.enable()
            that.thisStopStartTime = null
          },
          onend: function () {
            that.isPlaying = false
            that.cleaning(false, true, false, true)
          },
          onpause: function () {
            that.isPlaying = false
            that.cleaning(false, true, false, true)
          }
        })
      }

      this.currentGrammarHowl.play();
      this.loading = false
    },
    stopPlay() {
      if (this.countdownFun) {
        clearInterval(this.countdownFun);
      }
      if (this.currentGrammarHowl) {
        this.currentGrammarHowl.pause();
      }
      this.isPlaying = false
      this.thisStopStartTime = new Date()
    },
    showPrevItemAgain(index) {
      if (index > 0) {
        return this.currentGrammarItems[index - 1];
      }
      return '=========分割线(上面已无更多字幕显示)========='
    },
    showNextItemInAdvance(index) {
      if (index < this.currentGrammarItems.length) {
        return this.currentGrammarItems[index + 1];
      }
      return '=========分割线(下面已无更多字幕显示)========='
    },
    adjustCurrentItem() {
      if (!this.canAdjustCurrentItem) {
        msgUtil.msgSuccess(this, '当前字幕自动滚动已锁住，不会自动滚动，调整完字幕之后请再次点击开启字幕自动滚动');
      } else {
        msgUtil.msgSuccess(this, '当前字幕自动滚动已开启');
      }
      this.canAdjustCurrentItem = !this.canAdjustCurrentItem;
    },
  }
}
</script>

<template>
  <div class="text item">
    <div style="position: fixed; top: 60px; left: 35px; z-index: 99;">
      <el-dropdown size="mini" plain
                   split-button @command="selectGrammar">
        {{ this.currentGrammarHint }}
        <el-dropdown-menu slot="dropdown">
          <div v-for="(value, key) in GRAMMAR_EN_TO_CH_HINT" :key="key">
            <el-dropdown-item :command="value[0]">{{ value[1] }}</el-dropdown-item>
          </div>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <div style="margin-top: 36px">
      <el-progress v-loading="loading" v-if="currentGrammar" :text-inside="true" :stroke-width="20"
                   :percentage="currentGrammarPlayPercentage"
                   color="#C0C0C0"></el-progress>
      <el-carousel ref="grammarPlane" v-if="currentGrammar" :height="innerHeightPx"
                   direction="vertical" :loop="false" :autoplay="false">
        <el-carousel-item v-for="(item, index) in currentGrammarItems" :key="index">
          <p style="white-space: pre-line; text-align: left; font-size: smaller; color: #ABABAB;">
            {{ showPrevItemAgain(index) }}
          </p>
          <p style="white-space: pre-line; text-align: left; font-size: small;">{{ item }}</p>
          <p style="white-space: pre-line; text-align: left; font-size: smaller; color: #ABABAB;">
            {{ showNextItemInAdvance(index) }}
          </p>
        </el-carousel-item>
      </el-carousel>
    </div>
    <div style="position: fixed; bottom: 15px; right: 15px; z-index: 2147483646; text-align: right; line-height: 30px;">
      <el-button v-loading="loading" v-if="!isPlaying && currentGrammar" icon="el-icon-video-play" size="mini"
                 @click="startPlay"></el-button>
      <el-button v-if="isPlaying && currentGrammar" icon="el-icon-video-pause" size="mini"
                 @click="stopPlay"></el-button>
      <el-button v-if="currentGrammar" :icon="canAdjustCurrentItem ? 'el-icon-lock' : 'el-icon-unlock'" size="mini"
                 @click="adjustCurrentItem"></el-button>
      <el-button v-if="currentGrammar && canAdjustCurrentItem" icon="el-icon-top" size="mini"
                 @click="prevItem"></el-button>
      <el-button v-if="currentGrammar && canAdjustCurrentItem" icon="el-icon-bottom" size="mini"
                 @click="nextItem"></el-button>
    </div>
  </div>
</template>

<style scoped>
</style>