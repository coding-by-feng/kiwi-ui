<template>
  <div class="trash-tab">
    <div class="trash-controls">
      <KiwiButton v-if="trashedTasks.length > 0" type="danger" size="small" icon="el-icon-delete" @click="onClearTrash" class="clear-trash-btn">
        <span class="btn-text">{{ $t('todo.clearAll') }}</span>
      </KiwiButton>
    </div>

    <div v-if="trashedTasks.length > 0" class="trash-tasks">
      <div v-for="task in trashedTasks" :key="`trash-${task.id}-${task.deletedDate || task.originalDate || Date.now()}`" class="task-card trash-card responsive-trash-card">
        <div class="task-content">
          <div class="task-info">
            <h4 class="task-title">{{ task.title }}</h4>
            <p v-if="task.description" class="task-description">{{ task.description }}</p>
            <div class="task-details">
              <div class="task-points">
                <KiwiTag size="mini" type="success">+{{ task.successPoints }}</KiwiTag>
                <KiwiTag size="mini" type="danger">{{ task.failPoints }}</KiwiTag>
              </div>
              <div class="task-dates">
                <KiwiTag size="mini" type="info" class="date-tag">
                  <span class="date-label">{{ $t('todo.originalDate') }}:</span>
                  <span class="date-value">{{ formatDate(task.originalDate) }}</span>
                </KiwiTag>
                <KiwiTag size="mini" type="warning" class="date-tag">
                  <span class="date-label">{{ $t('todo.deletedDate') }}:</span>
                  <span class="date-value">{{ formatDate(task.deletedDate) }}</span>
                </KiwiTag>
              </div>
            </div>
          </div>
          <div class="trash-actions">
            <KiwiButton type="success" size="mini" icon="el-icon-refresh-right" circle @click="onRestore(task.id)" class="trash-action-btn" :title="$t('todo.restoreToOriginal')"></KiwiButton>
            <KiwiButton type="danger" size="mini" icon="el-icon-close" circle @click="handleDelete(task.id)" class="trash-action-btn" :title="$t('todo.permanentlyDelete')"></KiwiButton>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      <div class="empty-state">
        <i class="el-icon-document-remove empty-icon"></i>
        <p class="empty-text">{{ $t('todo.noTrashItems') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiTag from '@/components/ui/KiwiTag.vue'

export default {
  name: 'TrashList',
  components: { KiwiButton, KiwiTag },
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
