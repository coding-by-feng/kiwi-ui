<template>
  <div class="trash-tab">
    <div class="trash-controls">
      <el-button v-if="trashedTasks.length > 0" type="danger" size="small" icon="el-icon-delete" @click="onClearTrash" class="clear-trash-btn">
        <span class="btn-text">Clear All</span>
      </el-button>
    </div>

    <div v-if="trashedTasks.length > 0" class="trash-tasks">
      <el-card v-for="task in trashedTasks" :key="`trash-${task.id}-${task.deletedDate || task.originalDate || Date.now()}`" class="task-card trash-card responsive-trash-card">
        <div class="task-content">
          <div class="task-info">
            <h4 class="task-title">{{ task.title }}</h4>
            <p v-if="task.description" class="task-description">{{ task.description }}</p>
            <div class="task-details">
              <div class="task-points">
                <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
              </div>
              <div class="task-dates">
                <el-tag size="mini" type="info" class="date-tag">
                  <span class="date-label">Original:</span>
                  <span class="date-value">{{ formatDate(task.originalDate) }}</span>
                </el-tag>
                <el-tag size="mini" type="warning" class="date-tag">
                  <span class="date-label">Deleted:</span>
                  <span class="date-value">{{ formatDate(task.deletedDate) }}</span>
                </el-tag>
              </div>
            </div>
          </div>
          <div class="trash-actions">
            <el-tooltip content="Restore to original date" placement="top">
              <el-button type="success" size="mini" icon="el-icon-refresh-right" circle @click="onRestore(task.id)" class="trash-action-btn"></el-button>
            </el-tooltip>
            <el-tooltip content="Permanently delete" placement="top">
              <el-popconfirm title="Permanently delete this task? This cannot be undone." @confirm="onDelete(task.id)">
                <template v-slot:reference>
                  <el-button type="danger" size="mini" icon="el-icon-close" circle class="trash-action-btn"></el-button>
                </template>
              </el-popconfirm>
            </el-tooltip>
          </div>
        </div>
      </el-card>
    </div>
    <div v-else class="no-data">
      <el-empty description="No items in trash" />
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
    onClearTrash() { this.onClearTrashClick && this.onClearTrashClick() }
  }
}
</script>
