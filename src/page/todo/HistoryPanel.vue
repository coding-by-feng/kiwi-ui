<template>
  <div class="history-tab">
    <!-- Header with date picker and stats -->
    <div class="history-header">
      <div class="date-picker-section">
        <div class="date-picker-wrapper">
          <i class="el-icon-date date-icon"></i>
          <input
            type="date"
            v-model="dateString"
            class="date-input"
            @change="onDateInput"
          />
        </div>
        <div class="date-nav">
          <button class="nav-btn" @click="goToPreviousDay" :title="$t('todo.previousDay')">
            <i class="el-icon-arrow-left"></i>
          </button>
          <button class="nav-btn today-btn" @click="goToToday">{{ $t('todo.today') }}</button>
          <button class="nav-btn" @click="goToNextDay" :title="$t('todo.nextDay')">
            <i class="el-icon-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Stats summary -->
      <div class="stats-summary" v-if="historyTasks.length > 0">
        <div class="stat-item stat-completed">
          <i class="el-icon-circle-check"></i>
          <span class="stat-value">{{ completedCount }}</span>
          <span class="stat-label">{{ $t('todo.completed') }}</span>
        </div>
        <div class="stat-item stat-failed">
          <i class="el-icon-circle-close"></i>
          <span class="stat-value">{{ failedCount }}</span>
          <span class="stat-label">{{ $t('todo.failed') }}</span>
        </div>
        <div class="stat-item stat-points">
          <i class="el-icon-star-on"></i>
          <span class="stat-value" :class="{ positive: totalPoints > 0, negative: totalPoints < 0 }">
            {{ totalPoints > 0 ? '+' : '' }}{{ totalPoints }}
          </span>
          <span class="stat-label">{{ $t('todo.points') }}</span>
        </div>
      </div>
    </div>

    <!-- Date title -->
    <h3 class="history-date-title" v-if="historyTasks.length > 0">
      <span class="date-text">{{ formatDate(innerDate) }}</span>
      <span class="task-count">{{ historyTasks.length }} {{ historyTasks.length === 1 ? $t('todo.task') : $t('todo.tasks') }}</span>
    </h3>

    <!-- Task list -->
    <div v-if="historyTasks.length > 0" class="history-tasks">
      <transition-group name="task-list" tag="div">
        <div
          v-for="task in historyTasks"
          :key="`history-${task.id}-${task.completedAt || task.completedDate || task.date || Date.now()}`"
          class="history-card"
          :class="[task.status === 'success' ? 'status-success' : 'status-failed']"
        >
          <!-- Status indicator bar -->
          <div class="status-bar" :class="task.status"></div>

          <div class="card-content">
            <!-- Left: Task info -->
            <div class="task-info">
              <div class="task-header">
                <span class="status-icon" :class="task.status">
                  <i :class="task.status === 'success' ? 'el-icon-check' : 'el-icon-close'"></i>
                </span>
                <h4 class="task-title">{{ task.title }}</h4>
              </div>
              <p v-if="task.description" class="task-description">{{ task.description }}</p>

              <!-- Meta info -->
              <div class="task-meta">
                <div class="meta-item points">
                  <span class="points-success">+{{ task.successPoints }}</span>
                  <span class="points-separator">/</span>
                  <span class="points-fail">{{ task.failPoints }}</span>
                </div>
                <div class="meta-item time" v-if="task.completedAt || task.completedDate">
                  <i class="el-icon-time"></i>
                  <span>{{ formatTime(task.completedAt || task.completedDate) }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="task-actions">
              <button
                class="action-btn restore-btn"
                @click="handleRestore(task)"
                :title="$t('todo.restoreTask')"
              >
                <i class="el-icon-refresh-left"></i>
                <span class="btn-text">{{ $t('todo.restore') }}</span>
              </button>
              <button
                class="action-btn delete-btn"
                @click="handleDelete(task.id, task.completedAt || task.completedDate || task.date)"
                :title="$t('todo.deleteHistoryRecord')"
              >
                <i class="el-icon-delete"></i>
              </button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <i class="el-icon-document"></i>
        <div class="empty-decoration"></div>
      </div>
      <h4 class="empty-title">{{ $t('todo.noTasksForDate') }}</h4>
      <p class="empty-subtitle">{{ $t('todo.noHistoryHint') }}</p>
      <button class="go-today-btn" @click="goToToday" v-if="!isToday">
        <i class="el-icon-date"></i>
        {{ $t('todo.goToToday') }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryPanel',
  props: {
    selectedDate: { type: [Date, String], required: true },
    historyTasks: { type: Array, required: true },
    formatDate: { type: Function, required: true },
    formatTime: { type: Function, required: true },
    getTaskStatusClass: { type: Function, required: true },
    onDateChanged: { type: Function, required: true },
    onDeleteHistoryRecord: { type: Function, required: true },
    onRestoreTask: { type: Function, default: null }
  },
  data() {
    return {
      innerDate: this.selectedDate,
      dateString: this.formatDateToISO(this.selectedDate)
    }
  },
  computed: {
    completedCount() {
      return this.historyTasks.filter(t => t.status === 'success').length
    },
    failedCount() {
      return this.historyTasks.filter(t => t.status !== 'success').length
    },
    totalPoints() {
      return this.historyTasks.reduce((sum, task) => {
        if (task.status === 'success') {
          return sum + (task.successPoints || 0)
        } else {
          return sum + (task.failPoints || 0)
        }
      }, 0)
    },
    isToday() {
      const today = new Date()
      const selected = new Date(this.innerDate)
      return (
        today.getFullYear() === selected.getFullYear() &&
        today.getMonth() === selected.getMonth() &&
        today.getDate() === selected.getDate()
      )
    }
  },
  watch: {
    selectedDate(val) {
      this.innerDate = val
      this.dateString = this.formatDateToISO(val)
    }
  },
  methods: {
    formatDateToISO(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toISOString().split('T')[0]
    },
    onDateInput(e) {
      const val = e.target.value
      if (val) {
        this.innerDate = new Date(val)
        this.onDateChanged && this.onDateChanged(this.innerDate)
      }
    },
    goToPreviousDay() {
      const d = new Date(this.innerDate)
      d.setDate(d.getDate() - 1)
      this.innerDate = d
      this.dateString = this.formatDateToISO(d)
      this.onDateChanged && this.onDateChanged(d)
    },
    goToNextDay() {
      const d = new Date(this.innerDate)
      d.setDate(d.getDate() + 1)
      this.innerDate = d
      this.dateString = this.formatDateToISO(d)
      this.onDateChanged && this.onDateChanged(d)
    },
    goToToday() {
      const today = new Date()
      this.innerDate = today
      this.dateString = this.formatDateToISO(today)
      this.onDateChanged && this.onDateChanged(today)
    },
    handleDelete(id, date) {
      if (confirm(this.$t('todo.confirmDeleteHistoryRecord'))) {
        this.onDeleteHistoryRecord && this.onDeleteHistoryRecord(id, date)
      }
    },
    handleRestore(task) {
      if (this.onRestoreTask) {
        this.onRestoreTask(task)
      } else {
        this.$emit('restore-task', task)
      }
    }
  }
}
</script>

<style scoped>
/* History Tab Layout */
.history-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

/* Header Section */
.history-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color-light);
}

.date-picker-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-picker-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-icon {
  position: absolute;
  left: 12px;
  color: var(--color-primary);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

.date-input {
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  padding: 0 12px 0 38px;
  outline: none;
  transition: all var(--transition-fast);
  cursor: pointer;
  min-width: 160px;
}

.date-input:hover {
  border-color: var(--color-primary);
}

.date-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light-9);
}

.date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.6;
  cursor: pointer;
}

/* Date Navigation */
.date-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-width: 36px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-btn:hover {
  background: var(--bg-highlight);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.nav-btn.today-btn {
  padding: 0 14px;
  background: var(--color-primary-light-9);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.nav-btn.today-btn:hover {
  background: var(--color-primary);
  color: var(--text-inverse);
}

/* Stats Summary */
.stats-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color-light);
}

.stat-item i {
  font-size: 18px;
}

.stat-completed i {
  color: var(--color-success);
}

.stat-failed i {
  color: var(--color-danger);
}

.stat-points i {
  color: var(--color-warning);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-value.positive {
  color: var(--color-success);
}

.stat-value.negative {
  color: var(--color-danger);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Date Title */
.history-date-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 0 4px;
}

.date-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.task-count {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 4px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
}

/* History Tasks Container */
.history-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* History Card */
.history-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--border-color);
}

.history-card.status-success:hover {
  border-color: rgba(var(--color-success-rgb), 0.4);
}

.history-card.status-failed:hover {
  border-color: rgba(var(--color-danger-rgb), 0.4);
}

/* Status Bar */
.status-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.status-bar.success {
  background: var(--gradient-success);
}

.status-bar.failed,
.status-bar.fail {
  background: var(--gradient-danger);
}

/* Card Content */
.card-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px 16px 20px;
}

/* Task Info */
.task-info {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon.success {
  background: rgba(var(--color-success-rgb), 0.15);
  color: var(--color-success);
}

.status-icon.failed,
.status-icon.fail {
  background: rgba(var(--color-danger-rgb), 0.15);
  color: var(--color-danger);
}

.status-icon i {
  font-size: 14px;
  font-weight: bold;
}

.task-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.task-description {
  margin: 0 0 12px 36px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

/* Task Meta */
.task-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 36px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.meta-item.points {
  font-weight: 600;
}

.points-success {
  color: var(--color-success);
}

.points-separator {
  color: var(--text-placeholder);
}

.points-fail {
  color: var(--color-danger);
}

.meta-item.time i {
  font-size: 14px;
}

/* Task Actions */
.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: transparent;
  color: var(--text-secondary);
}

.action-btn i {
  font-size: 14px;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.restore-btn {
  background: rgba(var(--color-primary-rgb), 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.restore-btn:hover {
  background: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.delete-btn {
  width: 34px;
  padding: 0;
  background: rgba(var(--color-danger-rgb), 0.1);
  border-color: transparent;
  color: var(--color-danger);
}

.delete-btn:hover {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-danger-rgb), 0.3);
}

/* List Transitions */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-illustration {
  position: relative;
  margin-bottom: 24px;
}

.empty-illustration i {
  font-size: 64px;
  color: var(--text-placeholder);
  opacity: 0.5;
}

.empty-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border: 2px dashed var(--border-color-light);
  border-radius: 50%;
  opacity: 0.5;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-subtitle {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--text-muted);
}

.go-today-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--gradient-primary);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-inverse);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.go-today-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.4);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .date-picker-section {
    justify-content: space-between;
  }

  .stats-summary {
    justify-content: center;
  }

  .card-content {
    flex-direction: column;
    gap: 16px;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .task-description,
  .task-meta {
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .history-tab {
    gap: 16px;
  }

  .history-header {
    padding: 14px 16px;
  }

  .date-picker-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .date-input {
    width: 100%;
  }

  .date-nav {
    justify-content: center;
  }

  .stats-summary {
    gap: 10px;
  }

  .stat-item {
    flex: 1;
    min-width: 0;
    justify-content: center;
    padding: 8px 10px;
  }

  .stat-label {
    display: none;
  }

  .history-date-title {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .card-content {
    padding: 14px 14px 14px 18px;
  }

  .task-header {
    gap: 8px;
  }

  .status-icon {
    width: 24px;
    height: 24px;
  }

  .status-icon i {
    font-size: 12px;
  }

  .task-title {
    font-size: 14px;
  }

  .task-description {
    font-size: 12px;
  }

  .task-meta {
    gap: 12px;
  }

  .action-btn {
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
  }

  .action-btn .btn-text {
    display: none;
  }

  .restore-btn {
    width: 32px;
    padding: 0;
  }

  .delete-btn {
    width: 32px;
  }
}

@media (max-width: 480px) {
  .history-header {
    padding: 12px;
  }

  .date-input {
    height: 36px;
    font-size: 13px;
  }

  .nav-btn {
    height: 32px;
    min-width: 32px;
    font-size: 12px;
  }

  .stat-item {
    padding: 6px 8px;
  }

  .stat-value {
    font-size: 14px;
  }

  .history-card {
    border-radius: var(--radius-md);
  }

  .card-content {
    padding: 12px 12px 12px 16px;
    gap: 12px;
  }

  .empty-state {
    padding: 40px 16px;
  }

  .empty-illustration i {
    font-size: 48px;
  }

  .empty-decoration {
    width: 80px;
    height: 80px;
  }
}

@media (max-width: 360px) {
  .history-tab {
    gap: 12px;
    padding: 0;
  }

  .date-text {
    font-size: 16px;
  }

  .task-count {
    font-size: 12px;
  }

  .task-title {
    font-size: 13px;
  }

  .task-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .meta-item {
    font-size: 12px;
  }
}
</style>
