<template>
  <div class="task-filter-section">
    <div class="filter-controls">
      <div class="filter-group">
        <span class="filter-label">{{ $t('todo.statusFilter') }}</span>
        <el-radio-group :value="taskFilter" size="small" class="filter-radio-group" @input="$emit('update:taskFilter', $event)">
          <el-radio-button label="all">{{ $t('common.all') }}</el-radio-button>
          <el-radio-button label="pending">{{ $t('todo.pendingLabel') }}</el-radio-button>
          <el-radio-button label="completed">{{ $t('todo.completed') }}</el-radio-button>
          <el-radio-button label="done">{{ $t('todo.doneNonDaily') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-group">
        <span class="filter-label">{{ $t('todo.frequencyFilter') }}</span>
        <el-select :value="frequencyFilter" :placeholder="$t('todo.allFrequencies')" size="small" class="frequency-filter-select" @input="$emit('update:frequencyFilter', $event)">
          <el-option :label="$t('common.all')" value="all"></el-option>
          <el-option :label="$t('todo.freqOnce')" value="once"></el-option>
          <el-option :label="$t('todo.freqDaily')" value="daily"></el-option>
          <el-option :label="$t('todo.freqWeekly')" value="weekly"></el-option>
          <el-option :label="$t('todo.freqMonthly')" value="monthly"></el-option>
          <el-option :label="$t('todo.customDays')" value="custom"></el-option>
        </el-select>
      </div>
      <div class="filter-group">
        <el-button type="warning" size="small" icon="el-icon-refresh-left" @click="$emit('reset-all')">
          {{ $t('todo.resetAllToPending') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskFilters',
  props: {
    taskFilter: { type: String, required: true },
    frequencyFilter: { type: String, required: true }
  }
}
</script>
