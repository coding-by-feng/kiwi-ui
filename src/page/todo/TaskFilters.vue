<template>
  <div class="task-filter-section">
    <div class="filter-controls">
      <div class="filter-group">
        <span class="filter-label">{{ $t('todo.statusFilter') }}</span>
        <KiwiRadioGroup :value="taskFilter" @input="$emit('update:taskFilter', $event)">
          <KiwiRadioButton label="all">{{ $t('common.all') }}</KiwiRadioButton>
          <KiwiRadioButton label="pending">{{ $t('todo.pendingLabel') }}</KiwiRadioButton>
          <KiwiRadioButton label="completed">{{ $t('todo.completed') }}</KiwiRadioButton>
          <KiwiRadioButton label="done">{{ $t('todo.doneNonDaily') }}</KiwiRadioButton>
        </KiwiRadioGroup>
      </div>
      <div class="filter-group">
        <span class="filter-label">{{ $t('todo.frequencyFilter') }}</span>
        <div class="kiwi-select-wrapper frequency-filter-select">
          <select :value="frequencyFilter" class="kiwi-select" @change="$emit('update:frequencyFilter', $event.target.value)">
            <option value="all">{{ $t('common.all') }}</option>
            <option value="once">{{ $t('todo.freqOnce') }}</option>
            <option value="daily">{{ $t('todo.freqDaily') }}</option>
            <option value="weekly">{{ $t('todo.freqWeekly') }}</option>
            <option value="monthly">{{ $t('todo.freqMonthly') }}</option>
            <option value="custom">{{ $t('todo.customDays') }}</option>
          </select>
          <i class="el-icon-arrow-down select-arrow"></i>
        </div>
      </div>
      <div class="filter-group">
        <KiwiButton type="warning" size="small" icon="el-icon-refresh-left" @click="$emit('reset-all')">
          {{ $t('todo.resetAllToPending') }}
        </KiwiButton>
      </div>
    </div>
  </div>
</template>

<script>
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiRadioGroup from '@/components/ui/KiwiRadioGroup.vue'
import KiwiRadioButton from '@/components/ui/KiwiRadioButton.vue'

export default {
  name: 'TaskFilters',
  components: { KiwiButton, KiwiRadioGroup, KiwiRadioButton },
  props: {
    taskFilter: { type: String, required: true },
    frequencyFilter: { type: String, required: true }
  }
}
</script>

<style scoped>
/* Filter Section Container */
.task-filter-section {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color-light);
}

.filter-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.frequency-filter-select {
  min-width: 150px;
}

/* Custom Select Styles */
.kiwi-select-wrapper {
  position: relative;
  display: inline-block;
}

.kiwi-select {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color-light);
  background-color: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
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
  transition: color var(--transition-fast);
}

.kiwi-select-wrapper:hover .select-arrow {
  color: var(--color-primary);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .task-filter-section {
    padding: 14px 16px;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .filter-group {
    width: 100%;
    justify-content: flex-start;
  }

  .frequency-filter-select {
    width: 100%;
    flex: 1;
  }

  .filter-label {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .task-filter-section {
    padding: 12px 14px;
    border-radius: var(--radius-md);
  }

  .filter-controls {
    gap: 12px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .filter-label {
    font-size: 12px;
  }

  .kiwi-select {
    height: 34px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .task-filter-section {
    padding: 10px 12px;
  }

  .filter-label {
    font-size: 11px;
  }

  .kiwi-select {
    height: 32px;
  }
}
</style>
