<template>
  <div class="analytics-tab">
    <div class="analytics-controls">
      <KiwiRadioGroup :value="chartType" @input="$emit('update:chartType', $event)" class="responsive-radio-group">
        <KiwiRadioButton label="bar" class="chart-option">
          <i class="el-icon-s-data"></i>
          <span class="option-text">{{ $t('todo.barChart') }}</span>
        </KiwiRadioButton>
        <KiwiRadioButton label="line" class="chart-option">
          <i class="el-icon-s-marketing"></i>
          <span class="option-text">{{ $t('todo.lineChart') }}</span>
        </KiwiRadioButton>
        <KiwiRadioButton label="doughnut" class="chart-option">
          <i class="el-icon-pie-chart"></i>
          <span class="option-text">{{ $t('todo.donutChart') }}</span>
        </KiwiRadioButton>
      </KiwiRadioGroup>
    </div>

    <div class="chart-container">
      <canvas ref="chartCanvas" class="responsive-chart"></canvas>
    </div>

    <div class="monthly-summary">
      <div class="summary-card responsive-summary-card enhanced-summary">
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
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'
import KiwiRadioGroup from '@/components/ui/KiwiRadioGroup.vue'
import KiwiRadioButton from '@/components/ui/KiwiRadioButton.vue'

export default {
  name: 'AnalyticsPanel',
  components: { KiwiRadioGroup, KiwiRadioButton },
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
  computed: {
    // Get theme-aware colors from CSS variables
    chartColors() {
      const style = getComputedStyle(document.documentElement)
      return {
        primary: style.getPropertyValue('--color-primary').trim() || '#00ffff',
        success: style.getPropertyValue('--color-success').trim() || '#00ff88',
        warning: style.getPropertyValue('--color-warning').trim() || '#ffcc00',
        danger: style.getPropertyValue('--color-danger').trim() || '#ff3366',
        info: style.getPropertyValue('--color-info').trim() || '#00ccff',
        secondary: style.getPropertyValue('--color-secondary').trim() || '#ff00ff',
        textPrimary: style.getPropertyValue('--text-primary').trim() || '#ffffff',
        textSecondary: style.getPropertyValue('--text-secondary').trim() || 'rgba(255,255,255,0.7)',
        borderColor: style.getPropertyValue('--border-color-light').trim() || 'rgba(0,255,255,0.15)'
      }
    }
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
      const colors = this.chartColors

      // Theme-aware gradient for bar/line charts
      const gradient = ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, colors.primary)
      gradient.addColorStop(1, colors.secondary)

      // Doughnut/pie colors using theme palette
      const doughnutColors = [
        colors.success,
        colors.primary,
        colors.warning,
        colors.danger,
        colors.info,
        colors.secondary
      ]

      const config = {
        type: this.chartType,
        data: {
          labels: this.monthlyData.labels,
          datasets: [{
            label: this.$t('todo.monthlyPoints') || 'Monthly Points',
            data: this.monthlyData.data,
            backgroundColor: this.chartType === 'doughnut' ? doughnutColors : gradient,
            borderColor: this.chartType === 'doughnut' ? doughnutColors : colors.primary,
            borderWidth: this.chartType === 'line' ? 3 : 1,
            borderRadius: this.chartType === 'bar' ? 8 : 0,
            tension: 0.4,
            fill: this.chartType === 'line',
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: this.chartType === 'doughnut',
              position: 'bottom',
              labels: {
                color: colors.textPrimary,
                padding: 16,
                font: { size: 12, weight: '500' },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(18, 18, 26, 0.95)',
              titleColor: colors.textPrimary,
              bodyColor: colors.textSecondary,
              borderColor: colors.borderColor,
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              displayColors: true,
              boxPadding: 6
            }
          },
          scales: this.chartType !== 'doughnut' ? {
            x: {
              grid: {
                color: colors.borderColor,
                drawBorder: false
              },
              ticks: {
                color: colors.textSecondary,
                font: { size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: colors.borderColor,
                drawBorder: false
              },
              ticks: {
                color: colors.textSecondary,
                font: { size: 11 },
                padding: 8
              }
            }
          } : {}
        }
      }
      try { this.chart = new Chart(ctx, config) } catch (e) { console.error('Chart creation failed:', e) }
    }
  }
}
</script>

<style lang="scss" scoped>
.analytics-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Chart type selector
.analytics-controls {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.responsive-radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.chart-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;

  &:hover {
    background: var(--bg-highlight);
    color: var(--text-primary);
    border-color: var(--color-primary);
  }

  i {
    font-size: 16px;
  }
}

// Chart container
.chart-container {
  position: relative;
  width: 100%;
  min-height: 300px;
  max-height: 400px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
}

.responsive-chart {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

// Monthly summary section
.monthly-summary {
  margin-top: 8px;
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--card-border-radius);
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 18px;
}

.summary-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

// Stats grid
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  transition: var(--transition-normal);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }
}

.stat-visual {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  &.points-icon {
    background: rgba(255, 204, 0, 0.15);
    color: var(--color-warning);
  }

  &.completed-icon {
    background: rgba(0, 255, 136, 0.15);
    color: var(--color-success);
  }

  &.success-icon {
    background: rgba(0, 255, 255, 0.15);
    color: var(--color-primary);
  }
}

// Circular progress charts
.stat-circle {
  width: 56px;
  height: 56px;
}

.circular-chart {
  display: block;
  width: 100%;
  height: 100%;

  .circle-bg {
    fill: none;
    stroke: var(--border-color-light);
    stroke-width: 3.5;
  }

  .circle {
    fill: none;
    stroke-width: 3.5;
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    animation: chart-progress 1s ease-out forwards;
  }

  &.gold .circle {
    stroke: var(--color-warning);
  }

  &.green .circle {
    stroke: var(--color-success);
  }

  &.blue .circle {
    stroke: var(--color-primary);
  }
}

@keyframes chart-progress {
  from {
    stroke-dasharray: 0 100;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

// Responsive adjustments
@media (max-width: 768px) {
  .chart-container {
    min-height: 250px;
    padding: 12px;
  }

  .responsive-chart {
    min-height: 230px;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-circle {
    width: 48px;
    height: 48px;
  }

  .stat-value {
    font-size: 20px;
  }

  .option-text {
    display: none;
  }

  .chart-option {
    padding: 10px 14px;

    i {
      margin: 0;
    }
  }
}

@media (max-width: 480px) {
  .analytics-tab {
    gap: 16px;
  }

  .chart-container {
    min-height: 220px;
    padding: 8px;
  }

  .responsive-chart {
    min-height: 200px;
  }

  .summary-card {
    padding: 14px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .stat-circle {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 18px;
  }
}
</style>
