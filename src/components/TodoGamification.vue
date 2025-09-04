<template>
  <div class="todo-gamification">
    <el-card class="main-card">
      <div slot="header" class="header">
        <h2 class="header-title">{{ $t('todo.title') }}</h2>
        <div class="header-controls">
          <div class="import-export-controls">
            <el-button
                type="primary"
                size="small"
                icon="el-icon-download"
                @click="exportTodoData"
                class="control-btn"
            >
              <span class="btn-text">Export</span>
            </el-button>
            <el-upload
                ref="importUpload"
                :show-file-list="false"
                :before-upload="importTodoData"
                accept=".json"
                action=""
            >
              <el-button
                  type="success"
                  size="small"
                  icon="el-icon-upload2"
                  class="control-btn"
              >
                <span class="btn-text">Import</span>
              </el-button>
            </el-upload>
          </div>
          <div class="total-points">
            <span class="points-label">{{ $t('todo.totalPoints') }}:</span>
            <span class="points-badge">{{ totalPoints }}</span>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" type="card" class="responsive-tabs">
        <!-- Daily Tasks Tab -->
        <el-tab-pane :label="$t('todo.todayTasks')" name="today">
          <div class="task-input-section">
            <el-form :model="newTask" class="responsive-form">
              <div class="form-row">
                <el-form-item :label="$t('todo.task')" class="form-item">
                  <el-input
                      v-model="newTask.title"
                      :placeholder="$t('todo.enterTaskTitle')"
                      @keyup.enter.native="addTask"
                      class="responsive-input"
                  />
                </el-form-item>
              </div>

              <div class="form-row">
                <el-form-item :label="$t('todo.description')" class="form-item full-width">
                  <el-input
                      v-model="newTask.description"
                      type="textarea"
                      :rows="2"
                      :placeholder="$t('todo.enterTaskDescription')"
                      class="responsive-textarea"
                  />
                </el-form-item>
              </div>

              <div class="form-row points-row">
                <el-form-item :label="$t('todo.successPoints')" class="form-item points-item">
                  <el-input-number
                      v-model="newTask.successPoints"
                      :min="1"
                      :max="100"
                      size="small"
                      class="responsive-number"
                  />
                </el-form-item>
                <el-form-item :label="$t('todo.failPoints')" class="form-item points-item">
                  <el-input-number
                      v-model="newTask.failPoints"
                      :min="-100"
                      :max="0"
                      size="small"
                      class="responsive-number"
                  />
                </el-form-item>
              </div>

              <div class="form-row frequency-row">
                <el-form-item :label="$t('todo.frequency')" class="form-item frequency-item">
                  <el-select v-model="newTask.frequency" :placeholder="$t('todo.selectFrequency')" class="responsive-select">
                    <el-option label="One-time" value="once"></el-option>
                    <el-option label="Daily" value="daily"></el-option>
                    <el-option label="Weekly" value="weekly"></el-option>
                    <el-option label="Monthly" value="monthly"></el-option>
                    <el-option label="Custom Days" value="custom"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item v-if="newTask.frequency === 'custom'" :label="$t('todo.everyNDays')" class="form-item custom-days-item">
                  <el-input-number
                      v-model="newTask.customDays"
                      :min="2"
                      :max="365"
                      size="small"
                      class="responsive-number-small"
                  />
                </el-form-item>
              </div>

              <div class="form-row submit-row">
                <el-form-item class="form-item">
                  <el-button type="primary" @click="addTask" class="add-task-btn">
                    <i class="el-icon-plus"></i>
                    <span>{{ $t('todo.addTask') }}</span>
                  </el-button>
                </el-form-item>
              </div>
            </el-form>
          </div>

          <!-- Task Filter Controls -->
          <div class="task-filter-section">
            <div class="filter-controls">
              <div class="filter-group">
                <span class="filter-label">Status Filter:</span>
                <el-radio-group v-model="taskFilter" size="small" class="filter-radio-group">
                  <el-radio-button label="all">All</el-radio-button>
                  <el-radio-button label="pending">Pending</el-radio-button>
                  <el-radio-button label="completed">Completed</el-radio-button>
                  <el-radio-button label="done">Done (Non-Daily)</el-radio-button>
                </el-radio-group>
              </div>
              <div class="filter-group">
                <span class="filter-label">Frequency Filter:</span>
                <el-select v-model="frequencyFilter" placeholder="All Frequencies" size="small" class="frequency-filter-select">
                  <el-option label="All" value="all"></el-option>
                  <el-option label="One-time" value="once"></el-option>
                  <el-option label="Daily" value="daily"></el-option>
                  <el-option label="Weekly" value="weekly"></el-option>
                  <el-option label="Monthly" value="monthly"></el-option>
                  <el-option label="Custom" value="custom"></el-option>
                </el-select>
              </div>
            </div>
          </div>

          <div class="tasks-list">
            <el-card
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-card responsive-task-card"
                :class="getTaskStatusClass(task.status)"
            >
              <div class="task-content">
                <div class="task-info" v-if="editingTaskId !== task.id">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p v-if="task.description" class="task-description">{{ task.description }}</p>
                  <div class="task-meta">
                    <div class="task-points">
                      <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                      <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
                    </div>
                    <div class="task-frequency" v-if="task.frequency && task.frequency !== 'once'">
                      <el-tag size="mini" type="info" effect="plain">
                        <i class="el-icon-refresh"></i>
                        <span class="frequency-text">{{ getFrequencyText(task.frequency, task.customDays) }}</span>
                      </el-tag>
                    </div>
                    <!-- Task Completion Status Tag for Non-Daily Tasks -->
                    <div class="task-completion-status" v-if="shouldShowDoneTag(task)">
                      <el-tag
                        size="mini"
                        :type="getCompletionTagType(task)"
                        effect="dark"
                        class="completion-tag"
                      >
                        {{ getCompletionTagText(task) }}
                      </el-tag>
                    </div>
                  </div>
                </div>

                <!-- Edit Form -->
                <div class="task-edit-form" v-if="editingTaskId === task.id">
                  <div class="edit-form-container">
                    <div class="edit-form-row">
                      <label class="edit-label">{{ $t('todo.task') }}:</label>
                      <el-input
                          v-model="editingTask.title"
                          :placeholder="$t('todo.enterTaskTitle')"
                          class="edit-input"
                      />
                    </div>
                    <div class="edit-form-row">
                      <label class="edit-label">{{ $t('todo.description') }}:</label>
                      <el-input
                          v-model="editingTask.description"
                          type="textarea"
                          :rows="2"
                          :placeholder="$t('todo.enterTaskDescription')"
                          class="edit-input"
                      />
                    </div>
                    <div class="edit-form-row edit-points-row">
                      <div class="edit-points-group">
                        <div class="edit-points-item">
                          <label class="edit-label">{{ $t('todo.successPoints') }}:</label>
                          <el-input-number
                              v-model="editingTask.successPoints"
                              :min="1"
                              :max="100"
                              size="small"
                              class="edit-number-input"
                          />
                        </div>
                        <div class="edit-points-item">
                          <label class="edit-label">{{ $t('todo.failPoints') }}:</label>
                          <el-input-number
                              v-model="editingTask.failPoints"
                              :min="-100"
                              :max="0"
                              size="small"
                              class="edit-number-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="edit-form-row">
                      <label class="edit-label">{{ $t('todo.frequency') }}:</label>
                      <el-select v-model="editingTask.frequency" class="edit-select">
                        <el-option label="One-time" value="once"></el-option>
                        <el-option label="Daily" value="daily"></el-option>
                        <el-option label="Weekly" value="weekly"></el-option>
                        <el-option label="Monthly" value="monthly"></el-option>
                        <el-option label="Custom Days" value="custom"></el-option>
                      </el-select>
                    </div>
                    <div class="edit-form-row" v-if="editingTask.frequency === 'custom'">
                      <label class="edit-label">{{ $t('todo.everyNDays') }}:</label>
                      <el-input-number
                          v-model="editingTask.customDays"
                          :min="2"
                          :max="365"
                          size="small"
                          class="edit-number-input"
                      />
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
                        class="action-btn"
                    >
                      <span class="btn-text-small">{{ $t('common.save') }}</span>
                    </el-button>
                    <el-button
                        size="mini"
                        icon="el-icon-close"
                        @click="cancelTaskEdit"
                        class="action-btn"
                    >
                      <span class="btn-text-small">{{ $t('common.cancel') }}</span>
                    </el-button>
                  </div>

                  <!-- Normal Actions -->
                  <div v-else class="normal-actions">
                    <!-- Task Status Actions for Daily Tasks or Pending Non-Daily Tasks -->
                    <div v-if="shouldShowStatusActions(task)" class="status-actions">
                      <el-button
                          type="success"
                          size="small"
                          icon="el-icon-check"
                          circle
                          @click="completeTask(task.id, 'success')"
                          class="status-btn"
                      >
                      </el-button>
                      <el-button
                          type="danger"
                          size="small"
                          icon="el-icon-close"
                          circle
                          @click="completeTask(task.id, 'fail')"
                          class="status-btn"
                      >
                      </el-button>
                    </div>

                    <!-- Status Display for Completed Tasks -->
                    <div v-else-if="task.status !== 'pending'" class="status-display">
                      <el-tag :type="task.status === 'success' ? 'success' : 'danger'" class="status-tag">
                        {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
                      </el-tag>
                    </div>

                    <!-- Reset Action for Non-Daily Completed Tasks -->
                    <div v-if="shouldShowResetAction(task)" class="reset-actions">
                      <el-button
                          type="warning"
                          size="mini"
                          icon="el-icon-refresh"
                          circle
                          @click="resetTaskStatus(task.id)"
                          :title="'Reset to pending'"
                          class="reset-btn"
                      >
                      </el-button>
                    </div>

                    <!-- Edit/Delete Actions -->
                    <div class="manage-actions">
                      <el-button
                          v-if="task.status === 'pending'"
                          type="primary"
                          size="mini"
                          icon="el-icon-edit"
                          circle
                          @click="startTaskEdit(task)"
                          class="manage-btn"
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
                            class="manage-btn"
                        >
                        </el-button>
                      </el-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>

            <div v-if="filteredTasks.length === 0" class="no-tasks">
              <el-empty :description="getEmptyDescription()"/>
            </div>
          </div>
        </el-tab-pane>

        <!-- History Tab -->
        <el-tab-pane :label="$t('todo.history')" name="history" class="history-tab">
          <div class="history-controls">
            <el-date-picker
                v-model="selectedDate"
                type="date"
                :placeholder="$t('todo.selectDate')"
                @change="loadHistoryForDate"
                class="responsive-date-picker"
            />
          </div>

          <div v-if="historyTasks.length > 0" class="history-tasks">
            <h3 class="history-date-title">{{ formatDate(selectedDate) }}</h3>
            <el-card
                v-for="task in historyTasks"
                :key="task.id"
                class="task-card history-task-card responsive-history-card"
                :class="getTaskStatusClass(task.status)"
            >
              <div class="task-content history-task-content">
                <div class="task-info history-task-info">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p v-if="task.description" class="task-description">{{ task.description }}</p>
                  <div class="task-meta-history">
                    <div class="task-points">
                      <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                      <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
                    </div>
                    <div class="completion-time" v-if="task.completedDate">
                      <el-tag size="mini" type="info" effect="plain">
                        <i class="el-icon-time"></i>
                        <span class="time-text">{{ formatTime(task.completedDate) }}</span>
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div class="history-task-status">
                  <div class="status-section">
                    <el-tag
                      :type="task.status === 'success' ? 'success' : 'danger'"
                      effect="dark"
                      size="medium"
                      class="history-status-tag"
                    >
                      {{ task.status === 'success' ? $t('todo.completed') : $t('todo.failed') }}
                    </el-tag>
                  </div>
                  <div class="history-actions">
                    <el-popconfirm
                        :title="$t('todo.confirmDeleteHistoryRecord')"
                        @confirm="deleteHistoryRecord(task.id, task.completedDate || task.date)"
                    >
                      <el-button
                          slot="reference"
                          type="danger"
                          size="mini"
                          icon="el-icon-delete"
                          circle
                          :title="$t('todo.deleteHistoryRecord')"
                          class="history-delete-btn"
                      >
                      </el-button>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
          <div v-else class="no-data">
            <el-empty :description="$t('todo.noTasksForDate')"/>
          </div>
        </el-tab-pane>

        <!-- Trash Tab -->
        <el-tab-pane :label="$t('todo.trash')" name="trash" class="trash-tab">
          <div class="trash-controls">
            <el-button
              v-if="trashedTasks.length > 0"
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="clearTrash"
              class="clear-trash-btn"
            >
              <span class="btn-text">Clear All</span>
            </el-button>
          </div>

          <div v-if="trashedTasks.length > 0" class="trash-tasks">
            <el-card
                v-for="task in trashedTasks"
                :key="task.id"
                class="task-card trash-card responsive-trash-card"
            >
              <div class="task-content">
                <div class="task-info">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p v-if="task.description" class="task-description">{{ task.description }}</p>
                  <div class="task-details">
                    <div class="task-points">
                      <el-tag size="mini" type="success">+{{ task.successPoints }}</el-tag>
                      <el-tag size="mini" type="danger">{{ task.failPoints }}</el-tag>
                    </div>
                    <div class="task-dates">
                      <el-tag size="mini" type="info" class="date-tag">
                        <span class="date-label">Original:</span>
                        <span class="date-value">{{ formatDate(task.originalDate) }}</span>
                      </el-tag>
                      <el-tag size="mini" type="warning" class="date-tag">
                        <span class="date-label">Deleted:</span>
                        <span class="date-value">{{ formatDate(task.deletedDate) }}</span>
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div class="trash-actions">
                  <el-tooltip content="Restore to original date" placement="top">
                    <el-button
                        type="success"
                        size="mini"
                        icon="el-icon-refresh-right"
                        circle
                        @click="restoreTask(task.id)"
                        class="trash-action-btn"
                    >
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="Permanently delete" placement="top">
                    <el-popconfirm
                        title="Permanently delete this task? This cannot be undone."
                        @confirm="permanentlyDeleteTask(task.id)"
                    >
                      <el-button
                          slot="reference"
                          type="danger"
                          size="mini"
                          icon="el-icon-close"
                          circle
                          class="trash-action-btn"
                      >
                      </el-button>
                    </el-popconfirm>
                  </el-tooltip>
                </div>
              </div>
            </el-card>
          </div>
          <div v-else class="no-data">
            <el-empty description="No items in trash"/>
          </div>
        </el-tab-pane>

        <!-- Analytics Tab -->
        <el-tab-pane :label="$t('todo.analytics')" name="analytics" class="analytics-tab">
          <div class="analytics-controls">
            <el-radio-group v-model="chartType" @change="updateChart" class="responsive-radio-group">
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
            <el-card class="summary-card responsive-summary-card">
              <h3 class="summary-title">{{ $t('todo.monthlySummary') }}</h3>
              <div class="summary-stats">
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="el-icon-trophy"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">{{ $t('todo.totalPoints') }}</span>
                    <span class="stat-value">{{ currentMonthPoints }}</span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="el-icon-check"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">{{ $t('todo.tasksCompleted') }}</span>
                    <span class="stat-value">{{ currentMonthCompleted }}</span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <i class="el-icon-data-analysis"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-label">{{ $t('todo.successRate') }}</span>
                    <span class="stat-value">{{ successRate }}%</span>
                  </div>
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
      taskFilter: 'all', // all, pending, completed, done
      frequencyFilter: 'all', // all, once, daily, weekly, monthly, custom
      newTask: {
        title: '',
        description: '',
        successPoints: 10,
        failPoints: -5,
        frequency: 'once',
        customDays: 7
      },
      selectedDate: new Date(),
      historyTasks: [],
      chartType: 'bar',
      chart: null,
      refreshTrigger: 0,
      editingTaskId: null,
      editingTask: {
        title: '',
        description: '',
        successPoints: 10,
        failPoints: -5,
        frequency: 'once',
        customDays: 7
      }
    }
  },
  computed: {
    todayTasks() {
      this.refreshTrigger
      const today = this.formatDateKey(new Date())
      return this.getTasksForDate(today)
    },
    filteredTasks() {
      let tasks = this.todayTasks

      // Filter by frequency
      if (this.frequencyFilter !== 'all') {
        tasks = tasks.filter(task => {
          const taskFrequency = task.frequency || 'once'
          return taskFrequency === this.frequencyFilter
        })
      }

      // Filter by status
      if (this.taskFilter !== 'all') {
        tasks = tasks.filter(task => {
          switch (this.taskFilter) {
            case 'pending':
              return task.status === 'pending'
            case 'completed':
              return task.status === 'success' || task.status === 'fail'
            case 'done':
              // Show non-daily tasks that are completed (done for their cycle)
              return this.shouldShowDoneTag(task) && (task.status === 'success' || task.status === 'fail')
            default:
              return true
          }
        })
      }

      return tasks
    },
    totalPoints() {
      this.refreshTrigger
      const allHistoryRecords = this.getAllHistoryRecords()
      return allHistoryRecords.reduce((total, record) => {
        if (record.status === 'success') return total + record.successPoints
        if (record.status === 'fail') return total + record.failPoints
        return total
      }, 0)
    },
    currentMonthPoints() {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const allHistoryRecords = this.getAllHistoryRecords()

      return allHistoryRecords.filter(record => {
        const recordDate = new Date(record.completedDate)
        return recordDate.getMonth() === currentMonth &&
            recordDate.getFullYear() === currentYear
      }).reduce((total, record) => {
        return total + (record.status === 'success' ? record.successPoints : record.failPoints)
      }, 0)
    },
    currentMonthCompleted() {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const allHistoryRecords = this.getAllHistoryRecords()

      return allHistoryRecords.filter(record => {
        const recordDate = new Date(record.completedDate)
        return recordDate.getMonth() === currentMonth &&
            recordDate.getFullYear() === currentYear &&
            record.status === 'success'
      }).length
    },
    successRate() {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const allHistoryRecords = this.getAllHistoryRecords()

      const monthRecords = allHistoryRecords.filter(record => {
        const recordDate = new Date(record.completedDate)
        return recordDate.getMonth() === currentMonth &&
            recordDate.getFullYear() === currentYear
      })

      if (monthRecords.length === 0) return 0

      const successRecords = monthRecords.filter(record => record.status === 'success').length
      return Math.round((successRecords / monthRecords.length) * 100)
    },
    trashedTasks() {
      this.refreshTrigger
      const stored = localStorage.getItem('todo_trash')
      return stored ? JSON.parse(stored) : []
    }
  },
  mounted() {
    this.loadHistoryForDate()
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
        description: this.newTask.description,
        successPoints: this.newTask.successPoints,
        failPoints: this.newTask.failPoints,
        frequency: this.newTask.frequency,
        customDays: this.newTask.customDays,
        status: 'pending',
        date: new Date().toISOString(),
        dateKey: this.formatDateKey(new Date())
      }

      this.saveTask(task)

      this.newTask.title = ''
      this.newTask.description = ''
      this.newTask.frequency = 'once'
      this.newTask.customDays = 7
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

        this.createHistoryRecord(tasks[taskIndex], status)
        const points = status === 'success' ? tasks[taskIndex].successPoints : tasks[taskIndex].failPoints

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
        if (key && key.startsWith('todo_') && !key.startsWith('todo_trash')) {
          const dateTasks = JSON.parse(localStorage.getItem(key))
          tasks.push(...dateTasks)
        }
      }
      return tasks
    },
    loadHistoryForDate() {
      const dateKey = this.formatDateKey(this.selectedDate)
      this.historyTasks = this.getHistoryRecordsForDate(dateKey)
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
      const allHistoryRecords = this.getAllHistoryRecords()

      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        months.push(monthKey)
        monthlyPoints[monthKey] = 0
      }

      allHistoryRecords.forEach(record => {
        const recordDate = new Date(record.completedDate)
        const monthKey = `${recordDate.getFullYear()}-${(recordDate.getMonth() + 1).toString().padStart(2, '0')}`

        if (monthlyPoints.hasOwnProperty(monthKey)) {
          monthlyPoints[monthKey] += record.status === 'success' ? record.successPoints : record.failPoints
        }
      })

      return {
        labels: months.map(m => {
          const [year, month] = m.split('-')
          return new Date(year, month - 1).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
        }),
        data: months.map(m => monthlyPoints[m])
      }
    },
    startTaskEdit(task) {
      this.editingTaskId = task.id
      this.editingTask = {
        title: task.title,
        description: task.description || '',
        successPoints: task.successPoints,
        failPoints: task.failPoints,
        frequency: task.frequency || 'once',
        customDays: task.customDays || 7
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
        tasks[taskIndex].description = this.editingTask.description
        tasks[taskIndex].successPoints = this.editingTask.successPoints
        tasks[taskIndex].failPoints = this.editingTask.failPoints
        tasks[taskIndex].frequency = this.editingTask.frequency
        tasks[taskIndex].customDays = this.editingTask.customDays

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
        description: '',
        successPoints: 10,
        failPoints: -5,
        frequency: 'once',
        customDays: 7
      }
    },
    deleteTask(taskId) {
      this.moveTaskToTrash(taskId, this.formatDateKey(new Date()))
    },
    moveTaskToTrash(taskId, dateKey) {
      const tasks = this.getTasksForDate(dateKey)
      const taskToTrash = tasks.find(t => t.id === taskId)

      if (taskToTrash) {
        const trashedTask = {
          ...taskToTrash,
          originalDate: taskToTrash.date || new Date(dateKey).toISOString(),
          deletedDate: new Date().toISOString()
        }

        const trashedTasks = this.trashedTasks
        trashedTasks.push(trashedTask)
        localStorage.setItem('todo_trash', JSON.stringify(trashedTasks))

        const filteredTasks = tasks.filter(t => t.id !== taskId)
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(filteredTasks))

        this.refreshTrigger++
        this.loadHistoryForDate()
        this.$message.success('Task moved to trash')
      }
    },
    formatTime(dateString) {
      if (!dateString) return ''

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return ''
        }

        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      } catch (error) {
        console.warn('Invalid date for formatting time:', dateString)
        return ''
      }
    },
    deleteHistoryRecord(historyRecordId, originalDate) {
      if (!originalDate) {
        this.$message.error('Invalid date for historical record')
        return
      }

      let dateToUse
      try {
        dateToUse = new Date(originalDate)
        if (isNaN(dateToUse.getTime())) {
          throw new Error('Invalid date')
        }
      } catch (error) {
        dateToUse = new Date()
        console.warn('Invalid date provided for history record, using current date:', originalDate)
      }

      const completedDateKey = this.formatDateKey(dateToUse)
      const historyRecords = this.getHistoryRecordsForDate(completedDateKey)
      const filteredRecords = historyRecords.filter(r => r.id !== historyRecordId)

      localStorage.setItem(`history_${completedDateKey}`, JSON.stringify(filteredRecords))

      this.loadHistoryForDate()
      this.refreshTrigger++

      this.$message.success(this.$t('todo.historyRecordDeleted'))
    },
    createHistoryRecord(task, status) {
      const dateKey = this.formatDateKey(new Date())
      const historyRecord = {
        id: task.id,
        title: task.title,
        description: task.description,
        successPoints: task.successPoints,
        failPoints: task.failPoints,
        status: status,
        completedDate: new Date().toISOString(),
        originalTaskId: task.id
      }

      const existingHistory = this.getHistoryRecordsForDate(dateKey)
      existingHistory.push(historyRecord)
      localStorage.setItem(`history_${dateKey}`, JSON.stringify(existingHistory))
    },
    getHistoryRecordsForDate(dateKey) {
      const stored = localStorage.getItem(`history_${dateKey}`)
      return stored ? JSON.parse(stored) : []
    },
    getAllHistoryRecords() {
      const records = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('history_')) {
          const dateRecords = JSON.parse(localStorage.getItem(key) || '[]')
          records.push(...dateRecords)
        }
      }
      return records
    },
    exportTodoData() {
      try {
        const todoData = {
          exportDate: new Date().toISOString(),
          version: '1.1',
          tasks: {},
          history: {},
          trash: JSON.parse(localStorage.getItem('todo_trash') || '[]')
        }

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key.startsWith('todo_') && key !== 'todo_trash') {
            const dateKey = key.replace('todo_', '')
            const tasks = JSON.parse(localStorage.getItem(key))
            todoData.tasks[dateKey] = tasks
          } else if (key.startsWith('history_')) {
            const dateKey = key.replace('history_', '')
            const history = JSON.parse(localStorage.getItem(key))
            todoData.history[dateKey] = history
          }
        }

        const dataStr = JSON.stringify(todoData, null, 2)
        const dataBlob = new Blob([dataStr], {type: 'application/json'})
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `todo-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        this.$message.success('Todo data exported successfully!')
      } catch (error) {
        console.error('Export failed:', error)
        this.$message.error('Failed to export todo data')
      }
    },
    importTodoData(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result)
            const isNewFormat = importedData.version === '1.1'

            if (!isNewFormat && (!importedData.data || typeof importedData.data !== 'object')) {
              throw new Error('Invalid file format')
            }

            this.$confirm(
                'This will merge the imported data with your existing tasks. Continue?',
                'Import Confirmation',
                {
                  confirmButtonText: 'Import',
                  cancelButtonText: 'Cancel',
                  type: 'warning'
                }
            ).then(() => {
              let importedCount = 0

              if (isNewFormat) {
                if (importedData.tasks) {
                  Object.keys(importedData.tasks).forEach(dateKey => {
                    const tasksToImport = importedData.tasks[dateKey]
                    if (Array.isArray(tasksToImport)) {
                      const existingTasks = this.getTasksForDate(dateKey)
                      const existingIds = new Set(existingTasks.map(t => t.id))
                      const newTasks = tasksToImport.filter(task => !existingIds.has(task.id))

                      if (newTasks.length > 0) {
                        const mergedTasks = [...existingTasks, ...newTasks]
                        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(mergedTasks))
                        importedCount += newTasks.length
                      }
                    }
                  })
                }

                if (importedData.history) {
                  Object.keys(importedData.history).forEach(dateKey => {
                    const historyToImport = importedData.history[dateKey]
                    if (Array.isArray(historyToImport)) {
                      const existingHistory = this.getHistoryRecordsForDate(dateKey)
                      const existingIds = new Set(existingHistory.map(h => h.id))
                      const newHistory = historyToImport.filter(record => !existingIds.has(record.id))

                      if (newHistory.length > 0) {
                        const mergedHistory = [...existingHistory, ...newHistory]
                        localStorage.setItem(`history_${dateKey}`, JSON.stringify(mergedHistory))
                      }
                    }
                  })
                }

                if (importedData.trash) {
                  const existingTrash = JSON.parse(localStorage.getItem('todo_trash') || '[]')
                  const existingTrashIds = new Set(existingTrash.map(t => t.id))
                  const newTrash = importedData.trash.filter(item => !existingTrashIds.has(item.id))
                  if (newTrash.length > 0) {
                    localStorage.setItem('todo_trash', JSON.stringify([...existingTrash, ...newTrash]))
                  }
                }
              } else {
                Object.keys(importedData.data).forEach(dateKey => {
                  const tasksToImport = importedData.data[dateKey]
                  if (Array.isArray(tasksToImport)) {
                    const existingTasks = this.getTasksForDate(dateKey)
                    const existingIds = new Set(existingTasks.map(t => t.id))
                    const newTasks = tasksToImport.filter(task => !existingIds.has(task.id))

                    if (newTasks.length > 0) {
                      const mergedTasks = [...existingTasks, ...newTasks]
                      localStorage.setItem(`todo_${dateKey}`, JSON.stringify(mergedTasks))
                      importedCount += newTasks.length
                    }
                  }
                })
              }

              this.refreshAllData()
              this.$message.success(`Successfully imported ${importedCount} tasks!`)
              resolve(false)
            }).catch(() => {
              resolve(false)
            })

          } catch (error) {
            console.error('Import failed:', error)
            this.$message.error('Failed to import todo data. Please check file format.')
            reject(error)
          }
        }

        reader.onerror = () => {
          this.$message.error('Failed to read file')
          reject(new Error('File read error'))
        }

        reader.readAsText(file)
      })
    },
    refreshAllData() {
      this.refreshTrigger++
      this.loadHistoryForDate()

      this.$nextTick(() => {
        this.refreshTrigger++
        console.log('Today tasks after import:', this.todayTasks.length)
        console.log('Total points after import:', this.totalPoints)

        if (this.activeTab === 'analytics') {
          this.$nextTick(() => {
            this.updateChart()
          })
        }
      })
    },
    restoreTask(taskId) {
      const trashedTasks = this.trashedTasks
      const taskToRestore = trashedTasks.find(t => t.id === taskId)

      if (taskToRestore) {
        const filteredTrash = trashedTasks.filter(t => t.id !== taskId)
        localStorage.setItem('todo_trash', JSON.stringify(filteredTrash))

        let restoreDate
        try {
          restoreDate = new Date(taskToRestore.originalDate)
          if (isNaN(restoreDate.getTime())) {
            restoreDate = new Date()
          }
        } catch (error) {
          restoreDate = new Date()
        }

        const restoreDateKey = this.formatDateKey(restoreDate)
        const existingTasks = this.getTasksForDate(restoreDateKey)

        const restoredTask = {
          id: taskToRestore.id,
          title: taskToRestore.title,
          description: taskToRestore.description,
          successPoints: taskToRestore.successPoints,
          failPoints: taskToRestore.failPoints,
          frequency: taskToRestore.frequency,
          customDays: taskToRestore.customDays,
          status: 'pending',
          date: restoreDate.toISOString(),
          dateKey: restoreDateKey
        }

        existingTasks.push(restoredTask)
        localStorage.setItem(`todo_${restoreDateKey}`, JSON.stringify(existingTasks))

        this.refreshTrigger++
        this.$message.success('Task restored successfully')
      }
    },
    permanentlyDeleteTask(taskId) {
      const trashedTasks = this.trashedTasks.filter(t => t.id !== taskId)
      localStorage.setItem('todo_trash', JSON.stringify(trashedTasks))
      this.refreshTrigger++
      this.$message.success('Task permanently deleted')
    },
    clearTrash() {
      this.$confirm(
        'This will permanently delete all items in trash. This cannot be undone.',
        'Clear Trash',
        {
          confirmButtonText: 'Clear All',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      ).then(() => {
        localStorage.setItem('todo_trash', JSON.stringify([]))
        this.refreshTrigger++
        this.$message.success('Trash cleared successfully')
      })
    },
    getFrequencyText(frequency, customDays) {
      switch (frequency) {
        case 'daily': return 'Daily'
        case 'weekly': return 'Weekly'
        case 'monthly': return 'Monthly'
        case 'custom': return `Every ${customDays} days`
        default: return 'One-time'
      }
    },
    shouldShowStatusActions(task) {
      // Daily tasks always show status actions when pending
      if (task.frequency === 'daily') {
        return task.status === 'pending'
      }

      // Non-daily tasks show status actions when pending
      return task.status === 'pending'
    },

    shouldShowDoneTag(task) {
      // Only show "Done" tag for non-daily tasks that are completed
      const isNonDaily = task.frequency && task.frequency !== 'once' && task.frequency !== 'daily'
      const isCompleted = task.status === 'success' || task.status === 'fail'
      return isNonDaily && isCompleted
    },

    shouldShowResetAction(task) {
      // Show reset action for non-daily completed tasks
      const isNonDaily = task.frequency && task.frequency !== 'once' && task.frequency !== 'daily'
      const isCompleted = task.status === 'success' || task.status === 'fail'
      return isNonDaily && isCompleted
    },

    getCompletionTagType(task) {
      if (task.status === 'success') return 'success'
      if (task.status === 'fail') return 'danger'
      return 'info'
    },

    getCompletionTagText(task) {
      const frequency = task.frequency || 'once'
      const period = this.getFrequencyPeriod(frequency)

      if (task.status === 'success') {
        return `Done this ${period}`
      } else if (task.status === 'fail') {
        return `Failed this ${period}`
      }
      return `Pending for ${period}`
    },

    getFrequencyPeriod(frequency) {
      switch (frequency) {
        case 'weekly': return 'week'
        case 'monthly': return 'month'
        case 'custom': return 'cycle'
        default: return 'period'
      }
    },

    resetTaskStatus(taskId) {
      const dateKey = this.formatDateKey(new Date())
      const tasks = this.getTasksForDate(dateKey)
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex !== -1) {
        // Reset task status to pending
        tasks[taskIndex].status = 'pending'
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(tasks))

        // Remove the corresponding history record
        this.removeLatestHistoryRecord(taskId)

        this.refreshTrigger++
        this.$message.success('Task status reset to pending')
      }
    },

    removeLatestHistoryRecord(taskId) {
      const dateKey = this.formatDateKey(new Date())
      const historyRecords = this.getHistoryRecordsForDate(dateKey)

      // Find and remove the most recent history record for this task
      const recordIndex = historyRecords.findLastIndex(record => record.originalTaskId === taskId)
      if (recordIndex !== -1) {
        historyRecords.splice(recordIndex, 1)
        localStorage.setItem(`history_${dateKey}`, JSON.stringify(historyRecords))
      }
    },

    getEmptyDescription() {
      if (this.taskFilter === 'all' && this.frequencyFilter === 'all') {
        return this.$t('todo.noTasksToday')
      }

      let description = 'No tasks found'

      if (this.taskFilter !== 'all') {
        const statusText = {
          'pending': 'pending',
          'completed': 'completed',
          'done': 'done (non-daily)'
        }[this.taskFilter]
        description += ` with status: ${statusText}`
      }

      if (this.frequencyFilter !== 'all') {
        description += ` with frequency: ${this.frequencyFilter}`
      }

      return description
    }
  }
}
</script>

<style scoped>
/* Base styles */
.todo-gamification {
  padding: 16px;
  max-width: 100%;
}

.main-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

/* Header styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.import-export-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-text {
  display: inline;
}

.total-points {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.points-label {
  color: #606266;
}

.points-badge {
  color: #409eff;
  font-size: 1.1em;
  font-weight: bold;
}

/* Tabs styles */
.responsive-tabs {
  margin-top: 20px;
}

.responsive-tabs >>> .el-tabs__nav-wrap {
  overflow-x: auto;
  overflow-y: hidden;
}

.responsive-tabs >>> .el-tabs__nav {
  white-space: nowrap;
}

/* Form styles */
.task-input-section {
  background: #fafbfc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.responsive-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-item {
  flex: 1;
  min-width: 100px;
  margin-bottom: 0 !important;
}

.form-item.full-width {
  flex: 1 1 100%;
}

.points-row {
  justify-content: flex-start;
}

.points-item {
  flex: 0 0 auto;
  min-width: 140px;
}

.frequency-row {
  align-items: flex-end;
}

.frequency-item {
  flex: 1;
  min-width: 160px;
}

.custom-days-item {
  flex: 0 0 auto;
  min-width: 120px;
}

.submit-row {
  justify-content: center;
}

.responsive-input,
.responsive-textarea,
.responsive-select {
  width: 100%;
}

.responsive-number,
.responsive-number-small {
  width: 100%;
}

.add-task-btn {
  padding: 10px 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Task card styles */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.responsive-task-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.responsive-task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
  word-break: break-word;
}

.task-description {
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.4;
  word-break: break-word;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.task-points {
  display: flex;
  gap: 6px;
}

.task-frequency {
  display: flex;
  align-items: center;
}

.frequency-text {
  margin-left: 4px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.status-actions,
.manage-actions,
.edit-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.normal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.status-btn,
.manage-btn,
.action-btn {
  min-width: 32px;
  height: 32px;
}

.btn-text-small {
  font-size: 0.85rem;
}

.status-tag {
  white-space: nowrap;
}

/* Edit form styles */
.task-edit-form {
  flex: 1;
  width: 100%;
}

.edit-form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #606266;
}

.edit-input,
.edit-select {
  width: 100%;
}

.edit-points-row {
  gap: 12px;
}

.edit-points-group {
  display: flex;
  gap: 12px;
}

.edit-points-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-number-input {
  width: 100%;
}

/* History styles */
.history-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-start;
}

.responsive-date-picker {
  width: 200px;
}

.history-date-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.responsive-history-card {
  margin-bottom: 16px;
}

.history-task-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.history-task-info {
  flex: 1;
  min-width: 0;
}

.task-meta-history {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.completion-time {
  display: flex;
  align-items: center;
}

.time-text {
  margin-left: 4px;
  font-size: 0.85rem;
}

.history-task-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}

.history-status-tag {
  white-space: nowrap;
}

.history-delete-btn {
  min-width: 28px;
  height: 28px;
}

/* Trash styles */
.trash-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-start;
}

.clear-trash-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.responsive-trash-card {
  margin-bottom: 16px;
}

.task-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-dates {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.date-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-value {
  font-size: 0.85rem;
}

.trash-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.trash-action-btn {
  min-width: 32px;
  height: 32px;
}

/* Analytics styles */
.analytics-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.responsive-radio-group {
  display: flex;
  gap: 8px;
}

.chart-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
}

.option-text {
  font-size: 0.9rem;
}

.chart-container {
  height: 400px;
  margin: 20px 0;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
}

.responsive-chart {
  max-width: 100%;
  max-height: 100%;
}

.responsive-summary-card {
  border-radius: 8px;
}

.summary-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #303133;
  text-align: center;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
}

.stat-icon {
  font-size: 2rem;
  color: #409eff;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #606266;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #303133;
}

/* Status classes */
.task-success {
  border-left: 4px solid #67c23a;
}

.task-fail {
  border-left: 4px solid #f56c6c;
}

.task-pending {
  border-left: 4px solid #e6a23c;
}

/* No data states */
.no-tasks,
.no-templates,
.no-data {
  text-align: center;
  padding: 40px 20px;
}

.template-hint {
  color: #909399;
  font-size: 0.9rem;
  margin-top: 8px;
}

/* Responsive breakpoints */
/* Tablet styles */
@media (max-width: 768px) {
  .todo-gamification {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 12px;
  }

  .header-controls {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .control-btn .btn-text {
    display: none;
  }

  .task-input-section {
    padding: 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-item {
    min-width: unset;
  }

  .points-row {
    flex-direction: row;
  }

  .points-item {
    flex: 1;
    min-width: unset;
  }

  .frequency-row {
    flex-direction: column;
  }

  .frequency-item,
  .custom-days-item {
    min-width: unset;
    flex: 1;
  }

  .task-content {
    flex-direction: column;
    gap: 12px;
  }

  .task-actions {
    align-self: stretch;
  }

  .normal-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .status-actions {
    order: 1;
  }

  .manage-actions {
    order: 2;
  }

  .template-content,
  .history-task-content {
    flex-direction: column;
    gap: 12px;
  }

  .template-actions,
  .history-task-status {
    align-self: stretch;
    align-items: center;
    flex-direction: row;
    justify-content: center;
  }

  .summary-stats {
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    flex-direction: row;
    text-align: left;
    padding: 12px;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .responsive-radio-group {
    flex-direction: column;
    width: 100%;
  }

  .chart-option .option-text {
    display: inline;
  }

  .chart-container {
    height: 300px;
    padding: 12px;
  }

  .edit-points-group {
    flex-direction: column;
    gap: 8px;
  }

  .task-dates {
    flex-direction: column;
    gap: 4px;
  }
}

/* Mobile styles */
@media (max-width: 480px) {
  .todo-gamification {
    padding: 8px;
  }

  .task-input-section {
    padding: 12px;
  }

  .header-title {
    font-size: 1.3rem;
  }

  .total-points {
    font-size: 0.9rem;
  }

  .points-badge {
    font-size: 1rem;
  }

  .task-title,
  .template-title {
    font-size: 1rem;
  }

  .task-description,
  .template-description {
    font-size: 0.9rem;
  }

  .btn-text-small {
    display: none;
  }

  .action-btn,
  .template-btn {
    min-width: 32px;
  }

  .responsive-date-picker {
    width: 100%;
  }

  .chart-container {
    height: 250px;
    padding: 8px;
  }

  .summary-title {
    font-size: 1.1rem;
  }

  .stat-value {
    font-size: 1.2rem;
  }

  .responsive-tabs >>> .el-tabs__item {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .task-meta,
  .template-meta,
  .task-meta-history {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .edit-form-row {
    gap: 8px;
  }

  .template-actions,
  .trash-actions {
    gap: 6px;
  }
}

/* Large screen optimizations */
@media (min-width: 1200px) {
  .todo-gamification {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .form-row {
    flex-wrap: nowrap;
  }

  .form-item.full-width {
    flex: 1 1 auto;
  }

  .summary-stats {
    max-width: 800px;
    margin: 0 auto;
  }
}

/* Task Filter Styles */
.task-filter-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #606266;
  min-width: 100px;
}

.filter-radio-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.frequency-filter-select {
  min-width: 140px;
}

/* Task Status and Completion Styles */
.task-completion-status {
  display: flex;
  align-items: center;
}

.completion-tag {
  font-size: 0.8rem;
  padding: 2px 6px;
}

.status-display {
  display: flex;
  align-items: center;
}

.reset-actions {
  display: flex;
  align-items: center;
}

.reset-btn {
  min-width: 28px;
  height: 28px;
}

.reset-btn:hover {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

/* Enhanced Task Meta Layout */
.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* Enhanced Action Button Layouts */
.normal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.status-actions,
.reset-actions,
.manage-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* Responsive Filter Styles */
@media (max-width: 768px) {
  .filter-controls {
    gap: 12px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-label {
    min-width: unset;
    font-size: 0.85rem;
  }

  .filter-radio-group {
    width: 100%;
  }

  .filter-radio-group >>> .el-radio-button {
    flex: 1;
  }

  .frequency-filter-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .task-filter-section {
    padding: 12px;
  }

  .filter-radio-group >>> .el-radio-button__inner {
    font-size: 0.8rem;
    padding: 6px 8px;
  }

  .completion-tag {
    font-size: 0.75rem;
  }

  .task-meta {
    gap: 6px;
  }
}

/* Large screen optimizations */
@media (min-width: 1200px) {
  .filter-controls {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 32px;
  }

  .filter-group {
    flex-direction: row;
    align-items: center;
  }
}
</style>
