<template>
  <div class="focus-view" :class="{ 'focus-active': isRunning || isPaused }">
    <div class="focus-layout">
      <!-- Left Panel: Timer & Controls -->
      <div class="timer-panel">
        <div class="timer-header">
          <h2 class="panel-title">
            <i class="el-icon-aim"></i>
            {{ $t('todo.focus.title') }}
          </h2>
        </div>

        <!-- Tree Type Selector -->
        <div v-if="!isRunning && !isPaused" class="tree-selector">
          <span class="selector-label">{{ $t('todo.focus.selectTree') }}</span>
          <div class="tree-options">
            <button
              v-for="tree in treeTypes"
              :key="tree.id"
              class="tree-option"
              :class="{ active: selectedTreeType === tree.id }"
              @click="selectTreeType(tree.id)"
            >
              <div class="tree-preview-wrapper">
                <Tree3D stage="tree" :type="tree.id" :color="tree.color" :size="48" />
              </div>
              <span class="tree-name">{{ tree.name }}</span>
            </button>
          </div>
        </div>

        <!-- Timer Display -->
        <div class="timer-container">
          <div class="tree-visual" :class="{ growing: isRunning, paused: isPaused, completed: isCompleted }">
            <svg class="progress-ring" viewBox="0 0 200 200">
              <defs>
                <linearGradient :id="'progress-gradient-' + selectedTreeType" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" :stop-color="currentTreeColor" />
                  <stop offset="100%" :stop-color="currentTreeColorDark" />
                </linearGradient>
              </defs>
              <circle class="progress-ring-bg" cx="100" cy="100" r="90" fill="none" stroke-width="8" />
              <circle
                class="progress-ring-fill"
                cx="100" cy="100" r="90"
                fill="none" stroke-width="8"
                :stroke="'url(#progress-gradient-' + selectedTreeType + ')'"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="progressOffset"
                stroke-linecap="round"
              />
            </svg>
            <div class="tree-icon-wrapper">
              <div class="tree-3d" :class="[treeStage, selectedTreeType]" :style="{ '--tree-color': currentTreeColor }">
                <Tree3D :stage="treeStage" :type="selectedTreeType" :color="currentTreeColor" />
              </div>
            </div>
          </div>

          <div class="timer-display">
            <span class="timer-text">{{ formattedTime }}</span>
            <span class="timer-label">{{ timerLabel }}</span>
            <span v-if="isRunning || isPaused" class="points-indicator">
              <span class="success-points">+{{ potentialPoints }} {{ $t('todo.points') }}</span>
            </span>
          </div>
        </div>

        <!-- Duration Selector -->
        <div v-if="!isRunning && !isPaused" class="duration-selector">
          <div class="duration-options">
            <button
              v-for="option in durationOptions"
              :key="option.value"
              class="duration-btn"
              :class="{ active: selectedDuration === option.value }"
              @click="selectDuration(option.value)"
            >
              <span class="duration-value">{{ option.label }}</span>
              <span class="duration-points">+{{ option.points }}</span>
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
            <button class="control-btn stop-btn" @click="confirmGiveUp">
              <i class="el-icon-switch-button"></i>
              <span>{{ $t('todo.focus.giveUp') }}</span>
            </button>
          </template>
          <template v-else-if="isPaused">
            <button class="control-btn resume-btn" @click="resumeFocus">
              <i class="el-icon-video-play"></i>
              <span>{{ $t('todo.focus.resume') }}</span>
            </button>
            <button class="control-btn stop-btn" @click="confirmGiveUp">
              <i class="el-icon-switch-button"></i>
              <span>{{ $t('todo.focus.giveUp') }}</span>
            </button>
          </template>
        </div>

        <!-- Session Stats -->
        <div class="session-stats">
          <div class="stat-card points-card">
            <div class="stat-icon points-icon"><i class="el-icon-coin"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ totalPoints }}</span>
              <span class="stat-label">{{ $t('todo.focus.totalPoints') }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon trees-icon"><i class="el-icon-sunrise"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ todayTrees }}</span>
              <span class="stat-label">{{ $t('todo.focus.todayTrees') }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon time-icon"><i class="el-icon-time"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ todayMinutes }}</span>
              <span class="stat-label">{{ $t('todo.focus.todayMinutes') }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon streak-icon"><i class="el-icon-trophy"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ currentStreak }}</span>
              <span class="stat-label">{{ $t('todo.focus.streak') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Forest Map -->
      <div class="forest-panel">
        <div class="forest-header">
          <h3 class="panel-title">
            <i class="el-icon-place"></i>
            {{ $t('todo.focus.myForest') }}
          </h3>
          <div class="forest-stats">
            <span class="total-trees">{{ plantedTrees.length }} {{ $t('todo.focus.treesPlanted') }}</span>
          </div>
        </div>

        <!-- 3D Forest Grid -->
        <div class="forest-grid-container">
          <div class="forest-grid" ref="forestGrid">
            <div
              v-for="(cell, index) in forestCells"
              :key="index"
              class="forest-cell"
              :class="{
                'has-tree': cell.tree,
                'cell-hover': !cell.tree && !isRunning,
                [`tree-${cell.tree?.type}`]: cell.tree
              }"
              @click="onCellClick(index)"
            >
              <div v-if="cell.tree" class="planted-tree" :style="{ '--tree-color': cell.tree.color }">
                <PlantedTree3D :type="cell.tree.type" :color="cell.tree.color" :size="cell.tree.size" />
                <div class="tree-shadow"></div>
              </div>
              <div v-else class="empty-cell">
                <div class="grass"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Forest Legend -->
        <div class="forest-legend">
          <div v-for="tree in treeTypes" :key="tree.id" class="legend-item">
            <div class="legend-color" :style="{ background: tree.color }"></div>
            <span>{{ tree.name }}</span>
            <span class="legend-count">{{ getTreeCount(tree.id) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Completion Dialog -->
    <KiwiDialog
      :visible.sync="showCompletionDialog"
      width="450px"
      :title="$t('todo.focus.congratulations')"
      custom-class="completion-dialog"
      :close-on-click-modal="false"
    >
      <div class="completion-content">
        <div class="completion-tree" :style="{ '--tree-color': currentTreeColor }">
          <Tree3D stage="tree" :type="selectedTreeType" :color="currentTreeColor" :size="120" />
        </div>
        <p class="completion-message">{{ $t('todo.focus.treeGrown') }}</p>
        <div class="completion-stats">
          <div class="completion-stat">
            <span class="stat-label">{{ $t('todo.focus.focusTime') }}</span>
            <span class="stat-value">{{ completedDuration }} {{ $t('todo.focus.minutes') }}</span>
          </div>
          <div class="completion-stat points">
            <span class="stat-label">{{ $t('todo.focus.pointsEarned') }}</span>
            <span class="stat-value success">+{{ earnedPoints }} {{ $t('todo.points') }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <KiwiButton type="primary" @click="closeCompletionDialog">
          {{ $t('todo.focus.plantTree') }}
        </KiwiButton>
      </template>
    </KiwiDialog>

    <!-- Give Up Confirmation Dialog -->
    <KiwiDialog
      :visible.sync="showGiveUpDialog"
      width="400px"
      :title="$t('todo.focus.giveUpTitle')"
      custom-class="giveup-dialog"
    >
      <div class="giveup-content">
        <div class="giveup-icon">
          <i class="el-icon-warning"></i>
        </div>
        <p class="giveup-message">{{ $t('todo.focus.giveUpMessage') }}</p>
        <div class="giveup-penalty">
          <span class="penalty-amount">-100 {{ $t('todo.points') }}</span>
        </div>
      </div>
      <template #footer>
        <KiwiButton @click="showGiveUpDialog = false">{{ $t('common.cancel') }}</KiwiButton>
        <KiwiButton type="danger" @click="confirmStopFocus">{{ $t('todo.focus.confirmGiveUp') }}</KiwiButton>
      </template>
    </KiwiDialog>

  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import KiwiDialog from '@/components/ui/KiwiDialog.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import Tree3D from './components/Tree3D.vue'
import PlantedTree3D from './components/PlantedTree3D.vue'

// Points calculation: 100 points per 30 minutes
const POINTS_PER_30_MIN = 100
const PENALTY_POINTS = 100

export default {
  name: 'FocusView',
  components: {
    KiwiDialog,
    KiwiButton,
    Tree3D,
    PlantedTree3D
  },

  data() {
    return {
      // Timer state
      selectedDuration: 30,
      customMinutes: null,
      remainingSeconds: 0,
      totalSeconds: 0,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      timerInterval: null,

      // Tree selection
      selectedTreeType: 'oak',
      treeTypes: [
        { id: 'oak', name: 'Oak', color: '#4CAF50', colorDark: '#2E7D32', icon: 'TreeOak' },
        { id: 'pine', name: 'Pine', color: '#1B5E20', colorDark: '#0D3D12', icon: 'TreePine' },
        { id: 'cherry', name: 'Cherry', color: '#E91E63', colorDark: '#AD1457', icon: 'TreeCherry' },
        { id: 'maple', name: 'Maple', color: '#FF5722', colorDark: '#BF360C', icon: 'TreeMaple' },
        { id: 'willow', name: 'Willow', color: '#8BC34A', colorDark: '#558B2F', icon: 'TreeWillow' },
        { id: 'sakura', name: 'Sakura', color: '#F48FB1', colorDark: '#C2185B', icon: 'TreeSakura' }
      ],

      // Duration options with points
      durationOptions: [
        { label: '15', value: 15, points: 50 },
        { label: '30', value: 30, points: 100 },
        { label: '45', value: 45, points: 150 },
        { label: '60', value: 60, points: 200 },
        { label: '90', value: 90, points: 300 },
        { label: '120', value: 120, points: 400 }
      ],

      // Forest grid (8x6 = 48 cells)
      forestCells: Array(48).fill(null).map(() => ({ tree: null })),
      plantedTrees: [],

      // Stats
      totalPoints: 0,
      todayTrees: 0,
      todayMinutes: 0,
      currentStreak: 0,

      // UI state
      showCompletionDialog: false,
      showGiveUpDialog: false,
      completedDuration: 0,
      earnedPoints: 0,

      // Browser leave detection
      beforeUnloadHandler: null,
      pageHideHandler: null,

      // Alert sounds
      audioContext: null,
      halfwayAlerted: false,
      progressAlertedAt: new Set()
    }
  },

  computed: {
    ...mapState('focus', {
      focusStats: state => state.stats
    }),

    circumference() {
      return 2 * Math.PI * 90
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
      return this.customMinutes && this.customMinutes > 0 ? this.customMinutes : this.selectedDuration
    },

    potentialPoints() {
      return Math.round((this.effectiveDuration / 30) * POINTS_PER_30_MIN)
    },

    currentTreeColor() {
      const tree = this.treeTypes.find(t => t.id === this.selectedTreeType)
      return tree ? tree.color : '#4CAF50'
    },

    currentTreeColorDark() {
      const tree = this.treeTypes.find(t => t.id === this.selectedTreeType)
      return tree ? tree.colorDark : '#2E7D32'
    }
  },

  watch: {
    focusStats: {
      immediate: true,
      handler(stats) {
        if (stats) {
          this.totalPoints = stats.totalPoints || 0
          this.todayTrees = stats.todayTrees || 0
          this.todayMinutes = stats.todayMinutes || 0
          this.currentStreak = stats.currentStreak || 0
          this.plantedTrees = stats.plantedTrees || []
          this.loadForestFromTrees()
        }
      }
    }
  },

  created() {
    this.loadFocusStats()
    this.loadLocalData()
    this.checkForFailedSession()
  },

  mounted() {
    this.setupBrowserLeaveDetection()
  },

  beforeDestroy() {
    this.cleanupBrowserLeaveDetection()
    this.stopTimer()
    if (this.audioContext) {
      this.audioContext.close()
    }
  },

  methods: {
    ...mapActions('focus', ['fetchFocusStats', 'createFocusSession', 'completeFocusSession', 'cancelFocusSession', 'failFocusSession']),

    loadLocalData() {
      try {
        const data = JSON.parse(localStorage.getItem('kiwi_focus_forest') || '{}')
        if (data.forestCells) this.forestCells = data.forestCells
        if (data.plantedTrees) this.plantedTrees = data.plantedTrees
        if (typeof data.totalPoints === 'number') this.totalPoints = data.totalPoints
      } catch (e) {
        console.warn('Failed to load local focus data:', e)
      }
    },

    saveLocalData() {
      try {
        localStorage.setItem('kiwi_focus_forest', JSON.stringify({
          forestCells: this.forestCells,
          plantedTrees: this.plantedTrees,
          totalPoints: this.totalPoints
        }))
      } catch (e) {
        console.warn('Failed to save local focus data:', e)
      }
    },

    async loadFocusStats() {
      try {
        await this.fetchFocusStats()
      } catch (e) {
        console.warn('Focus stats not available:', e)
      }
    },

    loadForestFromTrees() {
      // Reconstruct forest grid from planted trees
      this.forestCells = Array(48).fill(null).map(() => ({ tree: null }))
      this.plantedTrees.forEach((tree, index) => {
        if (index < 48) {
          this.forestCells[index] = { tree }
        }
      })
    },

    // Tree selection
    selectTreeType(type) {
      this.selectedTreeType = type
    },

    selectDuration(minutes) {
      this.selectedDuration = minutes
      this.customMinutes = null
    },

    // Timer controls
    async startFocus() {
      const duration = this.effectiveDuration
      this.totalSeconds = duration * 60
      this.remainingSeconds = this.totalSeconds
      this.isRunning = true
      this.isPaused = false
      this.isCompleted = false
      this.earnedPoints = this.potentialPoints

      try {
        await this.createFocusSession({
          duration,
          treeType: this.selectedTreeType,
          potentialPoints: this.potentialPoints
        })
      } catch (e) {
        console.warn('Failed to create focus session:', e)
      }

      this.resetAlertState()
      this.playStartAlert()
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

    confirmGiveUp() {
      this.showGiveUpDialog = true
    },

    async confirmStopFocus() {
      this.showGiveUpDialog = false
      await this.handleFocusFail('give_up')
    },

    async handleFocusFail(reason = 'give_up') {
      this.stopTimer()
      this.isRunning = false
      this.isPaused = false
      this.isCompleted = false

      // Deduct penalty points
      this.totalPoints = Math.max(0, this.totalPoints - PENALTY_POINTS)

      try {
        await this.failFocusSession({ reason, penalty: PENALTY_POINTS })
      } catch (e) {
        console.warn('Failed to record focus failure:', e)
      }

      this.saveLocalData()
      this.$message.warning(this.$t('todo.focus.focusFailed', { points: PENALTY_POINTS }))

      this.remainingSeconds = 0
      this.totalSeconds = 0
    },

    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--
          this.checkTimerAlerts()
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
      this.playEndAlert()
      this.isRunning = false
      this.isPaused = false
      this.isCompleted = true
      this.completedDuration = Math.round(this.totalSeconds / 60)
      this.earnedPoints = Math.round((this.completedDuration / 30) * POINTS_PER_30_MIN)

      // Add points
      this.totalPoints += this.earnedPoints
      this.todayTrees++
      this.todayMinutes += this.completedDuration

      try {
        await this.completeFocusSession({
          treeType: this.selectedTreeType,
          duration: this.completedDuration,
          points: this.earnedPoints
        })
        await this.loadFocusStats()
      } catch (e) {
        console.warn('Failed to complete focus session:', e)
      }

      this.showCompletionDialog = true
    },

    closeCompletionDialog() {
      this.showCompletionDialog = false
      this.plantTreeInForest()
      this.isCompleted = false
      this.remainingSeconds = 0
      this.totalSeconds = 0
    },

    plantTreeInForest() {
      // Find first empty cell
      const emptyIndex = this.forestCells.findIndex(cell => !cell.tree)
      if (emptyIndex !== -1) {
        const newTree = {
          type: this.selectedTreeType,
          color: this.currentTreeColor,
          size: 0.8 + Math.random() * 0.4,
          plantedAt: new Date().toISOString()
        }
        this.forestCells[emptyIndex] = { tree: newTree }
        this.plantedTrees.push(newTree)
        this.saveLocalData()
      }
    },

    onCellClick(index) {
      // Could be used for tree info or removal in future
    },

    getTreeCount(type) {
      return this.plantedTrees.filter(t => t.type === type).length
    },

    // Browser leave detection
    // Note: Screen lock (phone screen off) is allowed and won't fail the session.
    // Only closing/navigating away from the website will trigger a warning.
    setupBrowserLeaveDetection() {
      // Before unload detection - warns when closing tab or navigating away
      this.beforeUnloadHandler = (e) => {
        if (this.isRunning || this.isPaused) {
          e.preventDefault()
          e.returnValue = this.$t('todo.focus.leaveWarning')
          return e.returnValue
        }
      }
      window.addEventListener('beforeunload', this.beforeUnloadHandler)

      // Page hide detection - triggers when page is being unloaded (closing/navigating)
      // This is more reliable than beforeunload for actually failing the session
      this.pageHideHandler = (e) => {
        // Only fail if the page is actually being closed/navigated away from
        // e.persisted is true when page might be restored from bfcache (back-forward cache)
        if ((this.isRunning || this.isPaused) && !e.persisted) {
          // Store failed session state in localStorage for recovery
          this.markSessionAsFailed('browser_closed')
        }
      }
      window.addEventListener('pagehide', this.pageHideHandler)
    },

    markSessionAsFailed(reason) {
      // Save failed session to localStorage so we can process it on next load
      try {
        const failedSession = {
          reason,
          timestamp: new Date().toISOString(),
          penalty: 100
        }
        localStorage.setItem('kiwi_focus_failed_session', JSON.stringify(failedSession))
      } catch (e) {
        console.warn('Failed to save session failure:', e)
      }
    },

    checkForFailedSession() {
      // Check if there was a failed session from previous page close
      try {
        const failedSession = localStorage.getItem('kiwi_focus_failed_session')
        if (failedSession) {
          const session = JSON.parse(failedSession)
          localStorage.removeItem('kiwi_focus_failed_session')

          // Deduct penalty points
          this.totalPoints = Math.max(0, this.totalPoints - session.penalty)
          this.saveLocalData()

          // Show notification
          this.$message.warning(this.$t('todo.focus.focusFailed', { points: session.penalty }))
        }
      } catch (e) {
        console.warn('Failed to check for failed session:', e)
      }
    },

    cleanupBrowserLeaveDetection() {
      if (this.beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      }
      if (this.pageHideHandler) {
        window.removeEventListener('pagehide', this.pageHideHandler)
      }
    },

    // --- Alert Sound System ---
    getAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      return this.audioContext
    },

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
      const ctx = this.getAudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    },

    playStartAlert() {
      // Ascending two-tone chime
      this.playTone(523, 0.2, 'sine', 0.3)  // C5
      setTimeout(() => this.playTone(659, 0.3, 'sine', 0.3), 200)  // E5
    },

    playEndAlert() {
      // Triumphant three-tone chime
      this.playTone(523, 0.2, 'sine', 0.35)  // C5
      setTimeout(() => this.playTone(659, 0.2, 'sine', 0.35), 200)  // E5
      setTimeout(() => this.playTone(784, 0.4, 'sine', 0.35), 400)  // G5
    },

    playHalfwayAlert() {
      // Gentle double tap
      this.playTone(440, 0.15, 'sine', 0.2)  // A4
      setTimeout(() => this.playTone(440, 0.15, 'sine', 0.2), 200)  // A4
    },

    playProgressAlert() {
      // Soft single tick
      this.playTone(392, 0.12, 'sine', 0.15)  // G4
    },

    checkTimerAlerts() {
      if (this.totalSeconds === 0) return
      const elapsed = this.totalSeconds - this.remainingSeconds
      const progress = elapsed / this.totalSeconds

      // Halfway alert (once)
      if (!this.halfwayAlerted && progress >= 0.5 && elapsed > 0) {
        this.halfwayAlerted = true
        this.playHalfwayAlert()
      }

      // Progress alerts every 10 minutes
      const elapsedMinutes = Math.floor(elapsed / 60)
      if (elapsedMinutes > 0 && elapsedMinutes % 10 === 0 && !this.progressAlertedAt.has(elapsedMinutes)) {
        // Skip if this is also the halfway point (already alerted)
        const halfwayMinutes = Math.floor(this.totalSeconds / 120)
        if (elapsedMinutes !== halfwayMinutes) {
          this.progressAlertedAt.add(elapsedMinutes)
          this.playProgressAlert()
        }
      }
    },

    resetAlertState() {
      this.halfwayAlerted = false
      this.progressAlertedAt = new Set()
    }
  }
}
</script>

<style scoped>
.focus-view {
  min-height: 100vh;
  padding: 20px;
  background: var(--bg-body);
  position: relative;
}

.focus-view.focus-active {
  user-select: none;
}

/* Layout */
.focus-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .focus-layout {
    grid-template-columns: 1fr;
  }
}

/* Panel Styles */
.timer-panel,
.forest-panel {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 24px;
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title i {
  color: var(--color-primary);
}

/* Timer Header */
.timer-header {
  margin-bottom: 24px;
}

/* Tree Selector */
.tree-selector {
  margin-bottom: 24px;
}

.selector-label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.tree-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.tree-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: var(--bg-container);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.tree-option:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.tree-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light-9);
  box-shadow: var(--shadow-hover);
}

.tree-preview-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.tree-option:hover .tree-preview-wrapper {
  transform: scale(1.1);
}

.tree-option.active .tree-preview-wrapper {
  transform: scale(1.15);
}

.tree-name {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Timer Container */
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.tree-visual {
  position: relative;
  width: 240px;
  height: 240px;
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
  transition: stroke-dashoffset 0.5s ease;
  filter: drop-shadow(0 0 8px currentColor);
}

.tree-icon-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
}

.tree-3d {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
}

.tree-visual.growing .tree-3d {
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
  font-size: 56px;
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

.points-indicator {
  margin-top: 8px;
}

.success-points {
  color: var(--color-success);
  font-weight: 600;
  font-size: 16px;
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
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.duration-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
}

.duration-btn:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.duration-btn.active {
  background: var(--gradient-primary);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--shadow-hover);
}

.duration-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.duration-btn.active .duration-value {
  color: #fff;
}

.duration-points {
  font-size: 11px;
  color: var(--color-success);
  font-weight: 600;
}

.duration-btn.active .duration-points {
  color: rgba(255, 255, 255, 0.9);
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
}

.custom-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light-5);
}

.custom-unit {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Control Buttons */
.control-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
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

.resume-btn {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.stop-btn {
  background: var(--bg-card);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.stop-btn:hover {
  background: var(--color-danger);
  color: #fff;
}

/* Session Stats */
.session-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
}

.stat-card.points-card {
  grid-column: span 2;
  background: var(--gradient-primary);
  border: none;
}

.stat-card.points-card .stat-value,
.stat-card.points-card .stat-label {
  color: #fff;
}

.stat-card.points-card .stat-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.points-icon { background: var(--color-warning-light-9); color: var(--color-warning); }
.trees-icon { background: var(--color-success-light-9); color: var(--color-success); }
.time-icon { background: var(--color-primary-light-9); color: var(--color-primary); }
.streak-icon { background: var(--color-danger-light-9); color: var(--color-danger); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Forest Panel */
.forest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forest-stats {
  font-size: 14px;
  color: var(--text-secondary);
}

.total-trees {
  font-weight: 600;
  color: var(--color-success);
}

/* Forest Grid */
.forest-grid-container {
  background: linear-gradient(180deg, #87CEEB 0%, #98D8AA 30%, #5D8B3F 100%);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
  perspective: 1000px;
}

.forest-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  transform: rotateX(30deg);
  transform-style: preserve-3d;
}

.forest-cell {
  aspect-ratio: 1;
  background: rgba(93, 139, 63, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
}

.forest-cell.cell-hover:hover {
  background: rgba(93, 139, 63, 0.5);
  transform: translateZ(5px);
}

.forest-cell.has-tree {
  background: rgba(93, 139, 63, 0.4);
}

.empty-cell {
  width: 100%;
  height: 100%;
  position: relative;
}

.grass {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(134, 187, 76, 0.3) 0%, transparent 70%);
}

.planted-tree {
  position: relative;
  transform: translateZ(10px);
  animation: treeAppear 0.5s ease-out;
}

.tree-shadow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 20%;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, transparent 70%);
  border-radius: 50%;
}

@keyframes treeAppear {
  0% { transform: translateZ(10px) scale(0); opacity: 0; }
  50% { transform: translateZ(15px) scale(1.1); }
  100% { transform: translateZ(10px) scale(1); opacity: 1; }
}

/* Forest Legend */
.forest-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-count {
  font-weight: 600;
  color: var(--text-primary);
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

.completion-message {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  font-weight: 600;
}

.completion-stats {
  display: flex;
  gap: 24px;
}

.completion-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.completion-stat .stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.completion-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.completion-stat .stat-value.success {
  color: var(--color-success);
}

/* Give Up Dialog */
.giveup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  text-align: center;
}

.giveup-icon i {
  font-size: 64px;
  color: var(--color-warning);
}

.giveup-message {
  font-size: 16px;
  color: var(--text-primary);
  margin: 16px 0;
}

.giveup-penalty {
  padding: 12px 24px;
  background: var(--color-danger-light-9);
  border-radius: var(--radius-md);
}

.penalty-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-danger);
}

/* Responsive */
@media (max-width: 768px) {
  .focus-view {
    padding: 12px;
  }

  .timer-panel,
  .forest-panel {
    padding: 16px;
  }

  .timer-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .tree-visual {
    width: 200px;
    height: 200px;
  }

  .timer-text {
    font-size: 44px;
  }

  .duration-btn {
    width: 56px;
    height: 56px;
  }

  .duration-value {
    font-size: 16px;
  }

  .session-stats {
    grid-template-columns: 1fr;
  }

  .stat-card.points-card {
    grid-column: span 1;
  }

  .forest-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Color variable fallbacks */
:root {
  --color-success-light-9: rgba(16, 185, 129, 0.1);
  --color-primary-light-9: rgba(99, 102, 241, 0.1);
  --color-warning-light-9: rgba(245, 158, 11, 0.1);
  --color-danger-light-9: rgba(239, 68, 68, 0.1);
}
</style>
