<template>
  <div class="analytics-tab">
    <div class="analytics-controls">
      <el-radio-group :value="chartType" @input="$emit('update:chartType', $event)" class="responsive-radio-group">
        <el-radio-button label="bar" class="chart-option">
          <i class="el-icon-s-data"></i>
          <span class="option-text">{{ $t('todo.barChart') }}</span>
        </el-radio-button>
        <el-radio-button label="line" class="chart-option">
          <i class="el-icon-s-marketing"></i>
          <span class="option-text">{{ $t('todo.lineChart') }}</span>
        </el-radio-button>
        <el-radio-button label="doughnut" class="chart-option">
          <i class="el-icon-pie-chart"></i>
          <span class="option-text">{{ $t('todo.donutChart') }}</span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="chart-container">
      <canvas ref="chartCanvas" class="responsive-chart"></canvas>
    </div>

    <div class="monthly-summary">
      <el-card class="summary-card responsive-summary-card enhanced-summary">
        <div class="summary-header">
          <div class="summary-icon">
            <i class="el-icon-data-analysis"></i>
          </div>
          <h3 class="summary-title">{{ $t('todo.monthlySummary') }}</h3>
        </div>
        <div class="summary-stats enhanced-stats">
          <div class="stat-item enhanced-stat-item">
            <div class="stat-visual">
              <div class="stat-icon enhanced-icon points-icon">
                <i class="el-icon-trophy"></i>
              </div>
              <div class="stat-circle">
                <svg viewBox="0 0 36 36" class="circular-chart gold">
                  <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="circle" :stroke-dasharray="`${Math.max(0, Math.min(currentMonthPoints / 100, 100))}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
            <div class="stat-content enhanced-content">
              <span class="stat-label">{{ $t('todo.totalPoints') }}</span>
              <span class="stat-value enhanced-value">{{ currentMonthPoints }}</span>
              <span class="stat-subtitle">this month</span>
            </div>
          </div>
          <div class="stat-item enhanced-stat-item">
            <div class="stat-visual">
              <div class="stat-icon enhanced-icon completed-icon">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-circle">
                <svg viewBox="0 0 36 36" class="circular-chart green">
                  <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="circle" :stroke-dasharray="`${Math.max(0, Math.min(currentMonthCompleted / 10, 100))}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
            <div class="stat-content enhanced-content">
              <span class="stat-label">{{ $t('todo.tasksCompleted') }}</span>
              <span class="stat-value enhanced-value">{{ currentMonthCompleted }}</span>
              <span class="stat-subtitle">tasks done</span>
            </div>
          </div>
          <div class="stat-item enhanced-stat-item">
            <div class="stat-visual">
              <div class="stat-icon enhanced-icon success-icon">
                <i class="el-icon-data-analysis"></i>
              </div>
              <div class="stat-circle">
                <svg viewBox="0 0 36 36" class="circular-chart blue">
                  <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="circle" :stroke-dasharray="`${successRate}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
            <div class="stat-content enhanced-content">
              <span class="stat-label">{{ $t('todo.successRate') }}</span>
              <span class="stat-value enhanced-value">{{ successRate }}%</span>
              <span class="stat-subtitle">success rate</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'AnalyticsPanel',
  props: {
    chartType: { type: String, required: true },
    monthlyData: { type: Object, required: true },
    currentMonthPoints: { type: Number, required: true },
    currentMonthCompleted: { type: Number, required: true },
    successRate: { type: Number, required: true }
  },
  data() {
    return { chart: null }
  },
  watch: {
    chartType() { this.renderChart() },
    monthlyData: { deep: true, handler() { this.renderChart() } }
  },
  mounted() {
    this.$nextTick(() => this.renderChart())
  },
  beforeDestroy() {
    if (this.chart) { this.chart.destroy(); this.chart = null }
  },
  methods: {
    renderChart() {
      if (this.chart) { this.chart.destroy(); this.chart = null }
      const canvas = this.$refs.chartCanvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const config = {
        type: this.chartType,
        data: {
          labels: this.monthlyData.labels,
          datasets: [{
            label: 'Monthly Points',
            data: this.monthlyData.data,
            backgroundColor: this.chartType === 'doughnut' ? ['#67C23A', '#409EFF', '#E6A23C', '#F56C6C', '#909399', '#6f42c1'] : '#409EFF',
            borderColor: '#409EFF',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: this.chartType === 'doughnut' } },
          scales: this.chartType !== 'doughnut' ? { y: { beginAtZero: true } } : {}
        }
      }
      try { this.chart = new Chart(ctx, config) } catch (e) { console.error('Chart creation failed:', e) }
    }
  }
}
</script>

