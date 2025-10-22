<template>
  <div class="task-input">
    <el-form :model="newTask" class="task-form" label-position="top">
      <div class="form-row form-row-inline align-end">
        <el-form-item class="flex-1 mr-8">
          <el-input
            v-model="newTask.title"
            :placeholder="$t('todo.enterTaskTitle')"
            @keyup.enter.native="handleAdd"
            class="w-100"
          />
        </el-form-item>
        <!-- Moved Add button to the bottom action row -->
      </div>

      <div class="form-row">
        <el-form-item>
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
        <el-form-item class="mr-8">
          <el-input-number
            v-model="newTask.successPoints"
            :min="1"
            :max="100"
            :step="1"
            size="small"
            class="numeric-input"
            :placeholder="$t('todo.successPoints')"
          />
        </el-form-item>
        <el-form-item>
          <el-input-number
            v-model="newTask.failPoints"
            :min="-100"
            :max="0"
            :step="1"
            size="small"
            class="numeric-input"
            :placeholder="$t('todo.failPoints')"
          />
        </el-form-item>
      </div>

      <div class="form-row form-row-inline">
        <el-form-item class="mr-8">
          <el-select v-model="newTask.frequency" class="w-100" size="small" :placeholder="$t('todo.frequency')">
            <el-option label="One-time" value="once" />
            <el-option label="Daily" value="daily" />
            <el-option label="Weekly" value="weekly" />
            <el-option label="Monthly" value="monthly" />
            <el-option label="Custom Days" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="newTask.frequency === 'custom'">
          <el-input
            v-model.number="newTask.customDays"
            type="number"
            size="small"
            :min="2"
            :max="365"
            :placeholder="$t('todo.everyNDays')"
            class="numeric-input"
          />
        </el-form-item>
      </div>

      <!-- Bottom action row -->
      <div class="form-row form-actions">
        <el-button type="primary" :disabled="!canAdd" icon="el-icon-plus" @click="handleAdd">{{ $t('todo.addTask') }}</el-button>
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
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}
.task-form { width: 100%; }
.w-100 { width: 100%; }
.mr-8 { margin-right: 12px; }
.form-row { margin-bottom: 12px; }
.form-row-inline { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.align-end { align-items: flex-end; }
.flex-1 { flex: 1 1 auto; min-width: 260px; }

/* New bottom action row alignment */
.form-actions { display: flex; justify-content: flex-end; }

/* Tighter spacing between form items */
::v-deep .el-form-item { margin-bottom: 8px; margin-left: 0; }

/* Numeric input consistent width */
.numeric-input { width: 140px; }

/* Inputs and selects */
::v-deep .el-input__inner,
::v-deep .el-select .el-input__inner {
  height: 36px;
  border-radius: 8px;
  border-color: #e4e7ed;
  padding: 8px 12px;
  transition: all .2s ease;
}
::v-deep .el-input__inner:focus,
::v-deep .el-select .el-input.is-focus .el-input__inner,
::v-deep .el-select .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

/* Textarea */
::v-deep .el-textarea__inner {
  border-radius: 10px;
  border-color: #e4e7ed;
  padding: 10px 12px;
  line-height: 1.5;
  transition: all .2s ease;
}
::v-deep .el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

/* Primary button alignment and style */
::v-deep .el-button--primary {
  border-radius: 8px;
  height: 36px;
  display: inline-flex;
  align-items: center;
}

/* Make inline form items align neatly at the bottom */
.form-row-inline ::v-deep .el-form-item { margin-bottom: 0; }

/* Responsive: stack button under input on narrow screens */
@media (max-width: 600px) {
  .form-row-inline { flex-direction: column; align-items: stretch; gap: 8px; }
  .flex-1 { min-width: 100%; }
  .numeric-input { width: 100%; }
}
</style>
