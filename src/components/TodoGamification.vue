<template>
  <div class="todo-gamification">
    <el-card class="main-card">
      <div slot="header" class="header">
        <h2>{{ $t('todo.title') }}</h2>
        <div class="total-points">
          {{ $t('todo.totalPoints') }}: <span class="points-badge">{{ totalPoints }}</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" type="card">
        <!-- Daily Tasks Tab -->
        <el-tab-pane :label="$t('todo.todayTasks')" name="today">
          <div class="task-input-section">
            <el-form :model="newTask" inline>
              <el-form-item :label="$t('todo.task')">
                <el-input
                  v-model="newTask.title"
                  :placeholder="$t('todo.enterTaskDescription')"
                  style="width: 300px"
                  @keyup.enter.native="addTask"
                />
              </el-form-item>
              <el-form-item :label="$t('todo.successPoints')">
                <el-input-number
                  v-model="newTask.successPoints"
                  :min="1"
                  :max="100"
                  size="small"
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item :label="$t('todo.failPoints')">
                <el-input-number
                  v-model="newTask.failPoints"
                  :min="-100"
                  :max="0"
                  size="small"
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addTask">{{ $t('todo.addTask') }}</el-button>
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
                <div class="task-info" v-if="editingTaskId !== task.id">
                  <h4>{{ task.title }}</h4>
                  <div class="task-points">
                    <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                    <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
                  </div>
                </div>

                <!-- Edit Form -->
                <div class="task-edit-form" v-if="editingTaskId === task.id">
                  <div class="edit-form-container">
                    <div class="edit-form-row">
                      <label class="edit-label">{{ $t('todo.task') }}:</label>
                      <el-input
                        v-model="editingTask.title"
                        :placeholder="$t('todo.enterTaskDescription')"
                        class="edit-title-input"
                      />
                    </div>
                    <div class="edit-form-row">
                      <div class="points-group">
                        <div class="points-item">
                          <label class="edit-label">{{ $t('todo.successPoints') }}:</label>
                          <el-input-number
                            v-model="editingTask.successPoints"
                            :min="1"
                            :max="100"
                            size="small"
                            class="edit-points-input"
                          />
                        </div>
                        <div class="points-item">
                          <label class="edit-label">{{ $t('todo.failPoints') }}:</label>
                          <el-input-number
                            v-model="editingTask.failPoints"
                            :min="-100"
                            :max="0"
                            size="small"
                            class="edit-points-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="task-actions">
                  <!-- Editing Actions -->
                  <div v-if="editingTaskId === task.id" class="edit-actions">
                    <el-button
                      type="primary"
                      size="mini"
                      icon="el-icon-check"
                      @click="saveTaskEdit(task.id)"
                    >
                      {{ $t('common.save') }}
                    </el-button>
                    <el-button
                      size="mini"
                      icon="el-icon-close"
                      @click="cancelTaskEdit"
                    >
                      {{ $t('common.cancel') }}
                    </el-button>
                  </div>

                  <!-- Normal Actions -->
                  <div v-else class="normal-actions">
                    <!-- Task Status Actions -->
                    <div v-if="task.status === 'pending'" class="status-actions">
                      <el-button
                        type="success"
                        size="small"
                        icon="el-icon-check"
                        circle
                        @click="completeTask(task.id, 'success')"
                      >
                      </el-button>
                      <el-button
                        type="danger"
                        size="small"
                        icon="el-icon-close"
                        circle
                        @click="completeTask(task.id, 'fail')"
                      >
                      </el-button>
                    </div>
                    <el-tag v-else :type="task.status === 'success' ? 'success' : 'danger'">
                      {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
                    </el-tag>

                    <!-- Edit/Delete Actions -->
                    <div class="manage-actions">
                      <el-button
                        v-if="task.status === 'pending'"
                        type="primary"
                        size="mini"
                        icon="el-icon-edit"
                        circle
                        @click="startTaskEdit(task)"
                      >
                      </el-button>
                      <el-popconfirm
                        :title="$t('todo.confirmDeleteTask')"
                        @confirm="deleteTask(task.id)"
                      >
                        <el-button
                          slot="reference"
                          type="danger"
                          size="mini"
                          icon="el-icon-delete"
                          circle
                        >
                        </el-button>
                      </el-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>

            <div v-if="todayTasks.length === 0" class="no-tasks">
              <el-empty :description="$t('todo.noTasksToday')" />
            </div>
          </div>
        </el-tab-pane>

        <!-- History Tab -->
        <el-tab-pane :label="$t('todo.history')" name="history">
          <div class="history-controls">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              :placeholder="$t('todo.selectDate')"
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
                    {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
                  </el-tag>

                  <!-- Delete button for history -->
                  <el-popconfirm
                    :title="$t('todo.confirmDeleteTask')"
                    @confirm="deleteHistoryTask(task.id, selectedDate)"
                  >
                    <el-button
                      slot="reference"
                      type="danger"
                      size="mini"
                      icon="el-icon-delete"
                      circle
                      style="margin-left: 10px"
                    >
                    </el-button>
                  </el-popconfirm>
                </div>
              </div>
            </el-card>
          </div>
          <div v-else class="no-data">
            <el-empty :description="$t('todo.noTasksForDate')" />
          </div>
        </el-tab-pane>

        <!-- Analytics Tab -->
        <el-tab-pane :label="$t('todo.analytics')" name="analytics">
          <div class="analytics-controls">
            <el-radio-group v-model="chartType" @change="updateChart">
              <el-radio-button label="bar">{{ $t('todo.barChart') }}</el-radio-button>
              <el-radio-button label="line">{{ $t('todo.lineChart') }}</el-radio-button>
              <el-radio-button label="doughnut">{{ $t('todo.donutChart') }}</el-radio-button>
            </el-radio-group>
          </div>

          <div class="chart-container">
            <canvas ref="chartCanvas" width="400" height="200"></canvas>
          </div>

          <div class="monthly-summary">
            <el-card class="summary-card">
              <h3>{{ $t('todo.monthlySummary') }}</h3>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">{{ $t('todo.totalPoints') }}:</span>
                  <span class="stat-value">{{ currentMonthPoints }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ $t('todo.tasksCompleted') }}:</span>
                  <span class="stat-value">{{ currentMonthCompleted }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ $t('todo.successRate') }}:</span>
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
      chart: null,
      // Add reactive trigger for total points refresh
      refreshTrigger: 0,
      // Edit functionality
      editingTaskId: null,
      editingTask: {
        title: '',
        successPoints: 10,
        failPoints: -5
      }
    }
  },
  computed: {
    todayTasks() {
      // Add refreshTrigger dependency to force reactivity
      this.refreshTrigger
      const today = this.formatDateKey(new Date())
      return this.getTasksForDate(today)
    },
    totalPoints() {
      // Add refreshTrigger dependency to force reactivity
      this.refreshTrigger
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
      // Force reactivity refresh
      this.refreshTrigger++
      this.$message.success(this.$t('todo.taskAddedSuccess'))
    },
    completeTask(taskId, status) {
      const dateKey = this.formatDateKey(new Date())
      const tasks = this.getTasksForDate(dateKey)
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex !== -1) {
        tasks[taskIndex].status = status
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(tasks))

        const points = status === 'success' ? tasks[taskIndex].successPoints : tasks[taskIndex].failPoints

        // Force reactivity refresh for total points
        this.refreshTrigger++

        this.$message({
          message: this.$t('todo.taskStatusUpdate', {
            status: this.$t(`todo.${status}`),
            points: points > 0 ? '+' + points : points
          }),
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
    },
    startTaskEdit(task) {
      this.editingTaskId = task.id
      this.editingTask = {
        title: task.title,
        successPoints: task.successPoints,
        failPoints: task.failPoints
      }
    },
    saveTaskEdit(taskId) {
      if (!this.editingTask.title.trim()) {
        this.$message.warning(this.$t('todo.taskTitleRequired'))
        return
      }

      const dateKey = this.formatDateKey(new Date())
      const tasks = this.getTasksForDate(dateKey)
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex !== -1) {
        tasks[taskIndex].title = this.editingTask.title
        tasks[taskIndex].successPoints = this.editingTask.successPoints
        tasks[taskIndex].failPoints = this.editingTask.failPoints

        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(tasks))

        this.editingTaskId = null
        this.refreshTrigger++

        this.$message.success(this.$t('todo.taskUpdatedSuccess'))
      }
    },
    cancelTaskEdit() {
      this.editingTaskId = null
      this.editingTask = {
        title: '',
        successPoints: 10,
        failPoints: -5
      }
    },
    deleteTask(taskId) {
      const dateKey = this.formatDateKey(new Date())
      const tasks = this.getTasksForDate(dateKey)
      const filteredTasks = tasks.filter(t => t.id !== taskId)

      localStorage.setItem(`todo_${dateKey}`, JSON.stringify(filteredTasks))

      this.refreshTrigger++
      this.$message.success(this.$t('todo.taskDeletedSuccess'))
    },
    deleteHistoryTask(taskId, date) {
      const dateKey = this.formatDateKey(date)
      const tasks = this.getTasksForDate(dateKey)
      const filteredTasks = tasks.filter(t => t.id !== taskId)

      localStorage.setItem(`todo_${dateKey}`, JSON.stringify(filteredTasks))

      // Refresh history display
      this.loadHistoryForDate()
      this.refreshTrigger++

      this.$message.success(this.$t('todo.taskDeletedSuccess'))
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
  min-height: 60px;
}

.task-edit-form {
  flex: 1;
  margin-right: 20px;
}

.edit-form-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.edit-form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}

.edit-title-input {
  width: 100%;
}

.points-group {
  display: flex;
  gap: 20px;
}

.points-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-points-input {
  width: 100%;
}

.edit-points-input >>> .el-input__inner {
  text-align: center;
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
  align-items: center;
  gap: 10px;
}

.normal-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-actions {
  display: flex;
  gap: 8px;
}

.manage-actions {
  display: flex;
  gap: 5px;
}

.edit-actions {
  display: flex;
  gap: 8px;
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

  .task-content {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    min-height: auto;
  }

  .normal-actions {
    justify-content: space-between;
    align-items: center;
  }

  .task-edit-form .el-form {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .task-edit-form .el-input,
  .task-edit-form .el-input-number {
    width: 100% !important;
  }

  .edit-actions,
  .manage-actions,
  .status-actions {
    justify-content: center;
  }

  .points-group {
    flex-direction: column;
    gap: 12px;
  }

  .edit-form-container {
    gap: 12px;
    padding: 12px;
  }
}
</style>
