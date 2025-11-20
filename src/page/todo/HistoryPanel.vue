<template>
  <div class="history-tab">
    <div class="history-controls">
      <div class="kiwi-date-picker-wrapper">
        <input 
          type="date" 
          v-model="dateString" 
          class="kiwi-input__inner" 
          @change="onDateInput"
        />
      </div>
    </div>

    <div v-if="historyTasks.length > 0" class="history-tasks">
      <h3 class="history-date-title">{{ formatDate(innerDate) }}</h3>
      <div v-for="task in historyTasks" :key="`history-${task.id}-${task.completedAt || task.completedDate || task.date || Date.now()}`" class="task-card history-task-card responsive-history-card" :class="getTaskStatusClass(task.status)">
        <div class="task-content history-task-content">
          <div class="history-task-main">
            <div class="task-info history-task-info">
              <h4 class="task-title history-task-title">{{ task.title }}</h4>
              <p v-if="task.description" class="task-description history-task-description">{{ task.description }}</p>
            </div>
            <div class="task-meta-history">
              <div class="task-points">
                <KiwiTag size="mini" type="success">+{{ task.successPoints }}</KiwiTag>
                <KiwiTag size="mini" type="danger">{{ task.failPoints }}</KiwiTag>
              </div>
              <div class="completion-time" v-if="task.completedAt || task.completedDate">
                <KiwiTag size="mini" type="info" effect="plain">
                  <i class="el-icon-time"></i>
                  <span class="time-text">{{ formatTime(task.completedAt || task.completedDate) }}</span>
                </KiwiTag>
              </div>
            </div>
          </div>
          <div class="history-task-status">
            <div class="status-section">
              <KiwiTag :type="task.status === 'success' ? 'success' : 'danger'" effect="dark" size="medium" class="history-status-tag">
                {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
              </KiwiTag>
            </div>
            <div class="history-actions">
              <KiwiButton type="danger" size="mini" icon="el-icon-delete" circle :title="$t('todo.deleteHistoryRecord')" @click="handleDelete(task.id, task.completedAt || task.completedDate || task.date)" class="history-delete-btn"></KiwiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      <div class="empty-state">
        <i class="el-icon-document-remove empty-icon"></i>
        <p class="empty-text">{{ $t('todo.noTasksForDate') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiTag from '@/components/ui/KiwiTag.vue'

export default {
  name: 'HistoryPanel',
  components: { KiwiButton, KiwiTag },
  props: {
    selectedDate: { type: [Date, String], required: true },
    historyTasks: { type: Array, required: true },
    formatDate: { type: Function, required: true },
    formatTime: { type: Function, required: true },
    getTaskStatusClass: { type: Function, required: true },
    onDateChanged: { type: Function, required: true },
    onDeleteHistoryRecord: { type: Function, required: true }
  },
  data() {
    return { 
      innerDate: this.selectedDate,
      dateString: this.formatDateToISO(this.selectedDate)
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
    handleDelete(id, date) {
      if (confirm(this.$t('todo.confirmDeleteHistoryRecord'))) {
        this.onDeleteHistoryRecord && this.onDeleteHistoryRecord(id, date)
      }
    }
  }
}
</script>

<style scoped>
.kiwi-date-picker-wrapper {
  display: inline-block;
  width: 100%;
  max-width: 200px;
}

.kiwi-input__inner {
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border-color-light);
  box-sizing: border-box;
  color: var(--text-primary);
  display: inline-block;
  font-size: inherit;
  height: 40px;
  line-height: 40px;
  outline: none;
  padding: 0 15px;
  transition: border-color .2s cubic-bezier(.645,.045,.355,1);
  width: 100%;
}

.kiwi-input__inner:focus {
  border-color: var(--color-primary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--text-placeholder);
}

.empty-text {
  font-size: 14px;
}
</style>
