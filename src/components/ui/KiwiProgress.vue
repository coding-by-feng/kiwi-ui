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
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    display: inline-block;
    vertical-align: middle;
    margin-left: 12px;
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

  // Status colors
  &.is-success {
    .kiwi-progress-bar__inner {
      background: var(--gradient-success);
      box-shadow: 0 0 10px rgba(var(--color-success-rgb), 0.5);
    }
    .kiwi-progress__text {
      color: var(--color-success);
    }
  }

  &.is-warning {
    .kiwi-progress-bar__inner {
      background: var(--gradient-warning);
      box-shadow: 0 0 10px rgba(var(--color-warning-rgb), 0.5);
    }
    .kiwi-progress__text {
      color: var(--color-warning);
    }
  }

  &.is-exception {
    .kiwi-progress-bar__inner {
      background: var(--gradient-danger);
      box-shadow: 0 0 10px rgba(var(--color-danger-rgb), 0.5);
    }
    .kiwi-progress__text {
      color: var(--color-danger);
    }
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
    height: 8px;
    border-radius: var(--radius-full);
    background-color: var(--bg-container);
    overflow: hidden;
    position: relative;
    vertical-align: middle;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &__inner {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--gradient-primary);
    text-align: right;
    border-radius: var(--radius-full);
    line-height: 1;
    white-space: nowrap;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.4);

    // Animated shimmer effect
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: progress-shimmer 2s infinite;
    }
  }

  &__innerText {
    display: inline-block;
    vertical-align: middle;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    margin: 0 8px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

@keyframes progress-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
