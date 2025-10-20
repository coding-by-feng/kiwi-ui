<template>
  <div class="task-filter-section">
    <div class="filter-controls">
      <div class="filter-group">
        <span class="filter-label">Status Filter:</span>
        <el-radio-group :value="taskFilter" size="small" class="filter-radio-group" @input="$emit('update:taskFilter', $event)">
          <el-radio-button label="all">All</el-radio-button>
          <el-radio-button label="pending">Pending</el-radio-button>
          <el-radio-button label="completed">Completed</el-radio-button>
          <el-radio-button label="done">Done (Non-Daily)</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-group">
        <span class="filter-label">Frequency Filter:</span>
        <el-select :value="frequencyFilter" placeholder="All Frequencies" size="small" class="frequency-filter-select" @input="$emit('update:frequencyFilter', $event)">
          <el-option label="All" value="all"></el-option>
          <el-option label="One-time" value="once"></el-option>
          <el-option label="Daily" value="daily"></el-option>
          <el-option label="Weekly" value="weekly"></el-option>
          <el-option label="Monthly" value="monthly"></el-option>
          <el-option label="Custom" value="custom"></el-option>
        </el-select>
      </div>
      <div class="filter-group">
        <el-button type="warning" size="small" icon="el-icon-refresh-left" @click="$emit('reset-all')">
          Reset All to Pending
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

