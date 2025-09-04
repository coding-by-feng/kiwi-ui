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

          <!-- Ranking Display -->
          <div class="ranking-display">
            <div class="rank-badge" :class="getRankClass(currentRank.name)">
              <div class="rank-icon">
                <i :class="getRankIcon(currentRank.name)"></i>
              </div>
              <div class="rank-info">
                <div class="rank-name">{{ currentRank.name }}</div>
                <div class="rank-level">{{ $t('todo.rankLevel', { level: currentRank.level }) }}</div>
              </div>
            </div>
            <div class="rank-progress">
              <div class="progress-info">
                <span class="progress-text">{{ totalPoints }} / {{ currentRank.nextThreshold || '∞' }}</span>
                <span class="progress-percentage" v-if="currentRank.nextThreshold">{{ Math.round(rankProgress) }}%</span>
              </div>
              <el-progress
                :percentage="rankProgress"
                :show-text="false"
                :stroke-width="6"
                :color="getRankColor(currentRank.name)"
                class="rank-progress-bar"
              />
              <div v-if="currentRank.nextRankName" class="next-rank-info">
                <span class="next-rank-text">{{ $t('todo.nextRank', { rank: currentRank.nextRankName }) }}</span>
              </div>
              <div v-else class="max-rank-info">
                <span class="max-rank-text">{{ $t('todo.maxRank') }}</span>
              </div>
            </div>
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
                    <!-- Task Completion Status Tag for Non-Daily Tasks (only show if no status display below) -->
                    <div class="task-completion-status" v-if="shouldShowDoneTag(task) && !shouldShowStatusDisplay(task)">
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
      },

      // Ranking system data - using keys for i18n lookup
      ranks: [
        { level: 20, key: 'legendary', threshold: 50000, color: '#FFD700', icon: 'el-icon-trophy' },
        { level: 19, key: 'mythic', threshold: 40000, color: '#FF6B35', icon: 'el-icon-star-off' },
        { level: 18, key: 'immortal', threshold: 32000, color: '#E74C3C', icon: 'el-icon-medal' },
        { level: 17, key: 'divine', threshold: 26000, color: '#9B59B6', icon: 'el-icon-magic-stick' },
        { level: 16, key: 'celestial', threshold: 21000, color: '#3498DB', icon: 'el-icon-sunny' },
        { level: 15, key: 'grandmaster', threshold: 17000, color: '#1ABC9C', icon: 'el-icon-crown' },
        { level: 14, key: 'master', threshold: 14000, color: '#2ECC71', icon: 'el-icon-key' },
        { level: 13, key: 'diamond', threshold: 11500, color: '#85C1E9', icon: 'el-icon-present' },
        { level: 12, key: 'platinum', threshold: 9500, color: '#AED6F1', icon: 'el-icon-medal-1' },
        { level: 11, key: 'gold', threshold: 7800, color: '#F7DC6F', icon: 'el-icon-coin' },
        { level: 10, key: 'silver', threshold: 6400, color: '#D5DBDB', icon: 'el-icon-wallet' },
        { level: 9, key: 'bronze', threshold: 5200, color: '#CD853F', icon: 'el-icon-goods' },
        { level: 8, key: 'iron', threshold: 4200, color: '#2C3E50', icon: 'el-icon-service' },
        { level: 7, key: 'steel', threshold: 3400, color: '#566573', icon: 'el-icon-suitcase' },
        { level: 6, key: 'stone', threshold: 2700, color: '#7D8B8C', icon: 'el-icon-position' },
        { level: 5, key: 'wood', threshold: 2100, color: '#8B4513', icon: 'el-icon-postcard' },
        { level: 4, key: 'apprentice', threshold: 1600, color: '#52C41A', icon: 'el-icon-school' },
        { level: 3, key: 'novice', threshold: 1200, color: '#13C2C2', icon: 'el-icon-user' },
        { level: 2, key: 'trainee', threshold: 800, color: '#722ED1', icon: 'el-icon-reading' },
        { level: 1, key: 'beginner', threshold: 0, color: '#595959', icon: 'el-icon-help' }
      ]
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
    },
    currentRank() {
      const sortedRanks = [...this.ranks].sort((a, b) => b.threshold - a.threshold)
      for (let rank of sortedRanks) {
        if (this.totalPoints >= rank.threshold) {
          const nextRank = sortedRanks.find(r => r.threshold > rank.threshold)
          return {
            ...rank,
            name: this.getRankName(rank.key),
            nextThreshold: nextRank ? nextRank.threshold : null,
            nextRankName: nextRank ? this.getRankName(nextRank.key) : null
          }
        }
      }
      const beginnerRank = this.ranks[this.ranks.length - 1]
      return {
        ...beginnerRank,
        name: this.getRankName(beginnerRank.key),
        nextThreshold: this.ranks[this.ranks.length - 2].threshold,
        nextRankName: this.getRankName(this.ranks[this.ranks.length - 2].key)
      }
    },

    rankProgress() {
      if (!this.currentRank.nextThreshold) return 100

      const currentThreshold = this.currentRank.threshold
      const nextThreshold = this.currentRank.nextThreshold
      const progress = ((this.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100

      return Math.min(Math.max(progress, 0), 100)
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

              this.refreshTrigger++
              this.$message.success(`Successfully imported ${importedCount} tasks`)
              resolve()
            }).catch(() => {
              reject(new Error('Import cancelled'))
            })
          } catch (error) {
            console.error('Import error:', error)
            this.$message.error('Failed to import todo data')
            reject(error)
          }
        }

        reader.readAsText(file.raw)
      })
    },
    getRankName(rankKey) {
      return this.$t(`todo.ranks.${rankKey}`)
    },

    getRankClass(rankName) {
      // Extract the key from the localized name by finding the matching rank
      const rank = this.ranks.find(r => this.getRankName(r.key) === rankName)
      const key = rank ? rank.key : 'beginner'
      return `rank-${key}`
    },

    getRankIcon(rankName) {
      // Extract the key from the localized name by finding the matching rank
      const rank = this.ranks.find(r => this.getRankName(r.key) === rankName)
      return rank ? rank.icon : 'el-icon-help'
    },

    getRankColor(rankName) {
      // Extract the key from the localized name by finding the matching rank
      const rank = this.ranks.find(r => this.getRankName(r.key) === rankName)
      return rank ? rank.color : '#595959'
    },

    getRankByPoints(points) {
      const sortedRanks = [...this.ranks].sort((a, b) => b.threshold - a.threshold)
      for (let rank of sortedRanks) {
        if (points >= rank.threshold) {
          return {
            ...rank,
            name: this.getRankName(rank.key)
          }
        }
      }
      const beginnerRank = this.ranks[this.ranks.length - 1]
      return {
        ...beginnerRank,
        name: this.getRankName(beginnerRank.key)
      }
    },

    shouldShowDoneTag(task) {
      // Show done tag for non-daily tasks that have been completed
      const isNonDaily = task.frequency && task.frequency !== 'daily'
      return isNonDaily && (task.status === 'success' || task.status === 'fail')
    },

    shouldShowStatusActions(task) {
      // Show status action buttons for daily tasks or pending non-daily tasks
      const isDaily = !task.frequency || task.frequency === 'daily'
      return isDaily || task.status === 'pending'
    },

    shouldShowResetAction(task) {
      // Show reset action for completed non-daily tasks
      const isNonDaily = task.frequency && task.frequency !== 'daily'
      return isNonDaily && (task.status === 'success' || task.status === 'fail')
    },

    getCompletionTagType(task) {
      if (task.status === 'success') return 'success'
      if (task.status === 'fail') return 'danger'
      return 'info'
    },

    getCompletionTagText(task) {
      if (task.status === 'success') return this.$t('todo.completed')
      if (task.status === 'fail') return this.$t('todo.failed')
      return 'Done'
    },

    getFrequencyText(frequency, customDays) {
      switch (frequency) {
        case 'daily':
          return 'Daily'
        case 'weekly':
          return 'Weekly'
        case 'monthly':
          return 'Monthly'
        case 'custom':
          return `Every ${customDays} days`
        default:
          return 'One-time'
      }
    },

    getEmptyDescription() {
      switch (this.taskFilter) {
        case 'pending':
          return 'No pending tasks'
        case 'completed':
          return 'No completed tasks'
        case 'done':
          return 'No done tasks'
        default:
          return 'No tasks for today'
      }
    },

    resetTaskStatus(taskId) {
      const dateKey = this.formatDateKey(new Date())
      const tasks = this.getTasksForDate(dateKey)
      const taskIndex = tasks.findIndex(t => t.id === taskId)

      if (taskIndex !== -1) {
        tasks[taskIndex].status = 'pending'
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(tasks))
        this.refreshTrigger++
        this.$message.success('Task status reset to pending')
      }
    },

    restoreTask(taskId) {
      const trashedTasks = this.trashedTasks
      const taskIndex = trashedTasks.findIndex(t => t.id === taskId)

      if (taskIndex !== -1) {
        const taskToRestore = trashedTasks[taskIndex]
        const originalDate = new Date(taskToRestore.originalDate)
        const dateKey = this.formatDateKey(originalDate)

        // Remove from trash
        trashedTasks.splice(taskIndex, 1)
        localStorage.setItem('todo_trash', JSON.stringify(trashedTasks))

        // Restore to original date
        const existingTasks = this.getTasksForDate(dateKey)
        const restoredTask = {
          ...taskToRestore,
          status: 'pending' // Reset status when restoring
        }
        delete restoredTask.originalDate
        delete restoredTask.deletedDate

        existingTasks.push(restoredTask)
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(existingTasks))

        this.refreshTrigger++
        this.$message.success('Task restored successfully')
      }
    },

    permanentlyDeleteTask(taskId) {
      const trashedTasks = this.trashedTasks
      const filteredTasks = trashedTasks.filter(t => t.id !== taskId)
      localStorage.setItem('todo_trash', JSON.stringify(filteredTasks))
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
        localStorage.removeItem('todo_trash')
        this.refreshTrigger++
        this.$message.success('Trash cleared')
      })
    },

    shouldShowStatusDisplay(task) {
      // Show status display section for completed tasks (both daily and non-daily)
      return task.status !== 'pending'
    }
  }
}
</script>

<style scoped>
.todo-gamification {
  padding: 20px;
}

.main-card {
  border-radius: 12px;
  overflow: hidden;
}

.header {
  background-color: #f5f7fa;
  padding: 16px;
  border-bottom: 1px solid #e4e7ec;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.import-export-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  margin: 0;
}

.ranking-display {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  max-width: 500px;
}

.rank-badge {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  margin-right: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.rank-icon {
  margin-right: 8px;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.rank-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rank-name {
  color: #333;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-level {
  color: #666;
  font-size: 0.75rem;
  white-space: nowrap;
}

.rank-progress {
  flex: 1;
  min-width: 120px;
  margin-right: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.8rem;
}

.progress-text {
  color: #666;
  font-weight: 500;
}

.progress-percentage {
  color: #409EFF;
  font-weight: 600;
}

.rank-progress-bar {
  height: 6px;
  border-radius: 3px;
}

.next-rank-info,
.max-rank-info {
  text-align: center;
  margin-top: 4px;
}

.next-rank-text {
  font-size: 0.7rem;
  color: #909399;
  font-weight: 500;
}

.max-rank-text {
  font-size: 0.7rem;
  color: #67C23A;
  font-weight: 600;
}

.total-points {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.points-label {
  margin-right: 6px;
}

.points-badge {
  background-color: #67c23a;
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
}

/* Task input and form styles for larger screens */
.task-input-section {
  padding: 20px;
  background-color: #fafbfc;
  border-radius: 8px;
  margin-bottom: 20px;
}

.responsive-form {
  max-width: 1000px;
  margin: 0 auto;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.form-item {
  flex: 1;
  margin-bottom: 0;
}

.full-width {
  width: 100%;
}

.points-row {
  max-width: 400px;
}

.points-item {
  min-width: 120px;
}

.frequency-row {
  max-width: 500px;
}

.frequency-item {
  min-width: 150px;
}

.custom-days-item {
  min-width: 120px;
}

.submit-row {
  justify-content: flex-start;
  max-width: 200px;
}

.add-task-btn {
  padding: 10px 20px;
}

/* Task filter styles */
.task-filter-section {
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.filter-radio-group {
  margin-left: 8px;
}

.frequency-filter-select {
  min-width: 140px;
}

/* Task cards */
.tasks-list {
  display: grid;
  gap: 16px;
}

.task-card {
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
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
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.task-description {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 12px;
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-actions,
.manage-actions,
.reset-actions {
  display: flex;
  gap: 6px;
}

/* Responsive breakpoints */

/* Tablet (768px to 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .header-controls {
    gap: 12px;
  }

  .ranking-display {
    max-width: 400px;
  }

  .form-row {
    gap: 12px;
  }

  .filter-controls {
    gap: 16px;
  }
}

/* Small tablet and large mobile (481px to 768px) */
@media (max-width: 768px) and (min-width: 481px) {
  .todo-gamification {
    padding: 16px;
  }

  .header-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .import-export-controls {
    order: 1;
    justify-content: center;
  }

  .ranking-display {
    order: 2;
    max-width: none;
  }

  .total-points {
    order: 3;
    text-align: center;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .points-row,
  .frequency-row {
    flex-direction: row;
    max-width: none;
  }

  .filter-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .task-content {
    flex-direction: column;
    gap: 12px;
  }

  .task-actions {
    align-self: flex-end;
  }
}

/* Mobile (320px to 480px) */
@media (max-width: 480px) {
  .todo-gamification {
    padding: 12px;
  }

  .header-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .import-export-controls {
    order: 1;
    justify-content: center;
  }

  .ranking-display {
    order: 2;
    flex-direction: column;
    align-items: stretch;
  }

  .rank-badge {
    margin-right: 0;
    margin-bottom: 8px;
    padding: 8px 12px;
    justify-content: center;
  }

  .rank-info {
    align-items: center;
  }

  .rank-name {
    text-align: center;
  }

  .rank-level {
    text-align: center;
  }

  .rank-progress {
    margin-right: 0;
    width: 100%;
  }

  .total-points {
    order: 3;
    text-align: center;
  }

  .control-btn .btn-text {
    display: none;
  }

  .form-row {
    flex-direction: column;
    gap: 8px;
  }

  .points-row {
    flex-direction: column;
  }

  .frequency-row {
    flex-direction: column;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .filter-radio-group {
    margin-left: 0;
  }

  .task-content {
    flex-direction: column;
    gap: 8px;
  }

  .task-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .task-actions {
    align-self: stretch;
    justify-content: center;
  }
}

/* Extra small screens (320px and below) */
@media (max-width: 320px) {
  .todo-gamification {
    padding: 8px;
  }

  .header-controls {
    gap: 6px;
  }

  .rank-badge {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .rank-icon {
    font-size: 0.9rem;
    margin-right: 4px;
  }

  .rank-name {
    font-size: 0.8rem;
  }

  .rank-level {
    font-size: 0.7rem;
  }

  .progress-info {
    font-size: 0.7rem;
  }

  .next-rank-text,
  .max-rank-text {
    font-size: 0.6rem;
  }

  .total-points {
    font-size: 0.9rem;
  }

  .points-badge {
    padding: 3px 6px;
    font-size: 0.8rem;
  }

  .rank-progress-bar {
    height: 4px;
  }
}

/* History, Analytics and Trash tabs specific styles */
.history-tab,
.analytics-tab,
.trash-tab {
  padding: 20px;
}

.history-controls,
.analytics-controls,
.trash-controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.responsive-date-picker {
  min-width: 200px;
}

.chart-container {
  height: 400px;
  margin-bottom: 30px;
  position: relative;
}

.responsive-chart {
  max-width: 100%;
  height: 100%;
}

.monthly-summary {
  max-width: 800px;
  margin: 0 auto;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.5rem;
  color: #409EFF;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

/* Responsive adjustments for tabs content */
@media (max-width: 768px) {
  .history-tab,
  .analytics-tab,
  .trash-tab {
    padding: 16px;
  }

  .history-controls,
  .analytics-controls,
  .trash-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .chart-container {
    height: 300px;
  }

  .summary-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .history-tab,
  .analytics-tab,
  .trash-tab {
    padding: 12px;
  }

  .chart-container {
    height: 250px;
  }

  .stat-item {
    padding: 12px;
  }

  .responsive-date-picker {
    min-width: auto;
    width: 100%;
  }
}

/* Rank color classes */
.rank-legendary { background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff; }
.rank-mythic { background: linear-gradient(135deg, #FF6B35, #FF4500); color: #fff; }
.rank-immortal { background: linear-gradient(135deg, #E74C3C, #C0392B); color: #fff; }
.rank-divine { background: linear-gradient(135deg, #9B59B6, #8E44AD); color: #fff; }
.rank-celestial { background: linear-gradient(135deg, #3498DB, #2980B9); color: #fff; }
.rank-grandmaster { background: linear-gradient(135deg, #1ABC9C, #16A085); color: #fff; }
.rank-master { background: linear-gradient(135deg, #2ECC71, #27AE60); color: #fff; }
.rank-diamond { background: linear-gradient(135deg, #85C1E9, #5DADE2); color: #fff; }
.rank-platinum { background: linear-gradient(135deg, #AED6F1, #85C1E9); color: #333; }
.rank-gold { background: linear-gradient(135deg, #F7DC6F, #F4D03F); color: #333; }
.rank-silver { background: linear-gradient(135deg, #D5DBDB, #BDC3C7); color: #333; }
.rank-bronze { background: linear-gradient(135deg, #CD853F, #A0522D); color: #fff; }
.rank-iron { background: linear-gradient(135deg, #2C3E50, #34495E); color: #fff; }
.rank-steel { background: linear-gradient(135deg, #566573, #5D6D7E); color: #fff; }
.rank-stone { background: linear-gradient(135deg, #7D8B8C, #85929E); color: #fff; }
.rank-wood { background: linear-gradient(135deg, #8B4513, #A0522D); color: #fff; }
.rank-apprentice { background: linear-gradient(135deg, #52C41A, #389E0D); color: #fff; }
.rank-novice { background: linear-gradient(135deg, #13C2C2, #08979C); color: #fff; }
.rank-trainee { background: linear-gradient(135deg, #722ED1, #531DAB); color: #fff; }
.rank-beginner { background: linear-gradient(135deg, #595959, #434343); color: #fff; }

/* Responsive tabs - ensure horizontal display on mobile */
.responsive-tabs {
  width: 100%;
}

.responsive-tabs .el-tabs__header {
  margin-bottom: 0;
}

.responsive-tabs .el-tabs__nav-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.responsive-tabs .el-tabs__nav-wrap::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.responsive-tabs .el-tabs__nav-scroll {
  white-space: nowrap;
}

.responsive-tabs .el-tabs__nav {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-width: max-content;
}

.responsive-tabs .el-tabs__item {
  flex-shrink: 0;
  min-width: auto;
  padding: 0 16px;
  font-size: 14px;
  white-space: nowrap;
}

/* Mobile specific tab improvements */
@media (max-width: 768px) {
  .responsive-tabs .el-tabs__item {
    padding: 0 12px;
    font-size: 13px;
    min-width: 80px;
    text-align: center;
  }

  .responsive-tabs .el-tabs__nav-wrap {
    padding: 0 8px;
  }

  .responsive-tabs .el-tabs__nav {
    min-width: calc(4 * 90px); /* Ensure minimum width for 4 tabs */
  }
}

@media (max-width: 480px) {
  .responsive-tabs .el-tabs__item {
    padding: 0 8px;
    font-size: 12px;
    min-width: 70px;
    text-align: center;
  }

  .responsive-tabs .el-tabs__nav-wrap {
    padding: 0 4px;
  }

  .responsive-tabs .el-tabs__nav {
    min-width: calc(4 * 80px); /* Ensure minimum width for 4 tabs */
  }
}

@media (max-width: 360px) {
  .responsive-tabs .el-tabs__item {
    padding: 0 6px;
    font-size: 11px;
    min-width: 65px;
    text-align: center;
  }

  .responsive-tabs .el-tabs__nav {
    min-width: calc(4 * 75px); /* Ensure minimum width for 4 tabs */
  }
}
</style>
