<template>
  <transition name="fade">
    <div v-if="visible && hasContent" class="status-overlay" :class="[positionClass, { 'with-backdrop': backdrop }]">
      <div class="status-content">
        <div v-if="status === 'loading'" class="status-icon loading">
          <i class="el-icon-loading"></i>
        </div>
        <div v-if="title" class="status-title" :class="statusColorClass">{{ title }}</div>
        <div v-if="message" class="status-message" :class="statusColorClass">{{ message }}</div>
        <div v-if="closable" class="status-close" @click="handleClose">
          <i class="el-icon-close"></i>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'StatusOverlay',
  props: {
    visible: {
      type: Boolean,
      default: false,
      required: false
    },
    status: {
      type: String,
      default: 'loading',
      validator: (val) => ['loading', 'success', 'error'].includes(val)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    backdrop: {
      type: Boolean,
      default: false
    },
    closable: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 2000  // Auto-close after 2 seconds by default
    },
    position: {
      type: String,
      default: 'absolute',
      validator: (val) => ['fixed', 'absolute', 'top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(val)
    }
  },
  computed: {
    positionClass() {
      return `position-${this.position}`
    },
    hasContent() {
      // By default, show nothing - only display when explicit title or message is provided
      const hasTitle = typeof this.title === 'string' && this.title.trim().length > 0
      const hasMessage = typeof this.message === 'string' && this.message.trim().length > 0
      return hasTitle || hasMessage
    },
    statusColorClass() {
      // Return color class based on status (success=green, error=red)
      if (this.status === 'success') return 'text-success'
      if (this.status === 'error') return 'text-error'
      return ''
    }
  },
  data() {
    return {
      autoCloseTimer: null
    }
  },
  watch: {
    visible(val) {
      // Clear any existing timer
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer)
        this.autoCloseTimer = null
      }

      if (val && this.duration > 0) {
        this.autoCloseTimer = setTimeout(() => {
          this.clearAndClose()
        }, this.duration)
      }
    }
  },
  beforeDestroy() {
    // Clean up timer on destroy
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }
  },
  methods: {
    handleClose() {
      this.clearAndClose()
    },
    clearAndClose() {
      // Clear timer
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer)
        this.autoCloseTimer = null
      }
      // Emit events to close and clean up
      this.$emit('update:visible', false)
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.status-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;

  &.with-backdrop {
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }

  // Default: fixed fullscreen centered
  &.position-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  // Absolute: relative to parent container, centered
  &.position-absolute {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  // Corner positions (absolute)
  &.position-top-right {
    position: absolute;
    top: 16px;
    right: 16px;
    left: auto;
    bottom: auto;
    align-items: flex-start;
    justify-content: flex-end;
  }

  &.position-top-left {
    position: absolute;
    top: 16px;
    left: 16px;
    right: auto;
    bottom: auto;
    align-items: flex-start;
    justify-content: flex-start;
  }

  &.position-bottom-right {
    position: absolute;
    bottom: 16px;
    right: 16px;
    top: auto;
    left: auto;
    align-items: flex-end;
    justify-content: flex-end;
  }

  &.position-bottom-left {
    position: absolute;
    bottom: 16px;
    left: 16px;
    top: auto;
    right: auto;
    align-items: flex-end;
    justify-content: flex-start;
  }
}

.status-content {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  position: relative;
  min-width: 120px;
  pointer-events: auto;
}

.status-icon {
  font-size: 40px;
  margin-bottom: 12px;

  &.loading {
    color: var(--color-primary, #409eff);
    i {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #303133);
  margin-bottom: 8px;

  &.text-success {
    color: #67c23a;
  }

  &.text-error {
    color: #f56c6c;
  }
}

.status-message {
  font-size: 14px;
  color: var(--text-secondary, #606266);

  &.text-success {
    color: #67c23a;
  }

  &.text-error {
    color: #f56c6c;
  }
}

.status-close {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-secondary, #909399);
  transition: color 0.2s;

  &:hover {
    color: var(--text-primary, #303133);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
