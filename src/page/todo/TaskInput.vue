<template>
  <div class="task-input">
    <div class="task-form">
      <div class="form-row form-row-inline align-end">
        <div class="form-item flex-1 mr-8">
          <KiwiInput
            v-model="newTask.title"
            :placeholder="$t('todo.enterTaskTitle')"
            @keyup.enter.native="handleAdd"
            class="w-100"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-item">
          <KiwiInput
            v-model="newTask.description"
            type="textarea"
            :rows="2"
            :placeholder="$t('todo.enterTaskDescription')"
            class="w-100"
          />
        </div>
      </div>

      <div class="form-row form-row-inline">
        <div class="form-item mr-8">
          <KiwiInput
            v-model.number="newTask.successPoints"
            type="number"
            min="1"
            max="100"
            step="1"
            class="numeric-input"
            :placeholder="$t('todo.successPoints')"
          />
        </div>
        <div class="form-item">
          <KiwiInput
            v-model.number="newTask.failPoints"
            type="number"
            min="-100"
            max="0"
            step="1"
            class="numeric-input"
            :placeholder="$t('todo.failPoints')"
          />
        </div>
      </div>

      <div class="form-row form-row-inline">
        <div class="form-item mr-8">
          <div class="kiwi-select-wrapper w-100">
            <select v-model="newTask.frequency" class="kiwi-select">
              <option value="once">{{ $t('todo.freqOnce') }}</option>
              <option value="daily">{{ $t('todo.freqDaily') }}</option>
              <option value="weekly">{{ $t('todo.freqWeekly') }}</option>
              <option value="monthly">{{ $t('todo.freqMonthly') }}</option>
              <option value="custom">{{ $t('todo.customDays') }}</option>
            </select>
            <i class="el-icon-arrow-down select-arrow"></i>
          </div>
        </div>
        <div class="form-item" v-if="newTask.frequency === 'custom'">
          <KiwiInput
            v-model.number="newTask.customDays"
            type="number"
            min="2"
            max="365"
            :placeholder="$t('todo.everyNDays')"
            class="numeric-input"
          />
        </div>
      </div>

      <!-- Bottom action row -->
      <div class="form-row form-actions">
        <KiwiButton type="primary" :disabled="!canAdd" icon="el-icon-plus" @click="handleAdd">
          {{ $t('todo.addTask') }}
        </KiwiButton>
      </div>
    </div>
  </div>
</template>

<script>
import KiwiInput from '@/components/ui/KiwiInput.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'

export default {
  name: 'TaskInput',
  components: { KiwiInput, KiwiButton },
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
  background: transparent; /* Transparent for cyberpunk theme */
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
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
  border-color: var(--border-color);
  padding: 8px 12px;
  transition: all .2s ease;
  background-color: var(--bg-card);
  color: var(--text-primary);
}
::v-deep .el-input__inner:focus,
::v-deep .el-select .el-input.is-focus .el-input__inner,
::v-deep .el-select .el-input__inner:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--border-color-light);
}

/* Textarea */
::v-deep .el-textarea__inner {
  border-radius: 10px;
  border-color: var(--border-color);
  padding: 10px 12px;
  line-height: 1.5;
  transition: all .2s ease;
  background-color: var(--bg-card);
  color: var(--text-primary);
}
::v-deep .el-textarea__inner:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--border-color-light);
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

/* Custom Select Styles */
.kiwi-select-wrapper {
  position: relative;
  display: inline-block;
}

.kiwi-select {
  width: 100%;
  height: 40px;
  padding: 0 30px 0 15px;
  border-radius: 4px;
  border: 1px solid var(--border-color-light);
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
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
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-placeholder);
  pointer-events: none;
}
</style>
