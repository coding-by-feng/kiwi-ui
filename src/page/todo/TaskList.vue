<template>
  <div class="tasks-list">
    <div v-for="task in tasks" :key="`task-${task.id}-${task.dateKey || 'default'}`" class="task-card responsive-task-card" :class="getTaskStatusClass(task.status)">
      <div class="task-content">
        <div class="task-info" v-if="editingTaskId !== task.id">
          <h4 class="task-title">{{ task.title }}</h4>
          <p v-if="task.description" class="task-description">{{ task.description }}</p>
          <div class="task-meta">
            <div class="task-points">
              <KiwiTag size="mini" type="success">+{{ task.successPoints }}</KiwiTag>
              <KiwiTag size="mini" type="danger">{{ task.failPoints }}</KiwiTag>
            </div>
            <div class="task-frequency" v-if="task.frequency && task.frequency !== 'once'">
              <KiwiTag size="mini" type="info" effect="plain">
                <i class="el-icon-refresh"></i>
                <span class="frequency-text">{{ getFrequencyText(task.frequency, task.customDays) }}</span>
              </KiwiTag>
            </div>
            <div class="task-completion-status" v-if="shouldShowDoneTag(task) && !shouldShowStatusDisplay(task)">
              <KiwiTag size="mini" :type="getCompletionTagType(task)" effect="dark" class="completion-tag">
                {{ getCompletionTagText(task) }}
              </KiwiTag>
            </div>
          </div>
        </div>

        <div class="task-edit-form" v-if="editingTaskId === task.id">
          <div class="edit-form-container">
            <div class="edit-form-row">
              <label class="edit-label">{{ $t('todo.task') }}:</label>
              <KiwiInput v-model="editingTask.title" :placeholder="$t('todo.enterTaskTitle')" class="edit-input" />
            </div>
            <div class="edit-form-row">
              <label class="edit-label">{{ $t('todo.description') }}:</label>
              <KiwiInput v-model="editingTask.description" type="textarea" :rows="2" :placeholder="$t('todo.enterTaskDescription')" class="edit-input" />
            </div>
            <div class="edit-form-row edit-points-row">
              <div class="edit-points-group">
                <div class="edit-points-item">
                  <label class="edit-label">{{ $t('todo.successPoints') }}:</label>
                  <KiwiInput v-model.number="editingTask.successPoints" type="number" min="1" max="100" class="edit-number-input" />
                </div>
                <div class="edit-points-item">
                  <label class="edit-label">{{ $t('todo.failPoints') }}:</label>
                  <KiwiInput v-model.number="editingTask.failPoints" type="number" min="-100" max="0" class="edit-number-input" />
                </div>
              </div>
            </div>
            <div class="edit-form-row">
              <label class="edit-label">{{ $t('todo.frequency') }}:</label>
              <div class="kiwi-select-wrapper edit-select">
                <select v-model="editingTask.frequency" class="kiwi-select">
                  <option value="once">{{ $t('todo.freqOnce') }}</option>
                  <option value="daily">{{ $t('todo.freqDaily') }}</option>
                  <option value="weekly">{{ $t('todo.freqWeekly') }}</option>
                  <option value="monthly">{{ $t('todo.freqMonthly') }}</option>
                  <option value="custom">{{ $t('todo.customDays') }}</option>
                </select>
                <i class="el-icon-arrow-down select-arrow"></i>
              </div>
            </div>
            <div class="edit-form-row" v-if="editingTask.frequency === 'custom'">
              <label class="edit-label">{{ $t('todo.everyNDays') }}:</label>
              <KiwiInput v-model.number="editingTask.customDays" type="number" min="2" max="365" class="edit-number-input" />
            </div>
          </div>
        </div>

        <div class="task-actions">
          <div v-if="editingTaskId === task.id" class="edit-actions">
            <KiwiButton type="primary" size="mini" icon="el-icon-check" @click="onSaveEdit(task.id)" class="action-btn"></KiwiButton>
            <KiwiButton size="mini" icon="el-icon-close" @click="onCancelEdit" class="action-btn"></KiwiButton>
          </div>

          <div v-else class="normal-actions">
            <div v-if="shouldShowStatusActions(task)" class="status-actions">
              <KiwiButton type="success" size="small" icon="el-icon-check" circle @click="onComplete(task.id, 'success')" class="status-btn"></KiwiButton>
              <KiwiButton type="danger" size="small" icon="el-icon-close" circle @click="onComplete(task.id, 'fail')" class="status-btn"></KiwiButton>
            </div>

            <div v-else-if="task.status !== 'pending'" class="status-display">
              <KiwiTag :type="task.status === 'success' ? 'success' : 'danger'" class="status-tag">
                {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
              </KiwiTag>
            </div>

            <div v-if="shouldShowResetAction(task)" class="reset-actions">
              <KiwiButton type="warning" size="mini" icon="el-icon-refresh" circle @click="onResetStatus(task.id)" :title="$t('todo.taskStatusReset')" class="reset-btn"></KiwiButton>
            </div>

            <div class="manage-actions">
              <KiwiButton type="primary" size="mini" icon="el-icon-edit" circle @click="onStartEdit(task)" class="manage-btn"></KiwiButton>
              <KiwiButton type="danger" size="mini" icon="el-icon-delete" circle @click="handleDelete(task.id)" class="manage-btn"></KiwiButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tasks.length === 0" class="no-tasks">
      <div class="empty-state">
        <i class="el-icon-document-remove empty-icon"></i>
        <p class="empty-text">{{ emptyDescription }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiInput from '@/components/ui/KiwiInput.vue'
import KiwiTag from '@/components/ui/KiwiTag.vue'

export default {
  name: 'TaskList',
  components: { KiwiButton, KiwiInput, KiwiTag },
  props: {
    tasks: { type: Array, required: true },
    editingTaskId: { type: [Number, String, null], default: null },
    editingTask: { type: Object, required: true },
    emptyDescription: { type: String, default: '' },
    getTaskStatusClass: { type: Function, required: true },
    getFrequencyText: { type: Function, required: true },
    shouldShowDoneTag: { type: Function, required: true },
    shouldShowStatusDisplay: { type: Function, required: true },
    getCompletionTagType: { type: Function, required: true },
    getCompletionTagText: { type: Function, required: true },
    shouldShowStatusActions: { type: Function, required: true },
    shouldShowResetAction: { type: Function, required: true },
    onComplete: { type: Function, required: true },
    onStartEdit: { type: Function, required: true },
    onSaveEdit: { type: Function, required: true },
    onCancelEdit: { type: Function, required: true },
    onDelete: { type: Function, required: true },
    onResetStatus: { type: Function, required: true }
  },
  methods: {
    handleDelete(id) {
      if (confirm(this.$t('todo.confirmDeleteTask'))) {
        this.onDelete(id)
      }
    }
  }
}
</script>

<style scoped>
/* Custom Select Styles */
.kiwi-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.kiwi-select {
  width: 100%;
  height: 32px;
  padding: 0 30px 0 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color-light);
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
  transition: border-color .2s;
}

.kiwi-select:hover {
  border-color: var(--text-secondary);
}

.kiwi-select:focus {
  border-color: var(--color-primary);
}

.select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-placeholder);
  pointer-events: none;
  font-size: 12px;
}

/* Task Card Glassmorphism */
.task-card {
  background: transparent; /* Transparent for cyberpunk theme */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.1); /* Subtle hover effect */
}

@media (prefers-color-scheme: dark) {
  .task-card {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .task-card:hover {
    background: rgba(255, 255, 255, 0.05);
  }
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
