<template>
  <transition name="float-fade">
    <div
      v-if="timerState.isRunning || timerState.isPaused"
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
          <!-- Trunk -->
          <rect x="14" y="20" width="4" height="8" rx="1.5" fill="#8B6914" />
          <!-- Crown layers based on stage -->
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
      hasMoved: false
    }
  },

  computed: {
    ...mapGetters('focus', ['timerState']),

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

  mounted() {
    this.loadPosition()
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
      // Navigate to focus tab
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
