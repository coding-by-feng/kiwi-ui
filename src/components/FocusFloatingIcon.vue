<template>
  <transition name="float-fade">
    <div
      v-if="isVisible"
      class="focus-floating-icon"
      :class="{ paused: timerState.isPaused, dragging: isDragging }"
      :style="floatStyle"
      @mousedown="startDrag"
      @touchstart.passive="startDrag"
      @click="handleClick"
    >
      <!-- Progress Ring -->
      <svg class="float-progress-ring" viewBox="0 0 60 60">
        <circle
          class="ring-bg"
          cx="30" cy="30" r="26"
          fill="none" stroke-width="3"
        />
        <circle
          class="ring-fill"
          cx="30" cy="30" r="26"
          fill="none" stroke-width="3"
          :stroke="timerState.treeColor"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
          stroke-linecap="round"
        />
      </svg>

      <!-- Tree Icon -->
      <div class="float-tree-icon">
        <svg viewBox="0 0 32 32" width="28" height="28">
          <rect x="14" y="20" width="4" height="8" rx="1.5" fill="#8B6914" />
          <template v-if="timerState.treeStage === 'seed'">
            <circle cx="16" cy="18" r="6" :fill="timerState.treeColor" opacity="0.6" />
          </template>
          <template v-else-if="timerState.treeStage === 'sprout'">
            <ellipse cx="16" cy="16" rx="7" ry="9" :fill="timerState.treeColor" opacity="0.7" />
          </template>
          <template v-else-if="timerState.treeStage === 'growing'">
            <ellipse cx="16" cy="14" rx="9" ry="10" :fill="timerState.treeColor" opacity="0.8" />
            <ellipse cx="11" cy="17" rx="5" ry="6" :fill="timerState.treeColor" opacity="0.6" />
            <ellipse cx="21" cy="17" rx="5" ry="6" :fill="timerState.treeColor" opacity="0.6" />
          </template>
          <template v-else>
            <ellipse cx="16" cy="12" rx="11" ry="10" :fill="timerState.treeColor" />
            <ellipse cx="10" cy="16" rx="6" ry="7" :fill="timerState.treeColor" opacity="0.8" />
            <ellipse cx="22" cy="16" rx="6" ry="7" :fill="timerState.treeColor" opacity="0.8" />
            <ellipse cx="13" cy="9" rx="3" ry="4" fill="rgba(255,255,255,0.15)" />
          </template>
        </svg>
      </div>

      <!-- Time Remaining -->
      <div class="float-time">{{ formattedTime }}</div>

      <!-- Paused indicator -->
      <div v-if="timerState.isPaused" class="float-paused-badge">
        <i class="el-icon-video-pause"></i>
      </div>

      <!-- PiP pop-out button -->
      <div
        v-if="supportsPiP"
        class="float-pip-btn"
        @click.stop="openPiP"
        :title="$t('todo.focus.popOut')"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
          <path d="M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v4a.5.5 0 01-1 0v-4a.5.5 0 00-.5-.5h-9a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h4a.5.5 0 010 1h-4A1.5 1.5 0 012 12.5v-10z"/>
          <path d="M8 8.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-5z"/>
        </svg>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FocusFloatingIcon',

  data() {
    return {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      posX: 20,
      posY: window.innerHeight - 100,
      startPosX: 0,
      startPosY: 0,
      hasMoved: false,
      pipWindow: null,
      pipUpdateInterval: null
    }
  },

  computed: {
    ...mapGetters('focus', ['timerState']),

    isVisible() {
      return (this.timerState.isRunning || this.timerState.isPaused) && !this.pipWindow
    },

    supportsPiP() {
      return 'documentPictureInPicture' in window
    },

    circumference() {
      return 2 * Math.PI * 26
    },

    progressOffset() {
      if (this.timerState.totalSeconds === 0) return this.circumference
      const progress = this.timerState.remainingSeconds / this.timerState.totalSeconds
      return this.circumference * progress
    },

    formattedTime() {
      const minutes = Math.floor(this.timerState.remainingSeconds / 60)
      const seconds = this.timerState.remainingSeconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },

    floatStyle() {
      return {
        left: this.posX + 'px',
        top: this.posY + 'px'
      }
    }
  },

  watch: {
    'timerState.remainingSeconds'() {
      this.updatePiPContent()
    },
    'timerState.treeStage'() {
      this.updatePiPContent()
    },
    'timerState.isPaused'() {
      this.updatePiPContent()
    },
    'timerState.isRunning'(val) {
      if (!val && !this.timerState.isPaused) {
        this.closePiP()
      }
    }
  },

  mounted() {
    this.loadPosition()
  },

  beforeDestroy() {
    this.closePiP()
  },

  methods: {
    startDrag(e) {
      this.isDragging = true
      this.hasMoved = false
      const touch = e.touches ? e.touches[0] : e
      this.dragStartX = touch.clientX
      this.dragStartY = touch.clientY
      this.startPosX = this.posX
      this.startPosY = this.posY

      const onMove = (ev) => {
        const t = ev.touches ? ev.touches[0] : ev
        const dx = t.clientX - this.dragStartX
        const dy = t.clientY - this.dragStartY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          this.hasMoved = true
        }
        this.posX = Math.max(0, Math.min(window.innerWidth - 64, this.startPosX + dx))
        this.posY = Math.max(0, Math.min(window.innerHeight - 80, this.startPosY + dy))
      }

      const onEnd = () => {
        this.isDragging = false
        this.savePosition()
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onEnd)
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', onEnd)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onEnd)
      document.addEventListener('touchmove', onMove, { passive: true })
      document.addEventListener('touchend', onEnd)
    },

    handleClick() {
      if (this.hasMoved) return
      this.$router.replace({
        path: this.$route.path,
        query: { ...this.$route.query, active: 'focus' }
      }).catch(() => {})
    },

    savePosition() {
      try {
        localStorage.setItem('kiwi_focus_float_pos', JSON.stringify({ x: this.posX, y: this.posY }))
      } catch (_) {}
    },

    loadPosition() {
      try {
        const pos = JSON.parse(localStorage.getItem('kiwi_focus_float_pos'))
        if (pos) {
          this.posX = Math.min(pos.x, window.innerWidth - 64)
          this.posY = Math.min(pos.y, window.innerHeight - 80)
        }
      } catch (_) {}
    },

    // --- Picture-in-Picture ---
    async openPiP() {
      if (!this.supportsPiP) return
      if (this.pipWindow) {
        this.pipWindow.focus()
        return
      }

      try {
        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: 220,
          height: 280
        })

        this.pipWindow = pipWin

        // Inject styles
        const style = pipWin.document.createElement('style')
        style.textContent = this.getPiPStyles()
        pipWin.document.head.appendChild(style)

        // Set page title
        const title = pipWin.document.createElement('title')
        title.textContent = 'Focus Timer'
        pipWin.document.head.appendChild(title)

        // Build content
        const container = pipWin.document.createElement('div')
        container.id = 'pip-root'
        pipWin.document.body.appendChild(container)

        this.updatePiPContent()

        // Handle close
        pipWin.addEventListener('pagehide', () => {
          this.pipWindow = null
          if (this.pipUpdateInterval) {
            clearInterval(this.pipUpdateInterval)
            this.pipUpdateInterval = null
          }
        })
      } catch (e) {
        this.pipWindow = null
      }
    },

    closePiP() {
      if (this.pipWindow) {
        try { this.pipWindow.close() } catch (_) {}
        this.pipWindow = null
      }
      if (this.pipUpdateInterval) {
        clearInterval(this.pipUpdateInterval)
        this.pipUpdateInterval = null
      }
    },

    updatePiPContent() {
      if (!this.pipWindow) return
      const root = this.pipWindow.document.getElementById('pip-root')
      if (!root) return

      const state = this.timerState
      const minutes = Math.floor(state.remainingSeconds / 60)
      const seconds = state.remainingSeconds % 60
      const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      const progress = state.totalSeconds > 0 ? state.remainingSeconds / state.totalSeconds : 1
      const circumference = 2 * Math.PI * 70
      const offset = circumference * progress
      const color = state.treeColor || '#4CAF50'
      const stage = state.treeStage || 'seed'
      const paused = state.isPaused

      root.innerHTML = `
        <div class="pip-container${paused ? ' paused' : ''}">
          <div class="pip-tree-area">
            <svg class="pip-ring" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="5"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="${color}" stroke-width="5"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                stroke-linecap="round" style="transition:stroke-dashoffset 1s linear"/>
            </svg>
            <div class="pip-tree">
              ${this.getTreeSVG(stage, color)}
            </div>
          </div>
          <div class="pip-time">${time}</div>
          <div class="pip-status">${paused ? 'PAUSED' : 'FOCUSING'}</div>
        </div>
      `
    },

    getTreeSVG(stage, color) {
      const trunk = '<rect x="26" y="42" width="8" height="16" rx="3" fill="#8B6914"/>'
      if (stage === 'seed') {
        return `<svg viewBox="0 0 60 60" width="80" height="80">
          <circle cx="30" cy="36" r="10" fill="${color}" opacity="0.6"/>
        </svg>`
      }
      if (stage === 'sprout') {
        return `<svg viewBox="0 0 60 60" width="80" height="80">
          ${trunk}
          <ellipse cx="30" cy="30" rx="12" ry="16" fill="${color}" opacity="0.7"/>
        </svg>`
      }
      if (stage === 'growing') {
        return `<svg viewBox="0 0 60 60" width="80" height="80">
          ${trunk}
          <ellipse cx="30" cy="22" rx="16" ry="18" fill="${color}" opacity="0.8"/>
          <ellipse cx="20" cy="28" rx="8" ry="10" fill="${color}" opacity="0.6"/>
          <ellipse cx="40" cy="28" rx="8" ry="10" fill="${color}" opacity="0.6"/>
        </svg>`
      }
      // full tree
      return `<svg viewBox="0 0 60 60" width="80" height="80">
        ${trunk}
        <ellipse cx="30" cy="18" rx="20" ry="16" fill="${color}"/>
        <ellipse cx="20" cy="24" rx="10" ry="12" fill="${color}" opacity="0.8"/>
        <ellipse cx="40" cy="24" rx="10" ry="12" fill="${color}" opacity="0.8"/>
        <ellipse cx="26" cy="12" rx="5" ry="6" fill="rgba(255,255,255,0.12)"/>
      </svg>`
    },

    getPiPStyles() {
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0f0f23;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          user-select: none;
        }
        .pip-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .pip-container.paused { opacity: 0.7; }
        .pip-tree-area {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pip-ring {
          position: absolute;
          width: 160px;
          height: 160px;
          transform: rotate(-90deg);
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.15));
        }
        .pip-tree {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: breathe 3s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .pip-time {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 2px;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .pip-status {
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          opacity: 0.6;
        }
      `
    }
  }
}
</script>

<style scoped>
.focus-floating-icon {
  position: fixed;
  z-index: 9999;
  width: 60px;
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.focus-floating-icon:hover {
  transform: scale(1.08);
}

.focus-floating-icon.dragging {
  cursor: grabbing;
  transform: scale(1.12);
}

.focus-floating-icon.paused {
  opacity: 0.8;
}

/* Progress ring container */
.float-progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 60px;
  height: 60px;
  transform: rotate(-90deg);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.ring-bg {
  stroke: rgba(255, 255, 255, 0.15);
}

.ring-fill {
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 4px currentColor);
}

/* Tree icon centered in the ring */
.float-tree-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card, #1a1a2e);
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Timer text below the icon */
.float-time {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  background: var(--bg-card, #1a1a2e);
  padding: 1px 6px;
  border-radius: 8px;
  margin-top: -2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Paused badge */
.float-paused-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: var(--color-warning, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* PiP pop-out button */
.float-pip-btn {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 18px;
  height: 18px;
  background: var(--color-primary, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.focus-floating-icon:hover .float-pip-btn {
  opacity: 1;
}

.float-pip-btn:hover {
  transform: scale(1.2);
  background: var(--color-primary-dark, #4f46e5);
}

/* Transition */
.float-fade-enter-active,
.float-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.float-fade-enter,
.float-fade-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
</style>
