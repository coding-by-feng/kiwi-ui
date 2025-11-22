<template>
  <div class="kiwi-progress" :class="[`kiwi-progress--${type}`, status ? `is-${status}` : '']">
    <div class="kiwi-progress-bar" v-if="type === 'line'">
      <div class="kiwi-progress-bar__outer" :style="{height: strokeWidth + 'px'}">
        <div class="kiwi-progress-bar__inner" :style="barStyle">
          <div class="kiwi-progress-bar__innerText" v-if="showText && textInside">{{content}}</div>
        </div>
      </div>
    </div>
    <div class="kiwi-progress__text" v-if="showText && !textInside" :style="{fontSize: progressTextSize + 'px'}">
      <template v-if="!status">{{content}}</template>
      <i v-else :class="iconClass"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KiwiProgress',
  props: {
    type: {
      type: String,
      default: 'line',
      validator: val => ['line', 'circle', 'dashboard'].indexOf(val) > -1
    },
    percentage: {
      type: Number,
      default: 0,
      required: true,
      validator: val => val >= 0 && val <= 100
    },
    status: {
      type: String,
      validator: val => ['success', 'exception', 'warning'].indexOf(val) > -1
    },
    strokeWidth: {
      type: Number,
      default: 6
    },
    textInside: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 126
    },
    showText: {
      type: Boolean,
      default: true
    },
    color: {
      type: [String, Array, Function],
      default: ''
    },
    format: Function
  },
  computed: {
    barStyle() {
      const style = {}
      style.width = this.percentage + '%'
      style.backgroundColor = this.getCurrentColor(this.percentage)
      return style
    },
    content() {
      if (typeof this.format === 'function') {
        return this.format(this.percentage) || ''
      } else {
        return `${this.percentage}%`
      }
    },
    iconClass() {
      if (this.status === 'warning') {
        return 'el-icon-warning'
      }
      if (this.type === 'line') {
        return this.status === 'success' ? 'el-icon-circle-check' : 'el-icon-circle-close'
      } else {
        return this.status === 'success' ? 'el-icon-check' : 'el-icon-close'
      }
    },
    progressTextSize() {
      return this.type === 'line'
        ? 12 + this.strokeWidth * 0.4
        : this.width * 0.111111 + 2
    }
  },
  methods: {
    getCurrentColor(percentage) {
      if (typeof this.color === 'function') {
        return this.color(percentage)
      } else if (typeof this.color === 'string') {
        return this.color
      } else {
        return this.getLevelColor(percentage)
      }
    },
    getLevelColor(percentage) {
      const colorArray = this.getColorArray().sort((a, b) => a.percentage - b.percentage)
      for (let i = 0; i < colorArray.length; i++) {
        if (colorArray[i].percentage > percentage) {
          return colorArray[i].color
        }
      }
      return colorArray[colorArray.length - 1].color
    },
    getColorArray() {
      const color = this.color
      const span = 100 / color.length
      return color.map((seriesColor, index) => {
        if (typeof seriesColor === 'string') {
          return {
            color: seriesColor,
            percentage: (index + 1) * span
          }
        }
        return seriesColor
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-progress {
  position: relative;
  line-height: 1;

  &__text {
    font-size: 14px;
    color: var(--text-regular);
    display: inline-block;
    vertical-align: middle;
    margin-left: 10px;
    line-height: 1;

    i {
      vertical-align: middle;
      display: inline-block;
    }
  }

  &--line {
    margin-bottom: 15px;
  }

  &--circle, &--dashboard {
    display: inline-block;
  }
}

.kiwi-progress-bar {
  padding-right: 50px;
  display: inline-block;
  vertical-align: middle;
  width: 100%;
  margin-right: -55px;
  box-sizing: border-box;

  &__outer {
    height: 6px;
    border-radius: 100px;
    background-color: var(--border-color-light);
    overflow: hidden;
    position: relative;
    vertical-align: middle;
  }

  &__inner {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: var(--color-primary);
    text-align: right;
    border-radius: 100px;
    line-height: 1;
    white-space: nowrap;
    transition: width 0.6s ease;
  }

  &__innerText {
    display: inline-block;
    vertical-align: middle;
    color: #fff;
    font-size: 12px;
    margin: 0 5px;
  }
}
</style>
