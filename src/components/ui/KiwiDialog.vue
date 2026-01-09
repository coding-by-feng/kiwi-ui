<template>
  <transition name="dialog-fade">
    <div class="kiwi-dialog__wrapper" v-show="visible" @click.self="handleWrapperClick">
      <div
        role="dialog"
        :aria-modal="true"
        :aria-label="title"
        class="kiwi-dialog"
        :class="[{ 'is-fullscreen': fullscreen, 'kiwi-dialog--center': center }, customClass]"
        ref="dialog"
        :style="style"
      >
        <div class="kiwi-dialog__header">
          <slot name="title">
            <span class="kiwi-dialog__title">{{ title }}</span>
          </slot>
          <button
            type="button"
            class="kiwi-dialog__headerbtn"
            aria-label="Close"
            v-if="showClose"
            @click="handleClose"
          >
            <i class="kiwi-dialog__close el-icon-close"></i>
          </button>
        </div>
        <div class="kiwi-dialog__body" v-if="rendered"><slot></slot></div>
        <div class="kiwi-dialog__footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'KiwiDialog',
  props: {
    title: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    },
    width: String,
    fullscreen: Boolean,
    top: {
      type: String,
      default: '15vh'
    },
    modal: {
      type: Boolean,
      default: true
    },
    modalAppendToBody: {
      type: Boolean,
      default: true
    },
    appendToBody: {
      type: Boolean,
      default: false
    },
    lockScroll: {
      type: Boolean,
      default: true
    },
    customClass: {
      type: String,
      default: ''
    },
    closeOnClickModal: {
      type: Boolean,
      default: true
    },
    closeOnPressEscape: {
      type: Boolean,
      default: true
    },
    showClose: {
      type: Boolean,
      default: true
    },
    center: Boolean,
    destroyOnClose: Boolean
  },
  data() {
    return {
      closed: false,
      key: 0
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.closed = false
        this.$emit('open')
        if (this.appendToBody) {
          document.body.appendChild(this.$el)
        }
      } else {
        if (!this.closed) this.$emit('close')
        if (this.destroyOnClose) {
          this.$nextTick(() => {
            this.key++
          })
        }
      }
    }
  },
  computed: {
    style() {
      let style = {}
      if (!this.fullscreen) {
        style.marginTop = this.top
        if (this.width) {
          style.width = this.width
        }
      }
      return style
    },
    rendered() {
      return !this.destroyOnClose || this.visible
    }
  },
  methods: {
    handleWrapperClick() {
      if (!this.closeOnClickModal) return
      this.handleClose()
    },
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
      this.closed = true
    }
  },
  destroyed() {
    if (this.appendToBody && this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-dialog__wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
  margin: 0;
  z-index: 2000;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.kiwi-dialog {
  position: relative;
  margin: 0 auto 50px;
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-lg),
              0 0 40px rgba(var(--color-primary-rgb), 0.1);
  box-sizing: border-box;
  width: 50%;
  border: 1px solid var(--border-color-light);
  overflow: hidden;

  // Gradient accent line at top
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--gradient-primary);
  }

  &.is-fullscreen {
    width: 100%;
    margin-top: 0;
    margin-bottom: 0;
    height: 100%;
    overflow: auto;
    border-radius: 0;
  }

  &__header {
    padding: 24px 24px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color-light);
  }

  &__title {
    line-height: 1.4;
    font-size: 18px;
    color: var(--text-primary);
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  &__headerbtn {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px;
    background: var(--bg-container);
    border: 1px solid var(--border-color-light);
    border-radius: var(--radius-md);
    outline: none;
    cursor: pointer;
    font-size: 14px;
    transition: var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--bg-highlight);
      border-color: var(--color-primary);
      transform: rotate(90deg);
    }

    .kiwi-dialog__close {
      color: var(--text-secondary);
      transition: var(--transition-fast);
    }

    &:hover .kiwi-dialog__close {
      color: var(--color-primary);
    }
  }

  &__body {
    padding: 24px;
    color: var(--text-regular);
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    max-height: 60vh;
    overflow-y: auto;

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--bg-container);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;

      &:hover {
        background: var(--color-primary);
      }
    }
  }

  &__footer {
    padding: 16px 24px 24px;
    text-align: right;
    box-sizing: border-box;
    border-top: 1px solid var(--border-color-light);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  &--center {
    text-align: center;

    .kiwi-dialog__header {
      justify-content: center;
    }

    .kiwi-dialog__footer {
      justify-content: center;
    }
  }
}

// Animation classes
.dialog-fade-enter-active {
  animation: dialog-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-fade-leave-active {
  animation: dialog-fade-out 0.25s ease-out;
}

@keyframes dialog-fade-in {
  0% {
    transform: translate3d(0, -30px, 0) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
}

@keyframes dialog-fade-out {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(0, -20px, 0) scale(0.95);
    opacity: 0;
  }
}
</style>
