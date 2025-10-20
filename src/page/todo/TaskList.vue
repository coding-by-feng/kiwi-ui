<template>
  <div class="tasks-list">
    <el-card v-for="task in tasks" :key="`task-${task.id}-${task.dateKey || 'default'}`" class="task-card responsive-task-card" :class="getTaskStatusClass(task.status)">
      <div class="task-content">
        <div class="task-info" v-if="editingTaskId !== task.id">
          <h4 class="task-title">{{ task.title }}</h4>
          <p v-if="task.description" class="task-description">{{ task.description }}</p>
          <div class="task-meta">
            <div class="task-points">
              <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
              <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
            </div>
            <div class="task-frequency" v-if="task.frequency && task.frequency !== 'once'">
              <el-tag size="mini" type="info" effect="plain">
                <i class="el-icon-refresh"></i>
                <span class="frequency-text">{{ getFrequencyText(task.frequency, task.customDays) }}</span>
              </el-tag>
            </div>
            <div class="task-completion-status" v-if="shouldShowDoneTag(task) && !shouldShowStatusDisplay(task)">
              <el-tag size="mini" :type="getCompletionTagType(task)" effect="dark" class="completion-tag">
                {{ getCompletionTagText(task) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="task-edit-form" v-if="editingTaskId === task.id">
          <div class="edit-form-container">
            <div class="edit-form-row">
              <label class="edit-label">{{ $t('todo.task') }}:</label>
              <el-input v-model="editingTask.title" :placeholder="$t('todo.enterTaskTitle')" class="edit-input" />
            </div>
            <div class="edit-form-row">
              <label class="edit-label">{{ $t('todo.description') }}:</label>
              <el-input v-model="editingTask.description" type="textarea" :rows="2" :placeholder="$t('todo.enterTaskDescription')" class="edit-input" />
            </div>
            <div class="edit-form-row edit-points-row">
              <div class="edit-points-group">
                <div class="edit-points-item">
                  <label class="edit-label">{{ $t('todo.successPoints') }}:</label>
                  <el-input-number v-model="editingTask.successPoints" :min="1" :max="100" size="small" class="edit-number-input" />
                </div>
                <div class="edit-points-item">
                  <label class="edit-label">{{ $t('todo.failPoints') }}:</label>
                  <el-input-number v-model="editingTask.failPoints" :min="-100" :max="0" size="small" class="edit-number-input" />
                </div>
              </div>
            </div>
            <div class="edit-form-row">
              <label class="edit-label">{{ $t('todo.frequency') }}:</label>
              <el-select v-model="editingTask.frequency" class="edit-select">
                <el-option label="One-time" value="once"></el-option>
                <el-option label="Daily" value="daily"></el-option>
                <el-option label="Weekly" value="weekly"></el-option>
                <el-option label="Monthly" value="monthly"></el-option>
                <el-option label="Custom Days" value="custom"></el-option>
              </el-select>
            </div>
            <div class="edit-form-row" v-if="editingTask.frequency === 'custom'">
              <label class="edit-label">{{ $t('todo.everyNDays') }}:</label>
              <el-input-number v-model="editingTask.customDays" :min="2" :max="365" size="small" class="edit-number-input" />
            </div>
          </div>
        </div>

        <div class="task-actions">
          <div v-if="editingTaskId === task.id" class="edit-actions">
            <el-button type="primary" size="mini" icon="el-icon-check" @click="onSaveEdit(task.id)" class="action-btn"></el-button>
            <el-button size="mini" icon="el-icon-close" @click="onCancelEdit" class="action-btn"></el-button>
          </div>

          <div v-else class="normal-actions">
            <div v-if="shouldShowStatusActions(task)" class="status-actions">
              <el-button type="success" size="small" icon="el-icon-check" circle @click="onComplete(task.id, 'success')" class="status-btn"></el-button>
              <el-button type="danger" size="small" icon="el-icon-close" circle @click="onComplete(task.id, 'fail')" class="status-btn"></el-button>
            </div>

            <div v-else-if="task.status !== 'pending'" class="status-display">
              <el-tag :type="task.status === 'success' ? 'success' : 'danger'" class="status-tag">
                {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
              </el-tag>
            </div>

            <div v-if="shouldShowResetAction(task)" class="reset-actions">
              <el-button type="warning" size="mini" icon="el-icon-refresh" circle @click="onResetStatus(task.id)" :title="'Reset to pending'" class="reset-btn"></el-button>
            </div>

            <div class="manage-actions">
              <el-button type="primary" size="mini" icon="el-icon-edit" circle @click="onStartEdit(task)" class="manage-btn"></el-button>
              <el-popconfirm :title="$t('todo.confirmDeleteTask')" @confirm="onDelete(task.id)">
                <el-button slot="reference" type="danger" size="mini" icon="el-icon-delete" circle class="manage-btn"></el-button>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <div v-if="tasks.length === 0" class="no-tasks">
      <el-empty :description="emptyDescription" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskList',
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
  }
}
</script>

