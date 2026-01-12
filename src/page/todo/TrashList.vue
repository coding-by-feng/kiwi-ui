<template>
  <div class="trash-tab">
    <!-- Header with stats and clear button -->
    <div class="trash-header" v-if="trashedTasks.length > 0">
      <div class="stats-summary">
        <div class="stat-item stat-count">
          <i class="el-icon-delete"></i>
          <span class="stat-value">{{ trashedTasks.length }}</span>
          <span class="stat-label">{{ trashedTasks.length === 1 ? $t('todo.item') : $t('todo.items') }}</span>
        </div>
      </div>
      <button class="clear-all-btn" @click="onClearTrash">
        <i class="el-icon-delete"></i>
        <span class="btn-text">{{ $t('todo.clearAll') }}</span>
      </button>
    </div>

    <!-- Task list -->
    <div v-if="trashedTasks.length > 0" class="trash-tasks">
      <transition-group name="task-list" tag="div">
        <div
          v-for="task in trashedTasks"
          :key="`trash-${task.id}-${task.deletedDate || task.originalDate || Date.now()}`"
          class="trash-card"
        >
          <!-- Status indicator bar (deleted = danger) -->
          <div class="status-bar deleted"></div>

          <div class="card-content">
            <!-- Left: Task info -->
            <div class="task-info">
              <div class="task-header">
                <span class="status-icon deleted">
                  <i class="el-icon-delete"></i>
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
                <div class="meta-item date" v-if="task.originalDate">
                  <i class="el-icon-date"></i>
                  <span>{{ formatDate(task.originalDate) }}</span>
                </div>
                <div class="meta-item deleted-date" v-if="task.deletedDate">
                  <i class="el-icon-time"></i>
                  <span>{{ formatDate(task.deletedDate) }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="task-actions">
              <button
                class="action-btn restore-btn"
                @click="onRestore(task.id)"
                :title="$t('todo.restoreToOriginal')"
              >
                <i class="el-icon-refresh-left"></i>
                <span class="btn-text">{{ $t('todo.restore') }}</span>
              </button>
              <button
                class="action-btn delete-btn"
                @click="handleDelete(task.id)"
                :title="$t('todo.permanentlyDelete')"
              >
                <i class="el-icon-close"></i>
              </button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <i class="el-icon-delete"></i>
        <div class="empty-decoration"></div>
      </div>
      <h4 class="empty-title">{{ $t('todo.noTrashItems') }}</h4>
      <p class="empty-subtitle">{{ $t('todo.trashEmptyHint') || 'Deleted tasks will appear here' }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrashList',
  props: {
    trashedTasks: { type: Array, required: true },
    formatDate: { type: Function, required: true },
    onRestoreTask: { type: Function, required: true },
    onPermanentlyDeleteTask: { type: Function, required: true },
    onClearTrashClick: { type: Function, required: true }
  },
  methods: {
    onRestore(id) { this.onRestoreTask && this.onRestoreTask(id) },
    onDelete(id) { this.onPermanentlyDeleteTask && this.onPermanentlyDeleteTask(id) },
    onClearTrash() { this.onClearTrashClick && this.onClearTrashClick() },
    handleDelete(id) {
      if (confirm(this.$t('todo.permanentlyDeleteConfirm'))) {
        this.onDelete(id)
      }
    }
  }
}
</script>

<style scoped>
/* Trash Tab Layout */
.trash-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

/* Header Section */
.trash-header {
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

.stat-count i {
  color: var(--color-danger);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Clear All Button */
.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(var(--color-danger-rgb), 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-all-btn:hover {
  background: var(--color-danger);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--color-danger-rgb), 0.3);
}

/* Trash Tasks Container */
.trash-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Trash Card */
.trash-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.trash-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
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

.status-bar.deleted {
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

.status-icon.deleted {
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

.meta-item.date i,
.meta-item.deleted-date i {
  font-size: 14px;
}

.meta-item.date i {
  color: var(--color-info);
}

.meta-item.deleted-date i {
  color: var(--color-warning);
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
  background: rgba(var(--color-success-rgb), 0.1);
  border-color: var(--color-success);
  color: var(--color-success);
}

.restore-btn:hover {
  background: var(--color-success);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.3);
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
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .trash-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .stats-summary {
    justify-content: center;
  }

  .clear-all-btn {
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
  .trash-tab {
    gap: 16px;
  }

  .trash-header {
    padding: 14px 16px;
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
  .trash-header {
    padding: 12px;
  }

  .stat-item {
    padding: 6px 8px;
  }

  .stat-value {
    font-size: 14px;
  }

  .trash-card {
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
  .trash-tab {
    gap: 12px;
    padding: 0;
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

  .clear-all-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>
