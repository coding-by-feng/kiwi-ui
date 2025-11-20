<script>
import kiwiConsts from "@/const/kiwiConsts"
import {readFile} from '@/util/fileUtil'
import NoSleep from 'nosleep.js'
import msgUtil from '@/util/msg'
import {isEmptyStr, isNotEmptyStr, removeBlankLines} from '@/util/util'
import {Howl, Howler} from 'howler'
import {toFixedNum} from '@/util/mathUtil'
import {getStrCount} from '@/util/wordUtil'
import {secToMicroTime} from "@/util/dateUtil"

const PER_SHOW_LINES_SIZE = 3

let that
let noSleep

function changeSearchKey(searchKey, isStripHead) {
  if (isStripHead) {
    let isMultipleBlank = getStrCount(searchKey, ' ') > 1
    let isOnlyOneBlankAtEnd = getStrCount(searchKey, ' ') === 1 && searchKey.endsWith(' ')
    if (!isOnlyOneBlankAtEnd || isMultipleBlank) {
      let blankIndex = searchKey.indexOf(' ')
      searchKey = searchKey.substring(blankIndex + 1, searchKey.length)
      console.log(`striped the search key to new one(${searchKey})`)
      return searchKey
    }
  }
  let lastChar = searchKey.substring(searchKey.length - 1, searchKey.length)
  console.log('lastChar: ' + lastChar)
  if (',' === lastChar || '，' === lastChar || '。' === lastChar || '’' === lastChar || '$' === lastChar) {
    if (searchKey.length === 1) {
      return ''
    }
    searchKey = searchKey.substring(0, searchKey.length - 1) + ' '
  }
  if (searchKey.indexOf('  ') > -1) {
    searchKey = searchKey.replaceAll('  ', ' ')
  }
  return searchKey
}

function buildSearchKey(searchKey, currentGrammarItem, j) {
  let lastChar = currentGrammarItem.substring(j - 1, j)
  searchKey += lastChar
  let lastNewLineIndex = searchKey.lastIndexOf('\n')
  if (lastNewLineIndex > -1 && lastNewLineIndex < searchKey.length) {
    searchKey = searchKey.substring(lastNewLineIndex + 1, searchKey.length)
  }
  return searchKey.replaceAll('  ', ' ')
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
      isStopped: false,
      isEnd: false,
      currentGrammarHowl: null,
      countdownFun: null,
      GRAMMAR_EN_TO_CH_HINT: kiwiConsts.GRAMMAR_EN_TO_CH_HINT,
      loading: false,
      canAdjustCurrentItem: false,
      thisStopDuration: 0,
      thisStopStartTime: null,
      playbackRate: 1.0,
      volume: 0.5,
    }
  },
  beforeCreate: function () {
    that = this
    noSleep = new NoSleep()
    Howler.html5PoolSize = 10
    // Howler.autoSuspend = false
  },
  mounted() {
    // Add listeners for better UX
    window.addEventListener('resize', this.handleResize)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('keydown', this.handleKeydown)
  },
  destroyed() {
    this.cleaningAll()
    noSleep.disable()
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('keydown', this.handleKeydown)
    try { noSleep.disable() } catch (e) {}
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
        this.currentItemsIndex = 0
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
      let grammarTxt = readFile('grammar/txt/' + command + '.txt')
      this.currentGrammarSrt = readFile('grammar/mp3/' + command + '.srt')
      this.currentGrammarSrt.split('\n').forEach(line => {
        if (isNotEmptyStr(line)) {
          this.currentGrammarRemainingSrt.push(line)
        }
      })
      grammarTxt = removeBlankLines(grammarTxt)
      let grammarTxtLines = grammarTxt.split('\n')
      for (let i = 0; i < grammarTxtLines.length; i += PER_SHOW_LINES_SIZE) {
        let item = ''
        for (let j = 0; j < PER_SHOW_LINES_SIZE; j++) {
          if (i + j < grammarTxtLines.length) {
            item += grammarTxtLines[i + j] + '\n'
          }
        }
        if (item !== '') {
          this.currentGrammarItems.push(item)
        }
      }
      this.loading = false
    },
    nextItem: function () {
      if (this.currentItemsIndex >= this.currentGrammarItems.length - 1) {
        msgUtil.msgSuccess(this, '已经到底部啦')
        return
      }
      this.currentItemsIndex++
    },
    prevItem: function () {
      if (this.currentItemsIndex <= 0) {
        msgUtil.msgSuccess(this, '已经到顶部啦')
        return
      }
      this.currentItemsIndex--
    },
    increaseStopDuration() {
      if (this.thisStopStartTime) {
        this.thisStopDuration += new Date().getTime() - this.thisStopStartTime.getTime()
        console.log('that.thisStopDuration = ' + that.thisStopDuration)
      }
    },
    handleResize() {
      this.innerHeightPx = Math.round(window.innerHeight * 0.7) + 'px'
    },
    handleVisibilityChange() {
      if (document.hidden && this.isPlaying) {
        this.stopPlay()
      }
    },
    handleKeydown(e) {
      if (!this.currentGrammar) return
      // Space toggles play/pause
      if (e.code === 'Space') {
        e.preventDefault()
        if (this.isPlaying) {
          this.stopPlay()
        } else {
          this.resumePlay()
        }
      }
      // Up/Down navigate when unlocked
      if (this.canAdjustCurrentItem) {
        if (e.code === 'ArrowUp') { e.preventDefault(); this.prevItem() }
        if (e.code === 'ArrowDown') { e.preventDefault(); this.nextItem() }
      }
    },
    // Prevent duplicate SRT processing; selectGrammar prepares remainingSrt once
    prepareCurrentGrammarItemsShowTime() {
      if (this.currentGrammarItemPlayDuration && this.currentGrammarItemPlayDuration.length) {
        return
      }
      if (!this.currentGrammarRemainingSrt || this.currentGrammarRemainingSrt.length < 1) {
        // Fallback populate if not initialized (should usually be done in selectGrammar)
        this.currentGrammarSrt.split('\n').forEach(line => {
          if (isNotEmptyStr(line)) {
            this.currentGrammarRemainingSrt.push(line)
          }
        })
      }

      for (let i = 1; i < this.currentGrammarItems.length; i++) {
        let currentGrammarItem = this.currentGrammarItems[i]
        console.log('currentGrammarItem: ' + i)
        console.log(currentGrammarItem)
        let isFoundPlayEndTimeInSrt = false
        let searchKey = ''
        for (let j = 1; j < currentGrammarItem.length; j++) {
          searchKey = buildSearchKey(searchKey, currentGrammarItem, j)
          console.log(`searchKey: '${searchKey}'`)
          if (isEmptyStr(searchKey)) {
            console.warn('searchKey is empty')
            continue
          }
          let searchResultCount = getStrCount(this.currentGrammarSrt, searchKey)
          if (searchResultCount < 1) {
            searchKey = changeSearchKey(searchKey, false)
            if (isEmptyStr(searchKey)) {
              continue
            } else {
              console.log('searchKey cannot be indexed, attempt to change search key: ' + searchKey)
            }
            searchResultCount = getStrCount(this.currentGrammarSrt, searchKey)
            if (searchResultCount < 1) {
              while (searchKey.indexOf(' ') > -1 && searchResultCount < 1) {
                console.log(`searchKey cannot be indexed, after change search key(${searchKey}), attempt to strip head of search key!`)
                searchKey = changeSearchKey(searchKey, true)
                searchResultCount = getStrCount(this.currentGrammarSrt, searchKey)
                console.log(`after strip head of search key(${searchKey}), searchResultCount is ${searchResultCount}`)
              }
              if (searchResultCount < 1) {
                console.warn('searchKey cannot be indexed, after change search key: ' + searchKey)
                continue
              }
            }
          }
          if (searchResultCount > 1) {
            console.log('searchKey can be indexed, count is ' + searchResultCount)
            continue
          }
          console.log(`searchResultCount is ${searchResultCount} for searchKey['${searchKey}']`)
          for (let k = 0; k < this.currentGrammarRemainingSrt.length; k++) {
            if (this.currentGrammarRemainingSrt[k].indexOf(searchKey) > -1) {
              console.log('this.currentGrammarRemainingSrt[k] = ' + this.currentGrammarRemainingSrt[k])
              console.log('this.currentGrammarRemainingSrt[k - 1] = ' + this.currentGrammarRemainingSrt[k - 1])
              isFoundPlayEndTimeInSrt = true
              let prevItemPlayEndTimeLine = this.currentGrammarRemainingSrt[k - 1]
              let prevSectionPlayEndTime = secToMicroTime(prevItemPlayEndTimeLine.toString().split('-->')[0].trim())
              this.currentGrammarItemPlayDuration.push(prevSectionPlayEndTime)
              this.currentGrammarRemainingSrt = this.currentGrammarRemainingSrt.slice(k - 1, this.currentGrammarRemainingSrt.length)
              break
            }
          }
          if (!isFoundPlayEndTimeInSrt) {
            msgUtil.msgError(this, '字幕自动滚动失败！')
            console.error(`Cannot found the start play time! search key: \n ${searchKey}`)
            throw new Error('Cannot found the start play time!')
          } else {
            console.log('searchKey search success!')
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

        // console.log('this.thisStopDuration ' + this.thisStopDuration)
        let future = new Date().getTime() - this.thisStopDuration
        let currentGrammarPlayedDuration = future - this.currentGrammarStartPlayTime
        // console.log(`currentGrammarPlayedDuration: ${currentGrammarPlayedDuration}`)
        // console.log(`this.currentGrammarPlayDuration: ${this.currentGrammarPlayDuration}`)
        this.currentGrammarPlayPercentage = toFixedNum(Math.min(currentGrammarPlayedDuration * 100 / this.currentGrammarPlayDuration, 100), 2)

        if (this.currentItemsIndex < this.currentGrammarItems.length - 1) {
          // console.log(`currentItemPlayDuration: ${this.currentGrammarItemPlayDuration[this.currentItemsIndex]}`)
          if (currentGrammarPlayedDuration - this.currentGrammarItemPlayDuration[this.currentItemsIndex] > 0) {
            this.nextItem()
          }
        }
      }, 200)
    },
    startPlay() {
      this.loading = true
      if (this.isEnd) {
        this.isEnd = false
        this.selectGrammar(this.currentGrammar)
        // removed: this.$refs.grammarPlane.setActiveItem(0)
      }
      if (!this.currentGrammarHowl) {
        this.currentGrammarHowl = new Howl({
              src: ['grammar/mp3/' + this.currentGrammar + '.mp3'],
              autoplay: false,
              loop: false,
              volume: this.volume,
              html5: true,
              format: ['mp3'],
              onplay: async function () {
                that.currentGrammarPlayDuration = this._duration * 1000
                try {
                  that.cleaning(false, true, false, true)
                  that.prepareCurrentGrammarItemsShowTime()
                  that.increaseStopDuration()
                  that.setupCountdownFun()
                } catch (e) {
                  console.error(e)
                } finally {
                  that.isPlaying = true
                  that.thisStopStartTime = null
                  that.loading = false
                  if (that.currentGrammarStartPlayTime === null) {
                    that.currentGrammarStartPlayTime = new Date().getTime()
                  }
                }
              },
              onend: function () {
                that.isPlaying = false
                that.isEnd = true
                that.currentGrammarPlayPercentage = 100
                that.cleaning(true, true, false, true)
                try { noSleep.disable() } catch (e) {}
              }
              ,
              onpause: function () {
                that.isPlaying = false
                that.cleaning(false, true, false, true)
                try { noSleep.disable() } catch (e) {}
              }
            }
        )
      }

      this.currentGrammarHowl.play()
      noSleep.enable()
      try { this.currentGrammarHowl.rate(this.playbackRate) } catch (e) {}
    },
    stopPlay() {
      if (this.countdownFun) {
        clearInterval(this.countdownFun)
      }
      if (this.currentGrammarHowl) {
        this.currentGrammarHowl.pause()
      }
      this.isPlaying = false
      this.isStopped = true
      this.thisStopStartTime = new Date()
      try { noSleep.disable() } catch (e) {}
    },
    rePlay() {
      this.stopPlay()
      this.isEnd = true
      this.startPlay()
    },
    resumePlay() {
      this.currentGrammarHowl.play()
      noSleep.enable()
      try {
        that.cleaning(false, false, false, true)

        that.prepareCurrentGrammarItemsShowTime()

        that.increaseStopDuration()

        that.setupCountdownFun()
      } catch (e) {
        console.error(e)
      } finally {
        that.isPlaying = true
        that.thisStopStartTime = null
        that.loading = false
        this.isStopped = false
        if (that.currentGrammarStartPlayTime === null) {
          that.currentGrammarStartPlayTime = new Date().getTime()
        }
      }
    },
    showPrevItemAgain(index) {
      if (index > 0) {
        return this.currentGrammarItems[index - 1]
      }
      return '=====来自张满胜老师的《语法新思维》，侵删====='
    },
    showNextItemInAdvance(index) {
      if (index < this.currentGrammarItems.length) {
        return this.currentGrammarItems[index + 1]
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
    changeRate() {
      if (this.currentGrammarHowl) {
        try { this.currentGrammarHowl.rate(this.playbackRate) } catch (e) {}
      }
    },
    changeVolume() {
      if (this.currentGrammarHowl) {
        try { this.currentGrammarHowl.volume(this.volume) } catch (e) {}
      }
    },
  }
}
</script>

<template>
  <div class="grammar-container">
    <!-- Top control bar with native select and controls -->
    <div class="control-bar">
      <select class="grammar-select" :disabled="loading" v-model="currentGrammar" @change="selectGrammar(currentGrammar)">
        <option disabled value="">{{ currentGrammar ? (currentGrammarHint && currentGrammarHint[1]) || currentGrammar : '请选择当前的语法篇章' }}</option>
        <option v-for="(value, key) in GRAMMAR_EN_TO_CH_HINT" :key="key" :value="value[0]">
          {{ value[1] }}
        </option>
      </select>
      <select class="rate-select" :disabled="loading || !currentGrammar" v-model.number="playbackRate" @change="changeRate" title="播放速度">
        <option :value="0.75">0.75x</option>
        <option :value="1">1.0x</option>
        <option :value="1.25">1.25x</option>
        <option :value="1.5">1.5x</option>
        <option :value="2">2.0x</option>
      </select>
      <label class="volume-control" :title="'音量: ' + Math.round(volume*100) + '%'">
        <input type="range" min="0" max="1" step="0.05" v-model.number="volume" @input="changeVolume" :disabled="loading || !currentGrammar" />
      </label>
    </div>

    <!-- Progress bar -->
    <div v-if="currentGrammar" class="progress-container">
      <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="currentGrammarPlayPercentage">
        <div class="progress-fill" :style="{ width: currentGrammarPlayPercentage + '%' }"></div>
        <div class="progress-text">{{ currentGrammarPlayPercentage }}%</div>
      </div>
    </div>

    <!-- Text content panel -->
    <div v-if="currentGrammar" class="content-panel" :style="{height: innerHeightPx}">
      <p class="prev-text">{{ showPrevItemAgain(currentItemsIndex) }}</p>
      <p class="current-text">{{ currentGrammarItems[currentItemsIndex] }}</p>
      <p class="next-text">{{ showNextItemInAdvance(currentItemsIndex) }}</p>
    </div>

    <!-- Floating controls -->
    <div class="floating-controls">
      <button class="ctrl-btn primary" :disabled="loading || isPlaying || !currentGrammar" v-if="!isPlaying && !isStopped && currentGrammar" @click="startPlay">播放</button>
      <button class="ctrl-btn warning" :disabled="loading || !currentGrammar" v-if="isPlaying && currentGrammar" @click="stopPlay">暂停</button>
      <button class="ctrl-btn info" :disabled="loading || !currentGrammar" v-if="currentGrammar && isStopped" @click="rePlay">重放</button>
      <button class="ctrl-btn primary" :disabled="loading || !currentGrammar" v-if="!isPlaying && currentGrammar && isStopped" @click="resumePlay">继续</button>
      <button class="ctrl-btn secondary" :disabled="loading || !currentGrammar" v-if="currentGrammar" @click="adjustCurrentItem">{{ canAdjustCurrentItem ? '解锁滚动' : '锁定滚动' }}</button>
      <button class="ctrl-btn secondary" :disabled="loading || !currentGrammar || !canAdjustCurrentItem" v-if="currentGrammar && canAdjustCurrentItem" @click="prevItem">上一段</button>
      <button class="ctrl-btn secondary" :disabled="loading || !currentGrammar || !canAdjustCurrentItem" v-if="currentGrammar && canAdjustCurrentItem" @click="nextItem">下一段</button>
    </div>

    <!-- Loading overlay -->
    <div class="loading-overlay" v-if="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
/* Container */
.grammar-container {
  position: relative;
  padding-top: 80px; /* space for control bar */
}

/* Control bar */
.control-bar {
  position: fixed;
  top: 60px;
  left: 35px;
  z-index: 99;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--gradient-primary);
  box-shadow: var(--shadow-card);
}

.grammar-select, .rate-select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
}

.grammar-select:disabled, .rate-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Progress bar */
.progress-container {
  margin: 10px 20px;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--text-primary);
  line-height: 20px;
  mix-blend-mode: difference;
}

/* Content panel */
.content-panel {
  margin: 10px 20px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-container);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.prev-text, .next-text {
  white-space: pre-line;
  text-align: left;
  font-size: 13px;
  color: var(--text-regular);
  margin: 0 0 8px;
}

.current-text {
  white-space: pre-line;
  text-align: left;
  font-size: 15px;
  color: var(--text-primary);
  margin: 0 0 8px;
}

/* Floating controls */
.floating-controls {
  position: fixed;
  bottom: 15px;
  right: 15px;
  z-index: 2147483646;
  text-align: right;
  line-height: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ctrl-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #fff;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.ctrl-btn:hover { transform: translateY(-1px); filter: brightness(0.95); box-shadow: var(--shadow-hover); }
.ctrl-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.ctrl-btn.primary { background: var(--gradient-primary); }
.ctrl-btn.info { background: var(--gradient-info); }
.ctrl-btn.warning { background: var(--gradient-danger); }
.ctrl-btn.secondary { background: var(--bg-body); color: var(--text-primary); border: 1px solid var(--border-color); }

/* Volume control */
.volume-control {
  display: inline-block;
  position: relative;
  width: 120px;
  height: 24px;
}

.volume-control input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-primary);
  cursor: pointer;
}

.volume-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--color-primary);
  cursor: pointer;
}

.volume-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--color-primary);
  cursor: pointer;
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .control-bar { top: 56px; left: 12px; padding: 6px 10px; }
  .progress-container { margin: 8px 12px; }
  .content-panel { margin: 8px 12px; padding: 12px; }
  .current-text { font-size: 14px; }
  .rate-select { font-size: 13px; padding: 4px 8px; }
  .volume-control input[type="range"] { width: 90px; }
}
</style>