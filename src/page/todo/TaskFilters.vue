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
.task-filter-section {
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.frequency-filter-select {
  min-width: 140px;
}

/* Custom Select Styles */
.kiwi-select-wrapper {
  position: relative;
  display: inline-block;
}

.kiwi-select {
  width: 100%;
  height: 32px; /* Smaller height for filters */
  padding: 0 30px 0 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color-light);
  background-color: transparent; /* Transparent for cyberpunk theme */
  color: var(--text-primary);
  font-size: 13px;
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
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-placeholder);
  pointer-events: none;
  font-size: 12px;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .filter-group {
    width: 100%;
    justify-content: flex-start;
  }
  .frequency-filter-select {
    width: 100%;
  }
}
</style>
