<template>
  <div class="tasks-list">
    <transition-group name="task-list" tag="div" class="task-list-container">
      <div
        v-for="task in tasks"
        :key="`task-${task.id}-${task.dateKey || 'default'}`"
        class="task-card"
        :class="[getTaskStatusClass(task.status), { 'is-editing': editingTaskId === task.id }]"
      >
        <!-- Status indicator bar -->
        <div class="status-bar" :class="task.status"></div>

        <div class="card-content">
          <!-- Task info (when not editing) -->
          <div class="task-info" v-if="editingTaskId !== task.id">
            <div class="task-header">
              <span class="status-icon" :class="task.status" v-if="task.status !== 'pending'">
                <i :class="task.status === 'success' ? 'el-icon-check' : 'el-icon-close'"></i>
              </span>
              <span class="status-icon pending" v-else>
                <i class="el-icon-more"></i>
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
              <div class="meta-item frequency" v-if="task.frequency && task.frequency !== 'once'">
                <i class="el-icon-refresh"></i>
                <span>{{ getFrequencyText(task.frequency, task.customDays) }}</span>
              </div>
              <div class="meta-item completion" v-if="shouldShowDoneTag(task) && !shouldShowStatusDisplay(task)">
                <span :class="['completion-badge', getCompletionTagType(task)]">
                  {{ getCompletionTagText(task) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Edit form -->
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

          <!-- Actions -->
          <div class="task-actions">
            <!-- Edit mode actions -->
            <div v-if="editingTaskId === task.id" class="edit-actions">
              <button class="action-btn save-btn" @click="onSaveEdit(task.id)" :title="$t('todo.save')">
                <i class="el-icon-check"></i>
                <span class="btn-text">{{ $t('todo.save') }}</span>
              </button>
              <button class="action-btn cancel-btn" @click="onCancelEdit" :title="$t('todo.cancel')">
                <i class="el-icon-close"></i>
              </button>
            </div>

            <!-- Normal mode actions -->
            <div v-else class="normal-actions">
              <!-- Complete/Fail actions for pending tasks -->
              <div v-if="shouldShowStatusActions(task)" class="status-actions">
                <button class="action-btn complete-btn" @click="onComplete(task.id, 'success')" :title="$t('todo.markComplete')">
                  <i class="el-icon-check"></i>
                </button>
                <button class="action-btn fail-btn" @click="onComplete(task.id, 'fail')" :title="$t('todo.markFailed')">
                  <i class="el-icon-close"></i>
                </button>
              </div>

              <!-- Status display for completed tasks -->
              <div v-else-if="task.status !== 'pending'" class="status-display">
                <span class="status-badge" :class="task.status">
                  {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
                </span>
              </div>

              <!-- Reset action -->
              <button
                v-if="shouldShowResetAction(task)"
                class="action-btn reset-btn"
                @click="onResetStatus(task.id)"
                :title="$t('todo.taskStatusReset')"
              >
                <i class="el-icon-refresh"></i>
              </button>

              <!-- Manage actions -->
              <div class="manage-actions">
                <button class="action-btn edit-btn" @click="onStartEdit(task)" :title="$t('todo.edit')">
                  <i class="el-icon-edit"></i>
                </button>
                <button class="action-btn delete-btn" @click="handleDelete(task.id)" :title="$t('todo.delete')">
                  <i class="el-icon-delete"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- Empty state -->
    <div v-if="tasks.length === 0" class="empty-state">
      <div class="empty-illustration">
        <i class="el-icon-document-remove"></i>
        <div class="empty-decoration"></div>
      </div>
      <h4 class="empty-title">{{ emptyDescription }}</h4>
      <p class="empty-subtitle">{{ $t('todo.addTaskHint') || 'Add a new task to get started' }}</p>
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
/* Task List Container */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Task Card */
.task-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--border-color);
}

.task-card.is-editing {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light-9);
}

.task-card.status-success:hover {
  border-color: rgba(var(--color-success-rgb), 0.4);
}

.task-card.status-failed:hover,
.task-card.status-fail:hover {
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

.status-bar.pending {
  background: var(--gradient-primary);
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

.status-icon.pending {
  background: rgba(var(--color-primary-rgb), 0.15);
  color: var(--color-primary);
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
  flex-wrap: wrap;
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

.meta-item.frequency i {
  font-size: 14px;
  color: var(--color-info);
}

.completion-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.completion-badge.success {
  background: rgba(var(--color-success-rgb), 0.15);
  color: var(--color-success);
}

.completion-badge.danger {
  background: rgba(var(--color-danger-rgb), 0.15);
  color: var(--color-danger);
}

.completion-badge.warning {
  background: rgba(var(--color-warning-rgb), 0.15);
  color: var(--color-warning);
}

/* Task Actions */
.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.normal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-actions {
  display: flex;
  gap: 6px;
}

.manage-actions {
  display: flex;
  gap: 6px;
}

/* Action Buttons */
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

/* Complete button */
.complete-btn {
  width: 34px;
  padding: 0;
  background: rgba(var(--color-success-rgb), 0.1);
  border-color: var(--color-success);
  color: var(--color-success);
}

.complete-btn:hover {
  background: var(--color-success);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.3);
}

/* Fail button */
.fail-btn {
  width: 34px;
  padding: 0;
  background: rgba(var(--color-danger-rgb), 0.1);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.fail-btn:hover {
  background: var(--color-danger);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-danger-rgb), 0.3);
}

/* Reset button */
.reset-btn {
  width: 34px;
  padding: 0;
  background: rgba(var(--color-warning-rgb), 0.1);
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.reset-btn:hover {
  background: var(--color-warning);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-warning-rgb), 0.3);
}

/* Edit button */
.edit-btn {
  width: 34px;
  padding: 0;
  background: rgba(var(--color-primary-rgb), 0.1);
  border-color: transparent;
  color: var(--color-primary);
}

.edit-btn:hover {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

/* Delete button */
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

/* Save button */
.save-btn {
  background: rgba(var(--color-primary-rgb), 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.save-btn:hover {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

/* Cancel button */
.cancel-btn {
  width: 34px;
  padding: 0;
  background: rgba(var(--color-danger-rgb), 0.1);
  border-color: transparent;
  color: var(--color-danger);
}

.cancel-btn:hover {
  background: var(--color-danger);
  color: white;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(var(--color-success-rgb), 0.15);
  color: var(--color-success);
}

.status-badge.failed,
.status-badge.fail {
  background: rgba(var(--color-danger-rgb), 0.15);
  color: var(--color-danger);
}

/* Edit form styling */
.task-edit-form {
  flex: 1;
  min-width: 0;
}

.edit-form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.edit-input {
  width: 100%;
}

.edit-number-input {
  width: 100%;
  max-width: 120px;
}

.edit-select {
  width: 100%;
  max-width: 180px;
}

.edit-points-row {
  flex-direction: column;
}

.edit-points-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.edit-points-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

/* Custom Select Styles */
.kiwi-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.kiwi-select {
  width: 100%;
  height: 36px;
  padding: 0 30px 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color-light);
  background-color: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.kiwi-select:hover {
  border-color: var(--color-primary);
}

.kiwi-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light-9);
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-placeholder);
  pointer-events: none;
  font-size: 12px;
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
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

/* Responsive Styles */
@media (max-width: 768px) {
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
  .tasks-list {
    gap: 10px;
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

  .complete-btn,
  .fail-btn,
  .reset-btn,
  .edit-btn,
  .delete-btn,
  .cancel-btn,
  .save-btn {
    width: 32px;
    padding: 0;
  }

  .edit-points-group {
    flex-direction: column;
    gap: 12px;
  }

  .edit-points-item {
    width: 100%;
  }

  .edit-number-input,
  .edit-select {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .card-content {
    padding: 12px 12px 12px 16px;
    gap: 12px;
  }

  .task-card {
    border-radius: var(--radius-md);
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
  .tasks-list {
    gap: 8px;
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

  .normal-actions {
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
