<template>
  <div class="task-input">
    <el-form :model="newTask" class="task-form" label-position="top">
      <div class="form-row form-row-inline align-end">
        <el-form-item :label="$t('todo.task')" class="flex-1 mr-8">
          <el-input
            v-model="newTask.title"
            :placeholder="$t('todo.enterTaskTitle')"
            @keyup.enter.native="handleAdd"
            class="w-100"
          />
        </el-form-item>
        <div class="add-btn-container">
          <el-button type="primary" :disabled="!canAdd" icon="el-icon-plus" @click="handleAdd">{{ $t('todo.addTask') }}</el-button>
        </div>
      </div>

      <div class="form-row">
        <el-form-item :label="$t('todo.description')">
          <el-input
            v-model="newTask.description"
            type="textarea"
            :rows="2"
            :placeholder="$t('todo.enterTaskDescription')"
            class="w-100"
          />
        </el-form-item>
      </div>

      <div class="form-row form-row-inline">
        <el-form-item :label="$t('todo.successPoints')" class="mr-8">
          <el-input-number v-model="newTask.successPoints" :min="1" :max="100" size="small" />
        </el-form-item>
        <el-form-item :label="$t('todo.failPoints')">
          <el-input-number v-model="newTask.failPoints" :min="-100" :max="0" size="small" />
        </el-form-item>
      </div>

      <div class="form-row form-row-inline">
        <el-form-item :label="$t('todo.frequency')" class="mr-8">
          <el-select v-model="newTask.frequency" class="w-100" size="small">
            <el-option label="One-time" value="once" />
            <el-option label="Daily" value="daily" />
            <el-option label="Weekly" value="weekly" />
            <el-option label="Monthly" value="monthly" />
            <el-option label="Custom Days" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="newTask.frequency === 'custom'" :label="$t('todo.everyNDays')">
          <el-input-number v-model="newTask.customDays" :min="2" :max="365" size="small" />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'TaskInput',
  props: {
    newTask: { type: Object, required: true },
    onAdd: { type: Function, required: true }
  },
  computed: {
    canAdd() {
      return !!(this.newTask && this.newTask.title && this.newTask.title.trim())
    }
  },
  methods: {
    handleAdd() {
      if (!this.canAdd) return
      // Delegate to parent handler which persists and resets newTask
      this.onAdd && this.onAdd()
    }
  }
}
</script>

<style scoped>
.task-input {
  padding: 8px 0;
}
.task-form {
  width: 100%;
}
.w-100 { width: 100%; }
.mr-8 { margin-right: 8px; }
.form-row { margin-bottom: 8px; }
.form-row-inline { display: flex; flex-wrap: wrap; align-items: flex-end; }
.align-end { align-items: flex-end; }
.flex-1 { flex: 1 1 auto; min-width: 220px; }
.add-btn-container { align-self: flex-end; }

/* Responsive: stack button under input on narrow screens */
@media (max-width: 600px) {
  .form-row-inline { flex-direction: column; align-items: stretch; }
  .add-btn-container { margin-top: 8px; }
}
</style>
