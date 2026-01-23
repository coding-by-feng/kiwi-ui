<template>
  <div class="focus-panel">
    <!-- Timer Display -->
    <div class="timer-container">
      <div class="tree-visual" :class="{ growing: isRunning, paused: isPaused, completed: isCompleted }">
        <!-- Circular Progress Ring -->
        <svg class="progress-ring" viewBox="0 0 200 200">
          <circle
            class="progress-ring-bg"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke-width="8"
          />
          <circle
            class="progress-ring-fill"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke-width="8"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
            stroke-linecap="round"
          />
        </svg>

        <!-- Tree Icon in Center -->
        <div class="tree-icon-wrapper">
          <div class="tree-icon" :class="treeStage">
            <svg v-if="treeStage === 'seed'" viewBox="0 0 64 64" class="tree-svg">
              <ellipse cx="32" cy="48" rx="12" ry="6" fill="currentColor" opacity="0.3"/>
              <circle cx="32" cy="40" r="8" fill="currentColor"/>
            </svg>
            <svg v-else-if="treeStage === 'sprout'" viewBox="0 0 64 64" class="tree-svg">
              <ellipse cx="32" cy="56" rx="14" ry="6" fill="currentColor" opacity="0.3"/>
              <rect x="30" y="36" width="4" height="20" rx="2" fill="currentColor"/>
              <ellipse cx="32" cy="32" rx="10" ry="12" fill="currentColor"/>
            </svg>
            <svg v-else-if="treeStage === 'growing'" viewBox="0 0 64 64" class="tree-svg">
              <ellipse cx="32" cy="58" rx="16" ry="6" fill="currentColor" opacity="0.3"/>
              <rect x="29" y="32" width="6" height="26" rx="3" fill="currentColor" opacity="0.8"/>
              <ellipse cx="32" cy="26" rx="16" ry="18" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 64 64" class="tree-svg">
              <ellipse cx="32" cy="60" rx="18" ry="6" fill="currentColor" opacity="0.3"/>
              <rect x="28" y="28" width="8" height="32" rx="4" fill="currentColor" opacity="0.8"/>
              <ellipse cx="32" cy="22" rx="20" ry="22" fill="currentColor"/>
              <ellipse cx="22" cy="30" rx="8" ry="10" fill="currentColor"/>
              <ellipse cx="42" cy="30" rx="8" ry="10" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Timer Text -->
      <div class="timer-display">
        <span class="timer-text">{{ formattedTime }}</span>
        <span class="timer-label">{{ timerLabel }}</span>
      </div>
    </div>

    <!-- Duration Selector (only when not running) -->
    <div v-if="!isRunning && !isPaused" class="duration-selector">
      <div class="duration-options">
        <button
          v-for="option in durationOptions"
          :key="option.value"
          class="duration-btn"
          :class="{ active: selectedDuration === option.value }"
          @click="selectDuration(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="custom-duration">
        <input
          type="number"
          v-model.number="customMinutes"
          min="1"
          max="180"
          class="custom-input"
          :placeholder="$t('todo.focus.customMinutes')"
        />
        <span class="custom-unit">{{ $t('todo.focus.minutes') }}</span>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="control-buttons">
      <template v-if="!isRunning && !isPaused">
        <button class="control-btn start-btn" @click="startFocus">
          <i class="el-icon-video-play"></i>
          <span>{{ $t('todo.focus.startFocus') }}</span>
        </button>
      </template>

      <template v-else-if="isRunning">
        <button class="control-btn pause-btn" @click="pauseFocus">
          <i class="el-icon-video-pause"></i>
          <span>{{ $t('todo.focus.pause') }}</span>
        </button>
        <button class="control-btn stop-btn" @click="stopFocus">
          <i class="el-icon-switch-button"></i>
          <span>{{ $t('todo.focus.giveUp') }}</span>
        </button>
      </template>

      <template v-else-if="isPaused">
        <button class="control-btn resume-btn" @click="resumeFocus">
          <i class="el-icon-video-play"></i>
          <span>{{ $t('todo.focus.resume') }}</span>
        </button>
        <button class="control-btn stop-btn" @click="stopFocus">
          <i class="el-icon-switch-button"></i>
          <span>{{ $t('todo.focus.giveUp') }}</span>
        </button>
      </template>
    </div>

    <!-- Session Stats -->
    <div class="session-stats">
      <div class="stat-card">
        <div class="stat-icon trees-icon">
          <i class="el-icon-sunrise"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ todayTrees }}</span>
          <span class="stat-label">{{ $t('todo.focus.todayTrees') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon time-icon">
          <i class="el-icon-time"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ todayMinutes }}</span>
          <span class="stat-label">{{ $t('todo.focus.todayMinutes') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon streak-icon">
          <i class="el-icon-trophy"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ currentStreak }}</span>
          <span class="stat-label">{{ $t('todo.focus.streak') }}</span>
        </div>
      </div>
    </div>

    <!-- Completion Dialog -->
    <KiwiDialog
      :visible.sync="showCompletionDialog"
      width="400px"
      :title="$t('todo.focus.congratulations')"
      custom-class="completion-dialog"
    >
      <div class="completion-content">
        <div class="completion-tree">
          <svg viewBox="0 0 64 64" class="tree-svg full-tree">
            <ellipse cx="32" cy="60" rx="18" ry="6" fill="currentColor" opacity="0.3"/>
            <rect x="28" y="28" width="8" height="32" rx="4" fill="currentColor" opacity="0.8"/>
            <ellipse cx="32" cy="22" rx="20" ry="22" fill="currentColor"/>
            <ellipse cx="22" cy="30" rx="8" ry="10" fill="currentColor"/>
            <ellipse cx="42" cy="30" rx="8" ry="10" fill="currentColor"/>
          </svg>
        </div>
        <p class="completion-message">{{ $t('todo.focus.treeGrown') }}</p>
        <div class="completion-stats">
          <span class="completion-duration">{{ completedDuration }} {{ $t('todo.focus.minutes') }}</span>
        </div>
      </div>
      <template #footer>
        <KiwiButton type="primary" @click="closeCompletionDialog">
          {{ $t('common.done') }}
        </KiwiButton>
      </template>
    </KiwiDialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import KiwiDialog from '@/components/ui/KiwiDialog.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'

export default {
  name: 'FocusPanel',
  components: { KiwiDialog, KiwiButton },
  data() {
    return {
      // Timer state
      selectedDuration: 25, // minutes
      customMinutes: null,
      remainingSeconds: 0,
      totalSeconds: 0,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      timerInterval: null,

      // Session tracking (local state, will be synced with API)
      todayTrees: 0,
      todayMinutes: 0,
      currentStreak: 0,

      // UI state
      showCompletionDialog: false,
      completedDuration: 0,

      // Duration options
      durationOptions: [
        { label: '15', value: 15 },
        { label: '25', value: 25 },
        { label: '45', value: 45 },
        { label: '60', value: 60 }
      ]
    }
  },
  computed: {
    ...mapState('focus', {
      focusStats: state => state.stats,
      activeSessions: state => state.activeSessions
    }),

    circumference() {
      return 2 * Math.PI * 90 // radius = 90
    },

    progressOffset() {
      if (this.totalSeconds === 0) return this.circumference
      const progress = this.remainingSeconds / this.totalSeconds
      return this.circumference * progress
    },

    formattedTime() {
      const minutes = Math.floor(this.remainingSeconds / 60)
      const seconds = this.remainingSeconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },

    timerLabel() {
      if (this.isCompleted) return this.$t('todo.focus.completed')
      if (this.isPaused) return this.$t('todo.focus.paused')
      if (this.isRunning) return this.$t('todo.focus.focusing')
      return this.$t('todo.focus.ready')
    },

    treeStage() {
      if (!this.isRunning && !this.isPaused && !this.isCompleted) return 'seed'
      if (this.totalSeconds === 0) return 'seed'

      const progress = 1 - (this.remainingSeconds / this.totalSeconds)
      if (progress < 0.25) return 'seed'
      if (progress < 0.5) return 'sprout'
      if (progress < 0.75) return 'growing'
      return 'tree'
    },

    effectiveDuration() {
      return this.customMinutes && this.customMinutes > 0
        ? this.customMinutes
        : this.selectedDuration
    }
  },

  watch: {
    focusStats: {
      immediate: true,
      handler(stats) {
        if (stats) {
          this.todayTrees = stats.todayTrees || 0
          this.todayMinutes = stats.todayMinutes || 0
          this.currentStreak = stats.currentStreak || 0
        }
      }
    }
  },

  created() {
    this.loadFocusStats()
  },

  beforeDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  },

  methods: {
    ...mapActions('focus', ['fetchFocusStats', 'createFocusSession', 'completeFocusSession', 'cancelFocusSession']),

    async loadFocusStats() {
      try {
        await this.fetchFocusStats()
      } catch (e) {
        // Stats might not be available yet, use defaults
        console.warn('Focus stats not available:', e)
      }
    },

    selectDuration(minutes) {
      this.selectedDuration = minutes
      this.customMinutes = null
    },

    async startFocus() {
      const duration = this.effectiveDuration
      this.totalSeconds = duration * 60
      this.remainingSeconds = this.totalSeconds
      this.isRunning = true
      this.isPaused = false
      this.isCompleted = false

      // Start API session
      try {
        await this.createFocusSession({ duration })
      } catch (e) {
        console.warn('Failed to create focus session:', e)
      }

      this.startTimer()
    },

    pauseFocus() {
      this.isRunning = false
      this.isPaused = true
      this.stopTimer()
    },

    resumeFocus() {
      this.isRunning = true
      this.isPaused = false
      this.startTimer()
    },

    async stopFocus() {
      this.stopTimer()
      this.isRunning = false
      this.isPaused = false
      this.isCompleted = false
      this.remainingSeconds = 0
      this.totalSeconds = 0

      // Cancel API session
      try {
        await this.cancelFocusSession()
      } catch (e) {
        console.warn('Failed to cancel focus session:', e)
      }
    },

    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--
        } else {
          this.completeSession()
        }
      }, 1000)
    },

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    async completeSession() {
      this.stopTimer()
      this.isRunning = false
      this.isPaused = false
      this.isCompleted = true
      this.completedDuration = Math.round(this.totalSeconds / 60)

      // Complete API session
      try {
        await this.completeFocusSession()
        await this.loadFocusStats()
      } catch (e) {
        console.warn('Failed to complete focus session:', e)
      }

      // Update local stats optimistically
      this.todayTrees++
      this.todayMinutes += this.completedDuration

      this.showCompletionDialog = true
    },

    closeCompletionDialog() {
      this.showCompletionDialog = false
      this.isCompleted = false
      this.remainingSeconds = 0
      this.totalSeconds = 0
    }
  }
}
</script>

<style scoped>
.focus-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  min-height: 500px;
}

/* Timer Container */
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.tree-visual {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  stroke: var(--border-color-light);
}

.progress-ring-fill {
  stroke: var(--color-success);
  transition: stroke-dashoffset 0.5s ease;
}

.tree-visual.growing .progress-ring-fill {
  stroke: var(--color-success);
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
}

.tree-visual.paused .progress-ring-fill {
  stroke: var(--color-warning);
}

.tree-visual.completed .progress-ring-fill {
  stroke: var(--color-primary);
  filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.5));
}

/* Tree Icon */
.tree-icon-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
}

.tree-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
}

.tree-svg {
  width: 80px;
  height: 80px;
  color: var(--color-success);
  transition: all 0.3s ease;
}

.tree-icon.seed .tree-svg {
  color: var(--text-muted);
  opacity: 0.6;
}

.tree-icon.sprout .tree-svg {
  color: var(--color-success-light);
}

.tree-icon.growing .tree-svg {
  color: var(--color-success);
}

.tree-icon.tree .tree-svg {
  color: var(--color-success);
  filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));
}

.tree-visual.growing .tree-icon {
  animation: gentle-pulse 2s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Timer Display */
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
}

.timer-text {
  font-size: 48px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.timer-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Duration Selector */
.duration-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.duration-options {
  display: flex;
  gap: 12px;
}

.duration-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.duration-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
}

.duration-btn.active {
  background: var(--gradient-primary);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--shadow-hover);
}

.custom-duration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-input {
  width: 80px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 16px;
  text-align: center;
  padding: 0 12px;
  transition: all 0.3s ease;
}

.custom-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light-5);
}

.custom-input::placeholder {
  color: var(--text-placeholder);
}

.custom-unit {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Control Buttons */
.control-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius-lg);
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn i {
  font-size: 18px;
}

.start-btn {
  background: var(--gradient-success);
  color: #fff;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.pause-btn {
  background: var(--gradient-warning);
  color: #fff;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.pause-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.resume-btn {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.resume-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.stop-btn {
  background: var(--bg-card);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.stop-btn:hover {
  background: var(--color-danger);
  color: #fff;
  transform: translateY(-2px);
}

/* Session Stats */
.session-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.trees-icon {
  background: var(--color-success-light-9);
  color: var(--color-success);
}

.time-icon {
  background: var(--color-primary-light-9);
  color: var(--color-primary);
}

.streak-icon {
  background: var(--color-warning-light-9);
  color: var(--color-warning);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Completion Dialog */
.completion-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  text-align: center;
}

.completion-tree {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.completion-tree .tree-svg {
  width: 100%;
  height: 100%;
  color: var(--color-success);
  animation: tree-appear 0.6s ease-out;
}

@keyframes tree-appear {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.completion-message {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-weight: 600;
}

.completion-stats {
  display: flex;
  gap: 16px;
}

.completion-duration {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 8px 16px;
  background: var(--bg-container);
  border-radius: var(--radius-md);
}

/* Responsive */
@media (max-width: 768px) {
  .focus-panel {
    padding: 16px;
  }

  .tree-visual {
    width: 180px;
    height: 180px;
  }

  .tree-icon-wrapper {
    width: 100px;
    height: 100px;
  }

  .tree-svg {
    width: 64px;
    height: 64px;
  }

  .timer-text {
    font-size: 40px;
  }

  .duration-btn {
    width: 48px;
    height: 48px;
    font-size: 14px;
  }

  .control-btn {
    padding: 12px 20px;
    font-size: 14px;
  }

  .session-stats {
    gap: 12px;
  }

  .stat-card {
    padding: 12px 16px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .duration-options {
    gap: 8px;
  }

  .duration-btn {
    width: 44px;
    height: 44px;
    font-size: 13px;
  }

  .control-buttons {
    flex-direction: column;
    width: 100%;
    max-width: 200px;
  }

  .control-btn {
    width: 100%;
    justify-content: center;
  }

  .session-stats {
    width: 100%;
  }

  .stat-card {
    flex: 1;
    min-width: 100px;
  }
}

/* Color variable fallbacks for light theme compatibility */
:root {
  --color-success-light-9: rgba(16, 185, 129, 0.1);
  --color-primary-light-9: rgba(99, 102, 241, 0.1);
  --color-warning-light-9: rgba(245, 158, 11, 0.1);
}
</style>
