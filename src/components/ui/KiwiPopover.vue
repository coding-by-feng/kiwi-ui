<template>
  <div class="kiwi-popover-wrapper" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @click="handleClick">
    <div class="kiwi-popover-reference" ref="reference">
      <slot name="reference"></slot>
    </div>
    <transition name="fade">
      <div
        v-show="showPopper"
        class="kiwi-popover"
        :class="[placement, popperClass]"
        ref="popper"
        :style="{ width: width + 'px' }"
      >
        <div class="kiwi-popover__title" v-if="title">{{ title }}</div>
        <div class="kiwi-popover__content">
          <slot>{{ content }}</slot>
        </div>
        <div class="popper__arrow"></div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'KiwiPopover',
  props: {
    trigger: {
      type: String,
      default: 'click',
      validator: value => ['click', 'focus', 'hover', 'manual'].indexOf(value) > -1
    },
    title: String,
    content: String,
    width: {
      type: [String, Number],
      default: 150
    },
    placement: {
      type: String,
      default: 'bottom'
    },
    popperClass: String,
    visible: Boolean
  },
  data() {
    return {
      showPopper: false
    }
  },
  watch: {
    visible(val) {
      if (this.trigger === 'manual') {
        this.showPopper = val
      }
    }
  },
  methods: {
    handleMouseEnter() {
      if (this.trigger === 'hover') {
        this.showPopper = true
      }
    },
    handleMouseLeave() {
      if (this.trigger === 'hover') {
        this.showPopper = false
      }
    },
    handleClick() {
      if (this.trigger === 'click') {
        this.showPopper = !this.showPopper
      }
    },
    doClose() {
      this.showPopper = false
    }
  },
  mounted() {
    if (this.trigger === 'click') {
      document.addEventListener('click', (e) => {
        if (!this.$el.contains(e.target)) {
          this.showPopper = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-popover-wrapper {
  position: relative;
  display: inline-block;
}

.kiwi-popover {
  position: absolute;
  background: var(--bg-card);
  min-width: 150px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color-light);
  padding: 16px;
  z-index: 2000;
  color: var(--text-regular);
  line-height: 1.6;
  text-align: left;
  font-size: 14px;
  box-shadow: var(--shadow-lg),
              0 0 30px rgba(var(--color-primary-rgb), 0.08);
  word-break: break-word;
  backdrop-filter: blur(10px);

  // Gradient accent line
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 2px;
    background: var(--gradient-primary);
    border-radius: var(--radius-full);
  }

  &__title {
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.4;
    margin-bottom: 10px;
    font-weight: 600;
    padding-top: 4px;
  }

  &__content {
    color: var(--text-secondary);
  }

  &.bottom {
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);

    .popper__arrow {
      top: -6px;
      left: 50%;
      margin-left: -6px;
      border-bottom-color: var(--border-color-light);

      &::after {
        top: 1px;
        margin-left: -5px;
        border-bottom-color: var(--bg-card);
      }
    }
  }

  &.top {
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);

    &::before {
      top: auto;
      bottom: 0;
    }

    .popper__arrow {
      bottom: -6px;
      left: 50%;
      margin-left: -6px;
      border-top-color: var(--border-color-light);

      &::after {
        bottom: 1px;
        margin-left: -5px;
        border-top-color: var(--bg-card);
      }
    }
  }

  &.left {
    right: calc(100% + 12px);
    top: 50%;
    transform: translateY(-50%);

    &::before {
      left: 0;
      right: auto;
      top: 16px;
      bottom: 16px;
      width: 2px;
      height: auto;
    }
  }

  &.right {
    left: calc(100% + 12px);
    top: 50%;
    transform: translateY(-50%);

    &::before {
      right: 0;
      left: auto;
      top: 16px;
      bottom: 16px;
      width: 2px;
      height: auto;
    }
  }
}

.popper__arrow {
  position: absolute;
  display: block;
  width: 0;
  height: 0;
  border-color: transparent;
  border-style: solid;
  border-width: 6px;
  filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.03));

  &::after {
    content: " ";
    position: absolute;
    display: block;
    width: 0;
    height: 0;
    border-color: transparent;
    border-style: solid;
    border-width: 5px;
  }
}

// Enhanced animation
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px) scale(0.95);
}
</style>
