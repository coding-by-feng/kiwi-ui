<template>
  <div class="todo-gamification">
    <el-card class="main-card">
      <div slot="header" class="header">
        <h2>To-Do</h2>
        <div class="total-points">
          Total Points: <span class="points-badge">{{ totalPoints }}</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" type="card">
        <!-- Daily Tasks Tab -->
        <el-tab-pane label="Today's Tasks" name="today">
          <div class="task-input-section">
            <el-form :model="newTask" inline>
              <el-form-item label="Task">
                <el-input
                  v-model="newTask.title"
                  placeholder="Enter task description"
                  style="width: 300px"
                  @keyup.enter.native="addTask"
                />
              </el-form-item>
              <el-form-item label="Success Points">
                <el-input-number
                  v-model="newTask.successPoints"
                  :min="1"
                  :max="100"
                  size="small"
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item label="Fail Points">
                <el-input-number
                  v-model="newTask.failPoints"
                  :min="-100"
                  :max="0"
                  size="small"
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addTask">Add Task</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="tasks-list">
            <el-card
              v-for="task in todayTasks"
              :key="task.id"
              class="task-card"
              :class="getTaskStatusClass(task.status)"
            >
              <div class="task-content">
                <div class="task-info">
                  <h4>{{ task.title }}</h4>
                  <div class="task-points">
                    <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                    <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
                  </div>
                </div>
                <div class="task-actions">
                  <el-button
                    v-if="task.status === 'pending'"
                    type="success"
                    size="small"
                    icon="el-icon-check"
                    circle
                    @click="completeTask(task.id, 'success')"
                  >
                  </el-button>
                  <el-button
                    v-if="task.status === 'pending'"
                    type="danger"
                    size="small"
                    icon="el-icon-close"
                    circle
                    @click="completeTask(task.id, 'fail')"
                  >
                  </el-button>
                  <el-tag v-else :type="task.status === 'success' ? 'success' : 'danger'">
                    {{ task.status === 'success' ? '✅ Completed' : '❌ Failed' }}
                  </el-tag>
                </div>
              </div>
            </el-card>

            <div v-if="todayTasks.length === 0" class="no-tasks">
              <el-empty description="No tasks for today. Add your first task above!" />
            </div>
          </div>
        </el-tab-pane>

        <!-- History Tab -->
        <el-tab-pane label="History" name="history">
          <div class="history-controls">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="Select date"
              @change="loadHistoryForDate"
            />
          </div>

          <div v-if="historyTasks.length > 0" class="history-tasks">
            <h3>{{ formatDate(selectedDate) }}</h3>
            <el-card
              v-for="task in historyTasks"
              :key="task.id"
              class="task-card"
              :class="getTaskStatusClass(task.status)"
            >
              <div class="task-content">
                <div class="task-info">
                  <h4>{{ task.title }}</h4>
                  <div class="task-points">
                    <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                    <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
                  </div>
                </div>
                <div class="task-status">
                  <el-tag :type="task.status === 'success' ? 'success' : 'danger'">
                    {{ task.status === 'success' ? '✅ Completed' : '❌ Failed' }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </div>
          <div v-else class="no-data">
            <el-empty description="No tasks found for selected date" />
          </div>
        </el-tab-pane>

        <!-- Analytics Tab -->
        <el-tab-pane label="Analytics" name="analytics">
          <div class="analytics-controls">
            <el-radio-group v-model="chartType" @change="updateChart">
              <el-radio-button label="bar">📊 Bar Chart</el-radio-button>
              <el-radio-button label="line">📈 Line Chart</el-radio-button>
              <el-radio-button label="doughnut">🍩 Donut Chart</el-radio-button>
            </el-radio-group>
          </div>

          <div class="chart-container">
            <canvas ref="chartCanvas" width="400" height="200"></canvas>
          </div>

          <div class="monthly-summary">
            <el-card class="summary-card">
              <h3>Monthly Summary</h3>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Points:</span>
                  <span class="stat-value">{{ currentMonthPoints }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Tasks Completed:</span>
                  <span class="stat-value">{{ currentMonthCompleted }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Success Rate:</span>
                  <span class="stat-value">{{ successRate }}%</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'TodoGamification',
  data() {
    return {
      activeTab: 'today',
      newTask: {
        title: '',
        successPoints: 10,
        failPoints: -5
      },
      selectedDate: new Date(),
      historyTasks: [],
      chartType: 'bar',
      chart: null
    }
  },
  computed: {
    todayTasks() {
      const today = this.formatDateKey(new Date())
      return this.getTasksForDate(today)
    },
    totalPoints() {
      const allTasks = this.getAllTasks()
      return allTasks.reduce((total, task) => {
        if (task.status === 'success') return total + task.successPoints
        if (task.status === 'fail') return total + task.failPoints
        return total
      }, 0)
    },
    currentMonthPoints() {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const allTasks = this.getAllTasks()

      return allTasks.filter(task => {
        const taskDate = new Date(task.date)
        return taskDate.getMonth() === currentMonth &&
               taskDate.getFullYear() === currentYear &&
               task.status !== 'pending'
      }).reduce((total, task) => {
        return total + (task.status === 'success' ? task.successPoints : task.failPoints)
      }, 0)
    },
    currentMonthCompleted() {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const allTasks = this.getAllTasks()

      return allTasks.filter(task => {
        const taskDate = new Date(task.date)
        return taskDate.getMonth() === currentMonth &&
               taskDate.getFullYear() === currentYear &&
               task.status === 'success'
      }).length
    },
    successRate() {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const allTasks = this.getAllTasks()

      const monthTasks = allTasks.filter(task => {
        const taskDate = new Date(task.date)
        return taskDate.getMonth() === currentMonth &&
               taskDate.getFullYear() === currentYear &&
               task.status !== 'pending'
      })

      if (monthTasks.length === 0) return 0

      const successTasks = monthTasks.filter(task => task.status === 'success').length
      return Math.round((successTasks / monthTasks.length) * 100)
    }
  },
  mounted() {
    this.loadHistoryForDate()
    // Delay chart initialization to ensure DOM is ready
    this.$nextTick(() => {
      if (this.activeTab === 'analytics') {
        setTimeout(() => {
          this.updateChart()
        }, 100)
      }
    })
  },
  watch: {
    activeTab(newTab) {
      // Update chart when switching to analytics tab
      if (newTab === 'analytics') {
        this.$nextTick(() => {
          setTimeout(() => {
            this.updateChart()
          }, 100)
        })
      }
    }
  },
  methods: {
    addTask() {
      if (!this.newTask.title.trim()) return

      const task = {
        id: Date.now(),
        title: this.newTask.title,
        successPoints: this.newTask.successPoints,
        failPoints: this.newTask.failPoints,
        status: 'pending',
        date: new Date().toISOString(),
        dateKey: this.formatDateKey(new Date())
      }

      this.saveTask(task)
      this.newTask.title = ''
      this.$message.success('Task added successfully!')
    },
    completeTask(taskId, status) {
      const dateKey = this.formatDateKey(new Date())
      const tasks = this.getTasksForDate(dateKey)
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex !== -1) {
        tasks[taskIndex].status = status
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(tasks))

        const points = status === 'success' ? tasks[taskIndex].successPoints : tasks[taskIndex].failPoints
        this.$message({
          message: `Task ${status}! ${points > 0 ? '+' : ''}${points} points`,
          type: status === 'success' ? 'success' : 'warning'
        })
      }
    },
    saveTask(task) {
      const dateKey = task.dateKey
      const existingTasks = this.getTasksForDate(dateKey)
      existingTasks.push(task)
      localStorage.setItem(`todo_${dateKey}`, JSON.stringify(existingTasks))
    },
    getTasksForDate(dateKey) {
      const stored = localStorage.getItem(`todo_${dateKey}`)
      return stored ? JSON.parse(stored) : []
    },
    getAllTasks() {
      const tasks = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('todo_')) {
          const dateTasks = JSON.parse(localStorage.getItem(key))
          tasks.push(...dateTasks)
        }
      }
      return tasks
    },
    loadHistoryForDate() {
      const dateKey = this.formatDateKey(this.selectedDate)
      this.historyTasks = this.getTasksForDate(dateKey)
    },
    formatDateKey(date) {
      return date.toISOString().split('T')[0]
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    getTaskStatusClass(status) {
      return {
        'task-success': status === 'success',
        'task-fail': status === 'fail',
        'task-pending': status === 'pending'
      }
    },
    updateChart() {
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }

      // Ensure canvas exists and is visible
      if (!this.$refs.chartCanvas || this.activeTab !== 'analytics') {
        return
      }

      const ctx = this.$refs.chartCanvas.getContext('2d')
      const monthlyData = this.getMonthlyData()

      const config = {
        type: this.chartType,
        data: {
          labels: monthlyData.labels,
          datasets: [{
            label: 'Monthly Points',
            data: monthlyData.data,
            backgroundColor: this.chartType === 'doughnut' ? [
              '#67C23A', '#409EFF', '#E6A23C', '#F56C6C', '#909399', '#6f42c1'
            ] : '#409EFF',
            borderColor: '#409EFF',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: this.chartType === 'doughnut'
            }
          },
          scales: this.chartType !== 'doughnut' ? {
            y: {
              beginAtZero: true
            }
          } : {}
        }
      }

      try {
        this.chart = new Chart(ctx, config)
      } catch (error) {
        console.error('Chart creation failed:', error)
      }
    },
    getMonthlyData() {
      const monthlyPoints = {}
      const allTasks = this.getAllTasks()

      // Get last 6 months
      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        months.push(monthKey)
        monthlyPoints[monthKey] = 0
      }

      allTasks.forEach(task => {
        if (task.status === 'pending') return
        const taskDate = new Date(task.date)
        const monthKey = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}`

        if (monthlyPoints.hasOwnProperty(monthKey)) {
          monthlyPoints[monthKey] += task.status === 'success' ? task.successPoints : task.failPoints
        }
      })

      return {
        labels: months.map(m => {
          const [year, month] = m.split('-')
          return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }),
        data: months.map(m => monthlyPoints[m])
      }
    }
  }
}
</script>

<style scoped>
.todo-gamification {
  padding: 16px;
  max-width: 100%;
  background: transparent;
  height: 100%;
}

.main-card {
  min-height: calc(100vh - 120px);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  color: #409EFF;
}

.points-badge {
  background: linear-gradient(45deg, #409EFF, #67C23A);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 18px;
}

.task-input-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.task-success {
  border-left: 4px solid #67C23A;
  background: #f0f9ff;
}

.task-fail {
  border-left: 4px solid #F56C6C;
  background: #fef5f5;
}

.task-pending {
  border-left: 4px solid #E6A23C;
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.task-points {
  display: flex;
  gap: 8px;
}

.task-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.history-controls {
  margin-bottom: 20px;
}

.history-tasks h3 {
  color: #409EFF;
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  padding: 40px;
}

.no-tasks {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.analytics-controls {
  margin-bottom: 30px;
  text-align: center;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.monthly-summary {
  margin-top: 30px;
}

.summary-card h3 {
  color: #409EFF;
  margin-bottom: 20px;
  text-align: center;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 150px;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  color: #409EFF;
  font-size: 24px;
  font-weight: bold;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .todo-gamification {
    padding: 8px;
  }

  .task-input-section {
    padding: 15px;
  }

  .task-input-section .el-form {
    flex-direction: column;
    align-items: stretch;
  }

  .task-input-section .el-form-item {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .task-input-section .el-input {
    width: 100% !important;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
