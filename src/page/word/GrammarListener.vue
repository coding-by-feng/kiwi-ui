<script>
import kiwiConsts from "@/const/kiwiConsts";
import {readFile, escapeHTML} from '@/util/fileUtil'
import NoSleep from 'nosleep.js'
import msgUtil from '@/util/msg'
import {isEmptyStr, isNotEmptyStr, removeBlankLines} from '@/util/util'
import {Howl, Howler} from 'howler';
import {toFixedNum} from '@/util/mathUtil'
import {countSectionSyllables, getStrCount} from '@/util/wordUtil'
import {secToMicroTime} from "@/util/dateUtil";

const PER_SHOW_LINES_SIZE = 3

let that
let noSleep

function changeSearchKey(searchKey) {
  let lastChar = searchKey.substring(searchKey.length - 1, searchKey.length)
  console.log('lastChar: ' + lastChar)
  if (',' === lastChar || '，' === lastChar || '。' === lastChar || '’' === lastChar) {
    searchKey = searchKey.substring(0, searchKey.length - 1) + ' '
  }
  if ('$' === lastChar) {
    if (searchKey.length === 1) {
      return ''
    }
    searchKey = searchKey.substring(0, searchKey.length - 1) + ' ';
  }
  return searchKey;
}

function buildSearchKey(searchKey, currentGrammarItem, j) {
  let lastChar = currentGrammarItem.substring(j - 1, j);
  searchKey += lastChar;
  let lastNewLineIndex = searchKey.lastIndexOf('\n');
  if (lastNewLineIndex > -1 && lastNewLineIndex < searchKey.length) {
    searchKey = searchKey.substring(lastNewLineIndex + 1, searchKey.length)
  }
  return searchKey.replaceAll('  ', ' ');
}

export default {
  data() {
    return {
      innerHeightPx: window.innerHeight * 0.7 + 'px',
      currentGrammar: null,
      currentGrammarHint: '请选择当前的语法篇章',
      currentItemsIndex: 0,
      currentGrammarRemainingSrt: [],
      currentGrammarSrt: null,
      currentGrammarItems: [],
      currentGrammarItemPlayDuration: [],
      currentGrammarPlayPercentage: 0,
      currentGrammarStartPlayTime: null,
      currentGrammarPlayDuration: null,
      isPlaying: false,
      isEnd: false,
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
    noSleep.disable()
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
        this.currentGrammarHowl = null
        this.currentGrammarRemainingSrt = []
        this.isPlaying = false
        this.currentGrammarPlayDuration = null
        this.currentGrammarStartPlayTime = null
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
        this.currentGrammarItemPlayDuration = []
      }
      if (isCleanItemsRelatedData) {
      }
    },
    selectGrammar(command) {
      this.loading = true
      this.cleaningAll()
      this.currentGrammar = command
      this.currentGrammarHint = kiwiConsts.GRAMMAR_EN_TO_CH_HINT.get(command)
      let grammarTxt = readFile('grammar/txt/' + command + '.txt');
      this.currentGrammarSrt = readFile('grammar/mp3/' + command + '.srt');
      this.currentGrammarSrt.split('\n').forEach(line => {
        if (isNotEmptyStr(line)) {
          this.currentGrammarRemainingSrt.push(line)
        }
      })
      grammarTxt = removeBlankLines(grammarTxt)
      console.log('grammarTxt:')
      console.log(grammarTxt)
      let grammarTxtLines = grammarTxt.split('\n');
      for (let i = 0; i < grammarTxtLines.length; i += PER_SHOW_LINES_SIZE) {
        let item = ''
        for (let j = 0; j < PER_SHOW_LINES_SIZE; j++) {
          if (i + j < grammarTxtLines.length) {
            item += grammarTxtLines[i + j] + '\n';
          }
        }
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
    increaseStopDuration() {
      if (this.thisStopStartTime) {
        this.thisStopDuration += new Date().getTime() - this.thisStopStartTime.getTime()
        console.log('that.thisStopDuration = ' + that.thisStopDuration)
      }
    },
    prepareCurrentGrammarItemsShowTime() {
      if (this.currentGrammarItemPlayDuration && this.currentGrammarItemPlayDuration.length) {
        return
      }

      this.currentGrammarSrt.split('\n').forEach(line => {
        if (isNotEmptyStr(line)) {
          this.currentGrammarRemainingSrt.push(line)
        }
      })

      for (let i = 1; i < this.currentGrammarItems.length; i++) {
        let currentGrammarItem = this.currentGrammarItems[i];
        console.log('currentGrammarItem: ' + i);
        console.log(currentGrammarItem);
        let isFoundPlayEndTimeInSrt = false;
        let searchKey = '';
        for (let j = 1; j < currentGrammarItem.length; j++) {
          searchKey = buildSearchKey(searchKey, currentGrammarItem, j);
          console.log(`searchKey: '${searchKey}'`);
          if (isEmptyStr(searchKey)) {
            console.warn('searchKey is empty')
            continue
          }
          let searchResultCount = getStrCount(this.currentGrammarSrt, searchKey)
          if (searchResultCount < 1) {
            searchKey = changeSearchKey(searchKey)
            if (isEmptyStr(searchKey)) {
              continue;
            } else {
              console.log('searchKey cannot be indexed, attempt to change search key: ' + searchKey)
            }
            searchResultCount = getStrCount(this.currentGrammarSrt, searchKey);
            if (searchResultCount < 1) {
              console.error('searchKey cannot be indexed, after change search key: ' + searchKey)
              break;
            }
          }
          if (searchResultCount > 1) {
            console.log('searchKey can be indexed, count is ' + searchResultCount)
            continue;
          }
          console.log('searchResultCount is ' + searchResultCount)
          for (let k = 0; k < this.currentGrammarRemainingSrt.length; k++) {
            if (this.currentGrammarRemainingSrt[k].indexOf(searchKey) > -1) {
              console.log('this.currentGrammarRemainingSrt[k] = ' + this.currentGrammarRemainingSrt[k])
              console.log('this.currentGrammarRemainingSrt[k - 1] = ' + this.currentGrammarRemainingSrt[k - 1])
              isFoundPlayEndTimeInSrt = true
              let prevItemPlayEndTimeLine = this.currentGrammarRemainingSrt[k - 1]
              let prevSectionPlayEndTime = secToMicroTime(prevItemPlayEndTimeLine.toString().split('-->')[0].trim());
              this.currentGrammarItemPlayDuration.push(prevSectionPlayEndTime);
              this.currentGrammarRemainingSrt = this.currentGrammarRemainingSrt.slice(k - 1, this.currentGrammarRemainingSrt.length)
              break
            }
          }
          if (!isFoundPlayEndTimeInSrt) {
            msgUtil.msgError(this, '字幕自动滚动失败！');
            throw new Error('Cannot found the start play time!');
          } else {
            searchKey = ''
            console.log('searchKey search success!');
            break
          }
        }
      }

      for (let i = 0; i < this.currentGrammarItemPlayDuration.length; i++) {
        console.log(`this.currentGrammarItemPlayDuration[${i}] = ` + this.currentGrammarItemPlayDuration[i])
      }
    },
    setupCountdownFun: function () {
      this.countdownFun = setInterval(() => {
        if (this.canAdjustCurrentItem) {
          return
        }

        console.log('this.thisStopDuration ' + this.thisStopDuration)
        let future = new Date().getTime() - this.thisStopDuration
        let currentGrammarPlayedDuration = future - this.currentGrammarStartPlayTime
        console.log(`currentGrammarPlayedDuration: ${currentGrammarPlayedDuration}`)
        console.log(`this.currentGrammarPlayDuration: ${this.currentGrammarPlayDuration}`)
        this.currentGrammarPlayPercentage = toFixedNum(Math.min(currentGrammarPlayedDuration * 100 / this.currentGrammarPlayDuration, 100), 2)
        console.log('this.currentGrammarPlayPercentage = ' + this.currentGrammarPlayPercentage)

        if (this.currentItemsIndex < this.currentGrammarItems.length - 1) {
          console.log(`currentItemPlayDuration: ${this.currentGrammarItemPlayDuration[this.currentItemsIndex]}`)
          if (currentGrammarPlayedDuration - this.currentGrammarItemPlayDuration[this.currentItemsIndex] > 0) {
            this.nextItem()
          }
        }
      }, 200)
    },
    startPlay() {
      console.log('startPlay')
      this.loading = true
      if (this.isEnd) {
        this.isEnd = false
        this.selectGrammar(this.currentGrammar)
      }
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
                that.currentGrammarPlayDuration = this._duration * 1000
                that.cleaning(false, true, false, true)

                that.prepareCurrentGrammarItemsShowTime()

                that.increaseStopDuration()

                that.setupCountdownFun()

                that.isPlaying = true
                noSleep.enable()
                that.thisStopStartTime = null
                that.loading = false
                if (that.currentGrammarStartPlayTime === null) {
                  that.currentGrammarStartPlayTime = new Date().getTime();
                }
              },
              onend: function () {
                that.isPlaying = false
                that.isEnd = true
                that.currentGrammarPlayPercentage = 100
                that.cleaning(false, true, false, true)
              }
              ,
              onpause: function () {
                that.isPlaying = false
                that.cleaning(false, true, false, true)
              }
            }
        )
      }

      this.currentGrammarHowl.play();
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
      return '=====来自张满胜老师的《语法新思维》，侵删====='
    },
    showNextItemInAdvance(index) {
      if (index < this.currentGrammarItems.length) {
        return this.currentGrammarItems[index + 1];
      }
      return '=====来自张满胜老师的《语法新思维》，侵删====='
    },
    adjustCurrentItem() {
      if (!this.canAdjustCurrentItem) {
        msgUtil.msgSuccess(this, '当前字幕自动滚动已锁住，不会自动滚动，调整完字幕之后请再次点击开启字幕自动滚动')
      } else {
        msgUtil.msgSuccess(this, '当前字幕自动滚动已开启')
      }
      this.canAdjustCurrentItem = !this.canAdjustCurrentItem
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