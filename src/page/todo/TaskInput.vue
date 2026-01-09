<template>
  <div class="task-input">
    <div class="task-form">
      <!-- Task Title -->
      <div class="form-row">
        <label class="field-label">
          <i class="el-icon-edit"></i>
          {{ $t('todo.taskTitleLabel') }}
          <i class="el-icon-info hint-toggle-btn" @click="toggleHint('title')"></i>
        </label>
        <div class="form-item">
          <KiwiInput
            v-model="newTask.title"
            :placeholder="$t('todo.enterTaskTitle')"
            @keyup.enter.native="handleAdd"
            class="w-100"
          />
        </div>
        <p class="field-hint" :class="{ 'hint-visible': visibleHints.title }">{{ $t('todo.taskTitleHint') }}</p>
      </div>

      <!-- Task Description -->
      <div class="form-row">
        <label class="field-label">
          <i class="el-icon-document"></i>
          {{ $t('todo.taskDescLabel') }}
          <i class="el-icon-info hint-toggle-btn" @click="toggleHint('description')"></i>
        </label>
        <div class="form-item">
          <KiwiInput
            v-model="newTask.description"
            type="textarea"
            :rows="2"
            :placeholder="$t('todo.enterTaskDescription')"
            class="w-100"
          />
        </div>
        <p class="field-hint" :class="{ 'hint-visible': visibleHints.description }">{{ $t('todo.taskDescHint') }}</p>
      </div>

      <!-- Points Section -->
      <div class="form-row">
        <label class="field-label">
          <i class="el-icon-star-on"></i>
          {{ $t('todo.pointsLabel') }}
          <i class="el-icon-info hint-toggle-btn" @click="toggleHint('points')"></i>
        </label>
        <div class="form-row-inline">
          <div class="form-item mr-8">
            <div class="points-field success-points">
              <span class="points-icon">+</span>
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
          </div>
          <div class="form-item">
            <div class="points-field fail-points">
              <span class="points-icon">-</span>
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
        </div>
        <p class="field-hint" :class="{ 'hint-visible': visibleHints.points }">{{ $t('todo.pointsHint') }}</p>
      </div>

      <!-- Frequency Section -->
      <div class="form-row">
        <label class="field-label">
          <i class="el-icon-time"></i>
          {{ $t('todo.frequencyLabel') }}
          <i class="el-icon-info hint-toggle-btn" @click="toggleHint('frequency')"></i>
        </label>
        <div class="form-row-inline">
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
        <p class="field-hint" :class="{ 'hint-visible': visibleHints.frequency }">{{ $t('todo.frequencyHint') }}</p>
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
  data() {
    return {
      visibleHints: {
        title: false,
        description: false,
        points: false,
        frequency: false
      }
    }
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
    },
    toggleHint(field) {
      this.visibleHints[field] = !this.visibleHints[field]
    }
  }
}
</script>

<style scoped>
.task-input {
  padding: 16px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.task-form { width: 100%; }
.w-100 { width: 100%; }
.mr-8 { margin-right: 12px; }
.form-row { margin-bottom: 16px; }
.form-row-inline { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.align-end { align-items: flex-end; }
.flex-1 { flex: 1 1 auto; min-width: 260px; }

/* Field labels */
.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.field-label i {
  color: var(--color-primary);
  font-size: 16px;
}

/* Field hints */
.field-hint {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Points field styling */
.points-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.points-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.success-points .points-icon {
  background: rgba(var(--color-success-rgb), 0.15);
  color: var(--color-success);
}
.fail-points .points-icon {
  background: rgba(var(--color-danger-rgb), 0.15);
  color: var(--color-danger);
}

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

/* Hint toggle button - hidden on larger screens */
.hint-toggle-btn {
  display: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 14px;
  margin-left: auto;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.hint-toggle-btn:hover {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.hint-toggle-btn:active {
  transform: scale(0.9);
}

/* Responsive: stack button under input on narrow screens */
@media (max-width: 600px) {
  .form-row-inline { flex-direction: column; align-items: stretch; gap: 8px; }
  .flex-1 { min-width: 100%; }
  .numeric-input { width: 100%; }

  /* Show hint toggle button on small screens */
  .hint-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  /* Hide hints by default on small screens */
  .field-hint {
    display: none;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(var(--color-primary-rgb), 0.08);
    border-radius: 8px;
    border-left: 3px solid var(--color-primary);
  }

  /* Show hints when toggled visible */
  .field-hint.hint-visible {
    display: block;
    animation: hint-fade-in 0.2s ease;
  }

  @keyframes hint-fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

@media (max-width: 480px) {
  .task-input {
    padding: 12px 14px;
  }

  .form-row {
    margin-bottom: 14px;
  }

  .field-label {
    font-size: 13px;
  }

  .mr-8 {
    margin-right: 8px;
  }
}

@media (max-width: 360px) {
  .task-input {
    padding: 10px 12px;
    border-radius: 10px;
  }

  .form-row {
    margin-bottom: 12px;
  }

  .field-label {
    font-size: 12px;
  }

  .field-label i {
    font-size: 14px;
  }

  .points-icon {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }
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
