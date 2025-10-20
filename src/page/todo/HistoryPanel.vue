<template>
  <div class="history-tab">
    <div class="history-controls">
      <el-date-picker v-model="innerDate" type="date" :placeholder="$t('todo.selectDate')" @change="onDateChange" class="responsive-date-picker" />
    </div>

    <div v-if="historyTasks.length > 0" class="history-tasks">
      <h3 class="history-date-title">{{ formatDate(innerDate) }}</h3>
      <el-card v-for="task in historyTasks" :key="`history-${task.id}-${task.completedDate || task.date || Date.now()}`" class="task-card history-task-card responsive-history-card" :class="getTaskStatusClass(task.status)">
        <div class="task-content history-task-content">
          <div class="history-task-main">
            <div class="task-info history-task-info">
              <h4 class="task-title history-task-title">{{ task.title }}</h4>
              <p v-if="task.description" class="task-description history-task-description">{{ task.description }}</p>
            </div>
            <div class="task-meta-history">
              <div class="task-points">
                <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
              </div>
              <div class="completion-time" v-if="task.completedDate">
                <el-tag size="mini" type="info" effect="plain">
                  <i class="el-icon-time"></i>
                  <span class="time-text">{{ formatTime(task.completedDate) }}</span>
                </el-tag>
              </div>
            </div>
          </div>
          <div class="history-task-status">
            <div class="status-section">
              <el-tag :type="task.status === 'success' ? 'success' : 'danger'" effect="dark" size="medium" class="history-status-tag">
                {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
              </el-tag>
            </div>
            <div class="history-actions">
              <el-popconfirm :title="$t('todo.confirmDeleteHistoryRecord')" @confirm="onDeleteHistory(task.id, task.completedDate || task.date)">
                <el-button slot="reference" type="danger" size="mini" icon="el-icon-delete" circle :title="$t('todo.deleteHistoryRecord')" class="history-delete-btn"></el-button>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </el-card>
    </div>
    <div v-else class="no-data">
      <el-empty :description="$t('todo.noTasksForDate')" />
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
    onDeleteHistoryRecord: { type: Function, required: true }
  },
  data() {
    return { innerDate: this.selectedDate }
  },
  watch: {
    selectedDate(val) { this.innerDate = val }
  },
  methods: {
    onDateChange(val) {
      this.onDateChanged && this.onDateChanged(val)
    },
    onDeleteHistory(id, date) {
      this.onDeleteHistoryRecord && this.onDeleteHistoryRecord(id, date)
    }
  }
}
</script>

