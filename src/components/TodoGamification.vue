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
            <el-button
                type="info"
                size="small"
                icon="el-icon-magic-stick"
                @click="createDemoTasks"
                class="control-btn"
            >
              <span class="btn-text">Demo</span>
            </el-button>
            <el-button
                type="danger"
                size="small"
                icon="el-icon-delete"
                @click="clearAllData"
                class="control-btn"
            >
              <span class="btn-text">Clear All</span>
            </el-button>
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
              <div class="rank-details-icon">
                <el-popover
                  placement="bottom"
                  width="320"
                  trigger="click"
                  :title="$t('todo.rankingSystem')"
                >
                  <div class="ranking-details">
                    <div class="current-rank-details">
                      <h4>{{ $t('todo.currentRank') }}</h4>
                      <div class="rank-item">
                        <i :class="getRankIcon(currentRank.name)" :style="{color: getRankColor(currentRank.name)}"></i>
                        <span class="rank-name">{{ currentRank.name }}</span>
                        <span class="rank-points">{{ currentRank.threshold }}+ {{ $t('todo.points') }}</span>
                      </div>
                    </div>
                    <div class="next-rank-details" v-if="currentRank.nextRankName">
                      <h4>{{ $t('todo.nextRankTarget') }}</h4>
                      <div class="rank-item">
                        <i :class="getNextRankIcon()" :style="{color: getNextRankColor()}"></i>
                        <span class="rank-name">{{ currentRank.nextRankName }}</span>
                        <span class="rank-points">{{ currentRank.nextThreshold }}+ {{ $t('todo.points') }}</span>
                      </div>
                      <div class="progress-needed">
                        {{ $t('todo.pointsNeeded', { points: currentRank.nextThreshold - totalPoints }) }}
                      </div>
                    </div>
                    <div class="max-rank-notice" v-else>
                      <h4>🎉 {{ $t('todo.congratulations') }}</h4>
                      <p>{{ $t('todo.maxRankAchieved') }}</p>
                    </div>
                    <div class="all-ranks-preview">
                      <h4>{{ $t('todo.allRanks') }}</h4>
                      <div class="ranks-grid">
                        <div
                          v-for="rank in sortedRanksForDisplay"
                          :key="rank.key"
                          class="rank-preview-item"
                          :class="{ 'current-rank': rank.threshold <= totalPoints }"
                        >
                          <i :class="rank.icon" :style="{color: rank.color}"></i>
                          <span class="rank-preview-name">{{ getRankName(rank.key) }}</span>
                          <span class="rank-preview-threshold">{{ rank.threshold }}+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <i slot="reference" class="el-icon-info rank-info-icon" :title="$t('todo.viewRankingDetails')"></i>
                </el-popover>
              </div>
            </div>
            <div class="rank-progress">
              <div class="progress-info">
                <span class="progress-text">{{ totalPoints }} / {{ currentRank.nextThreshold || '∞' }}</span>
                <span class="progress-percentage" v-if="currentRank.nextThreshold">{{ Math.round(rankProgress) }}%</span>
                <span class="progress-percentage max-rank" v-else>{{ $t('todo.maxRank') }}</span>
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
                <span class="max-rank-text">{{ $t('todo.maxRankReached') }}</span>
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
                      style="width: 120px;"
                  />
                </el-form-item>
                <el-form-item :label="$t('todo.failPoints')" class="form-item points-item">
                  <el-input-number
                      v-model="newTask.failPoints"
                      :min="-100"
                      :max="0"
                      size="small"
                      style="width: 120px;"
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
                    ></el-button>
                    <el-button
                        size="mini"
                        icon="el-icon-close"
                        @click="cancelTaskEdit"
                        class="action-btn"
                    ></el-button>
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
      const sortedRanks = [...this.ranks].sort((a, b) => a.threshold - b.threshold) // Sort ascending for correct next rank logic
      for (let i = sortedRanks.length - 1; i >= 0; i--) {
        const rank = sortedRanks[i]
        if (this.totalPoints >= rank.threshold) {
          const nextRank = i < sortedRanks.length - 1 ? sortedRanks[i + 1] : null // Get higher rank
          return {
            ...rank,
            name: this.getRankName(rank.key),
            nextThreshold: nextRank ? nextRank.threshold : null,
            nextRankName: nextRank ? this.getRankName(nextRank.key) : null
          }
        }
      }
      // Default to beginner rank if no rank matches
      const beginnerRank = sortedRanks[0] // First rank (lowest threshold)
      const nextRank = sortedRanks.length > 1 ? sortedRanks[1] : null
      return {
        ...beginnerRank,
        name: this.getRankName(beginnerRank.key),
        nextThreshold: nextRank ? nextRank.threshold : null,
        nextRankName: nextRank ? this.getRankName(nextRank.key) : null
      }
    },

    sortedRanksForDisplay() {
      return [...this.ranks].sort((a, b) => b.threshold - a.threshold)
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
          appVersion: '1.0', // Add app version for compatibility
          tasks: {},
          history: {},
          trash: JSON.parse(localStorage.getItem('todo_trash') || '[]'),
          metadata: {
            totalTasks: 0,
            totalHistoryRecords: 0,
            exportedDates: []
          }
        }

        let taskCount = 0
        let historyCount = 0

        // Export all tasks
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('todo_') && key !== 'todo_trash') {
            const dateKey = key.replace('todo_', '')
            try {
              const tasks = JSON.parse(localStorage.getItem(key) || '[]')
              if (Array.isArray(tasks) && tasks.length > 0) {
                // Validate task structure
                const validTasks = tasks.filter(task =>
                  task &&
                  typeof task === 'object' &&
                  task.id &&
                  task.title
                )
                if (validTasks.length > 0) {
                  todoData.tasks[dateKey] = validTasks
                  taskCount += validTasks.length
                  todoData.metadata.exportedDates.push(dateKey)
                }
              }
            } catch (error) {
              console.warn(`Failed to parse tasks for date ${dateKey}:`, error)
            }
          }
        }

        // Export all history
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('history_')) {
            const dateKey = key.replace('history_', '')
            try {
              const history = JSON.parse(localStorage.getItem(key) || '[]')
              if (Array.isArray(history) && history.length > 0) {
                // Validate history structure
                const validHistory = history.filter(record =>
                  record &&
                  typeof record === 'object' &&
                  record.id &&
                  record.title &&
                  record.status &&
                  record.completedDate
                )
                if (validHistory.length > 0) {
                  todoData.history[dateKey] = validHistory
                  historyCount += validHistory.length
                }
              }
            } catch (error) {
              console.warn(`Failed to parse history for date ${dateKey}:`, error)
            }
          }
        }

        // Validate trash data
        if (Array.isArray(todoData.trash)) {
          todoData.trash = todoData.trash.filter(task =>
            task &&
            typeof task === 'object' &&
            task.id &&
            task.title
          )
        } else {
          todoData.trash = []
        }

        // Update metadata
        todoData.metadata.totalTasks = taskCount
        todoData.metadata.totalHistoryRecords = historyCount
        todoData.metadata.totalTrashItems = todoData.trash.length

        // Validate we have data to export
        if (taskCount === 0 && historyCount === 0 && todoData.trash.length === 0) {
          this.$message.warning('No data available to export')
          return
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

        this.$message.success(`Data exported successfully! (${taskCount} tasks, ${historyCount} history records, ${todoData.trash.length} trash items)`)
      } catch (error) {
        console.error('Export failed:', error)
        this.$message.error('Failed to export todo data: ' + error.message)
      }
    },

    importTodoData(file) {
      return new Promise((resolve, reject) => {
        // Handle both direct file objects and file objects with .raw property
        const fileToRead = file.raw || file

        if (!fileToRead) {
          this.$message.error('Invalid file selected')
          reject(new Error('Invalid file'))
          return
        }

        // Validate file type
        if (fileToRead.type !== 'application/json' && !fileToRead.name.toLowerCase().endsWith('.json')) {
          this.$message.error('Please select a valid JSON file')
          reject(new Error('Invalid file type'))
          return
        }

        const reader = new FileReader()

        reader.onerror = () => {
          this.$message.error('Failed to read file')
          reject(new Error('File read error'))
        }

        reader.onload = (e) => {
          try {
            let importedData
            try {
              importedData = JSON.parse(e.target.result)
            } catch (parseError) {
              throw new Error('Invalid JSON format - please check your file content')
            }

            // Validate import data structure
            if (!importedData || typeof importedData !== 'object') {
              throw new Error('Invalid data format - expected JSON object')
            }

            // Check for current v1.1 format
            const isCurrentFormat = importedData.version === '1.1' &&
                                  importedData.exportDate &&
                                  typeof importedData.tasks === 'object' &&
                                  typeof importedData.history === 'object' &&
                                  Array.isArray(importedData.trash)

            // Check for legacy format
            const isLegacyFormat = importedData.data &&
                                  typeof importedData.data === 'object' &&
                                  !importedData.version

            if (!isCurrentFormat && !isLegacyFormat) {
              console.error('Unsupported format. Data structure:', {
                hasVersion: !!importedData.version,
                version: importedData.version,
                hasExportDate: !!importedData.exportDate,
                hasTasks: !!importedData.tasks,
                hasHistory: !!importedData.history,
                hasTrash: !!importedData.trash,
                hasLegacyData: !!importedData.data,
                topLevelKeys: Object.keys(importedData)
              })
              throw new Error('Unsupported file format. Please make sure you are importing a valid todo data export file (version 1.1 or legacy format).')
            }

            // Show import preview and confirmation
            let previewMessage = 'Import Preview:\n'
            let tasksToImport = 0
            let historyToImport = 0
            let trashToImport = 0

            if (isCurrentFormat) {
              // Count tasks
              if (importedData.tasks && typeof importedData.tasks === 'object') {
                tasksToImport = Object.values(importedData.tasks)
                  .filter(dateArray => Array.isArray(dateArray))
                  .reduce((total, dateArray) => total + dateArray.length, 0)
              }

              // Count history
              if (importedData.history && typeof importedData.history === 'object') {
                historyToImport = Object.values(importedData.history)
                  .filter(dateArray => Array.isArray(dateArray))
                  .reduce((total, dateArray) => total + dateArray.length, 0)
              }

              // Count trash
              if (importedData.trash && Array.isArray(importedData.trash)) {
                trashToImport = importedData.trash.length
              }

              if (importedData.metadata && importedData.exportDate) {
                previewMessage += `Export Date: ${new Date(importedData.exportDate).toLocaleDateString()}\n`
                previewMessage += `Exported Dates: ${importedData.metadata.exportedDates?.length || 0} dates\n`
              }
            } else {
              // Legacy format
              if (importedData.data && typeof importedData.data === 'object') {
                tasksToImport = Object.values(importedData.data)
                  .filter(dateArray => Array.isArray(dateArray))
                  .reduce((total, dateArray) => total + dateArray.length, 0)
              }
            }

            previewMessage += `Tasks: ${tasksToImport}\n`
            previewMessage += `History Records: ${historyToImport}\n`
            previewMessage += `Trash Items: ${trashToImport}\n\n`

            if (tasksToImport === 0 && historyToImport === 0 && trashToImport === 0) {
              throw new Error('No valid data found in the import file')
            }

            previewMessage += 'This will merge with your existing data. Continue?'

            this.$confirm(previewMessage, 'Import Confirmation', {
              confirmButtonText: 'Import',
              cancelButtonText: 'Cancel',
              type: 'info'
            }).then(() => {
              let importedTaskCount = 0
              let importedHistoryCount = 0
              let importedTrashCount = 0
              let skippedDuplicates = 0

              try {
                if (isCurrentFormat) {
                  // Import tasks
                  if (importedData.tasks && typeof importedData.tasks === 'object') {
                    Object.keys(importedData.tasks).forEach(dateKey => {
                      const tasksToImport = importedData.tasks[dateKey]
                      if (Array.isArray(tasksToImport) && tasksToImport.length > 0) {
                        const existingTasks = this.getTasksForDate(dateKey)
                        const existingIds = new Set(existingTasks.map(t => t.id))

                        const newTasks = tasksToImport.filter(task => {
                          // Validate task structure
                          if (!task || typeof task !== 'object' || !task.id || !task.title) {
                            console.warn('Invalid task structure:', task)
                            return false
                          }

                          if (existingIds.has(task.id)) {
                            skippedDuplicates++
                            return false
                          }

                          return true
                        })

                        if (newTasks.length > 0) {
                          // Ensure task has required properties with defaults
                          const validatedTasks = newTasks.map(task => ({
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            successPoints: task.successPoints || 10,
                            failPoints: task.failPoints || -5,
                            frequency: task.frequency || 'once',
                            customDays: task.customDays || 7,
                            status: task.status || 'pending',
                            date: task.date || new Date().toISOString(),
                            dateKey: task.dateKey || dateKey
                          }))

                          const mergedTasks = [...existingTasks, ...validatedTasks]
                          localStorage.setItem(`todo_${dateKey}`, JSON.stringify(mergedTasks))
                          importedTaskCount += validatedTasks.length
                        }
                      }
                    })
                  }

                  // Import history
                  if (importedData.history && typeof importedData.history === 'object') {
                    Object.keys(importedData.history).forEach(dateKey => {
                      const historyToImport = importedData.history[dateKey]
                      if (Array.isArray(historyToImport) && historyToImport.length > 0) {
                        const existingHistory = this.getHistoryRecordsForDate(dateKey)
                        const existingIds = new Set(existingHistory.map(h => `${h.id}_${h.completedDate}`))

                        const newHistory = historyToImport.filter(record => {
                          // Validate history structure
                          if (!record || typeof record !== 'object' || !record.id || !record.completedDate) {
                            console.warn('Invalid history record structure:', record)
                            return false
                          }

                          const recordKey = `${record.id}_${record.completedDate}`
                          if (existingIds.has(recordKey)) {
                            skippedDuplicates++
                            return false
                          }

                          return true
                        })

                        if (newHistory.length > 0) {
                          // Ensure history record has required properties
                          const validatedHistory = newHistory.map(record => ({
                            id: record.id,
                            title: record.title,
                            description: record.description || '',
                            successPoints: record.successPoints || 10,
                            failPoints: record.failPoints || -5,
                            status: record.status,
                            completedDate: record.completedDate,
                            originalTaskId: record.originalTaskId || record.id
                          }))

                          const mergedHistory = [...existingHistory, ...validatedHistory]
                          localStorage.setItem(`history_${dateKey}`, JSON.stringify(mergedHistory))
                          importedHistoryCount += validatedHistory.length
                        }
                      }
                    })
                  }

                  // Import trash
                  if (importedData.trash && Array.isArray(importedData.trash)) {
                    const existingTrash = JSON.parse(localStorage.getItem('todo_trash') || '[]')
                    const existingTrashIds = new Set(existingTrash.map(t => t.id))

                    const newTrash = importedData.trash.filter(item => {
                      // Validate trash item structure
                      if (!item || typeof item !== 'object' || !item.id || !item.title) {
                        console.warn('Invalid trash item structure:', item)
                        return false
                      }

                      if (existingTrashIds.has(item.id)) {
                        skippedDuplicates++
                        return false
                      }

                      return true
                    })

                    if (newTrash.length > 0) {
                      // Ensure trash item has required properties
                      const validatedTrash = newTrash.map(item => ({
                        ...item,
                        description: item.description || '',
                        successPoints: item.successPoints || 10,
                        failPoints: item.failPoints || -5,
                        originalDate: item.originalDate || item.date || new Date().toISOString(),
                        deletedDate: item.deletedDate || new Date().toISOString()
                      }))

                      localStorage.setItem('todo_trash', JSON.stringify([...existingTrash, ...validatedTrash]))
                      importedTrashCount = validatedTrash.length
                    }
                  }
                } else {
                  // Handle legacy format
                  if (importedData.data && typeof importedData.data === 'object') {
                    Object.keys(importedData.data).forEach(dateKey => {
                      const tasksToImport = importedData.data[dateKey]
                      if (Array.isArray(tasksToImport) && tasksToImport.length > 0) {
                        const existingTasks = this.getTasksForDate(dateKey)
                        const existingIds = new Set(existingTasks.map(t => t.id))

                        const newTasks = tasksToImport.filter(task => {
                          if (!task || typeof task !== 'object' || !task.id || !task.title) {
                            console.warn('Invalid legacy task structure:', task)
                            return false
                          }

                          if (existingIds.has(task.id)) {
                            skippedDuplicates++
                            return false
                          }

                          return true
                        })

                        if (newTasks.length > 0) {
                          const validatedTasks = newTasks.map(task => ({
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            successPoints: task.successPoints || 10,
                            failPoints: task.failPoints || -5,
                            frequency: task.frequency || 'once',
                            customDays: task.customDays || 7,
                            status: task.status || 'pending',
                            date: task.date || new Date().toISOString(),
                            dateKey: task.dateKey || dateKey
                          }))

                          const mergedTasks = [...existingTasks, ...validatedTasks]
                          localStorage.setItem(`todo_${dateKey}`, JSON.stringify(mergedTasks))
                          importedTaskCount += validatedTasks.length
                        }
                      }
                    })
                  }
                }

                this.refreshTrigger++
                this.loadHistoryForDate() // Refresh history view

                let successMessage = `Import completed successfully!\n`
                successMessage += `Tasks: ${importedTaskCount} imported\n`
                if (importedHistoryCount > 0) successMessage += `History: ${importedHistoryCount} imported\n`
                if (importedTrashCount > 0) successMessage += `Trash: ${importedTrashCount} imported\n`
                if (skippedDuplicates > 0) successMessage += `Skipped: ${skippedDuplicates} duplicates`

                this.$message.success(successMessage)
                resolve()
              } catch (importError) {
                console.error('Import processing error:', importError)
                this.$message.error('Import failed during data processing: ' + importError.message)
                reject(importError)
              }
            }).catch(() => {
              reject(new Error('Import cancelled'))
            })
          } catch (error) {
            console.error('Import error:', error)
            this.$message.error('Failed to import todo data: ' + error.message)
            reject(error)
          }
        }

        reader.readAsText(fileToRead)
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

    getNextRankIcon() {
      if (!this.currentRank.nextThreshold) return 'el-icon-trophy'
      const sortedRanks = [...this.ranks].sort((a, b) => a.threshold - b.threshold) // Sort ascending
      const nextRank = sortedRanks.find(r => r.threshold === this.currentRank.nextThreshold)
      return nextRank ? nextRank.icon : 'el-icon-trophy'
    },

    getNextRankColor() {
      if (!this.currentRank.nextThreshold) return '#FFD700'
      const sortedRanks = [...this.ranks].sort((a, b) => a.threshold - b.threshold) // Sort ascending
      const nextRank = sortedRanks.find(r => r.threshold === this.currentRank.nextThreshold)
      return nextRank ? nextRank.color : '#FFD700'
    },

    shouldShowDoneTag(task) {
      // Show done tag for non-daily tasks that have been completed
      const isNonDaily = task.frequency && task.frequency !== 'daily'
      return isNonDaily && (task.status === 'success' || task.status === 'fail')
    },

    shouldShowStatusActions(task) {
      // Only show status action buttons for pending tasks
      // Once a task is completed (success or fail), these buttons should be hidden
      return task.status === 'pending'
    },

    shouldShowResetAction(task) {
      // Show reset action for any completed task (both daily and non-daily)
      return task.status === 'success' || task.status === 'fail'
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

    clearAllData() {
      this.$confirm(
        'This will permanently delete all your todo data including tasks, history, and trash. This action cannot be undone.\n\nAre you sure you want to continue?',
        'Clear All Data',
        {
          confirmButtonText: 'Yes, Clear All Data',
          cancelButtonText: 'Cancel',
          type: 'error',
          customClass: 'clear-data-confirm-dialog',
          dangerouslyUseHTMLString: false
        }
      ).then(() => {
        // Show a second confirmation for extra safety
        this.$confirm(
          'Last confirmation: This will delete ALL your todo data permanently. This cannot be undone.',
          'Final Confirmation',
          {
            confirmButtonText: 'DELETE ALL DATA',
            cancelButtonText: 'Cancel',
            type: 'error',
            customClass: 'clear-data-final-confirm'
          }
        ).then(() => {
          try {
            let deletedItems = 0
            const keysToDelete = []

            // Collect all todo-related keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (
                key.startsWith('todo_') ||
                key.startsWith('history_') ||
                key === 'todo_trash'
              )) {
                keysToDelete.push(key)
              }
            }

            // Delete all collected keys
            keysToDelete.forEach(key => {
              try {
                const data = localStorage.getItem(key)
                if (data) {
                  if (key === 'todo_trash') {
                    const trashData = JSON.parse(data)
                    deletedItems += Array.isArray(trashData) ? trashData.length : 0
                  } else {
                    const parsedData = JSON.parse(data)
                    deletedItems += Array.isArray(parsedData) ? parsedData.length : 0
                  }
                }
                localStorage.removeItem(key)
              } catch (error) {
                console.warn(`Failed to process key ${key} during cleanup:`, error)
                // Still remove the key even if parsing fails
                localStorage.removeItem(key)
              }
            })

            // Force refresh all components
            this.refreshTrigger++
            this.historyTasks = []
            this.selectedDate = new Date()
            this.taskFilter = 'all'
            this.frequencyFilter = 'all'
            this.activeTab = 'today'

            // Reset form
            this.newTask = {
              title: '',
              description: '',
              successPoints: 10,
              failPoints: -5,
              frequency: 'once',
              customDays: 7
            }

            // Refresh history view
            this.loadHistoryForDate()

            // Destroy and recreate chart if it exists
            if (this.chart) {
              this.chart.destroy()
              this.chart = null
            }

            this.$message({
              message: `All data cleared successfully! Removed ${keysToDelete.length} storage entries containing ${deletedItems} items.`,
              type: 'success',
              duration: 5000,
              showClose: true
            })

          } catch (error) {
            console.error('Error during data clearing:', error)
            this.$message.error('Failed to clear all data: ' + error.message)
          }
        }).catch(() => {
          this.$message.info('Data clearing cancelled')
        })
      }).catch(() => {
        this.$message.info('Data clearing cancelled')
      })
    },

    createDemoTasks() {
      this.$confirm(
        'This will create sample tasks to demonstrate the app features. The demo includes:\n\n' +
        '• Various task types (daily, weekly, monthly, one-time, custom)\n' +
        '• Different point values and descriptions\n' +
        '• Some completed tasks with history records\n' +
        '• Tasks across multiple dates\n\n' +
        'Continue?',
        'Create Demo Tasks',
        {
          confirmButtonText: 'Create Demo',
          cancelButtonText: 'Cancel',
          type: 'info',
          customClass: 'demo-confirm-dialog'
        }
      ).then(() => {
        try {
          this.generateDemoTasks()
          this.$message({
            message: 'Demo tasks created successfully! Explore different tabs to see all features.',
            type: 'success',
            duration: 5000,
            showClose: true
          })
        } catch (error) {
          console.error('Failed to create demo tasks:', error)
          this.$message.error('Failed to create demo tasks: ' + error.message)
        }
      }).catch(() => {
        this.$message.info('Demo creation cancelled')
      })
    },

    generateDemoTasks() {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      // Demo tasks for today
      const todayTasks = [
        {
          id: Date.now() + 1,
          title: 'Morning Exercise',
          description: 'Do 30 minutes of cardio or strength training',
          successPoints: 20,
          failPoints: -10,
          frequency: 'daily',
          customDays: 7,
          status: 'pending',
          date: today.toISOString(),
          dateKey: this.formatDateKey(today)
        },
        {
          id: Date.now() + 2,
          title: 'Read for 20 minutes',
          description: 'Read a book, article, or educational material',
          successPoints: 15,
          failPoints: -5,
          frequency: 'daily',
          customDays: 7,
          status: 'success',
          date: today.toISOString(),
          dateKey: this.formatDateKey(today)
        },
        {
          id: Date.now() + 3,
          title: 'Weekly Team Meeting',
          description: 'Attend the weekly team sync meeting',
          successPoints: 25,
          failPoints: -15,
          frequency: 'weekly',
          customDays: 7,
          status: 'pending',
          date: today.toISOString(),
          dateKey: this.formatDateKey(today)
        },
        {
          id: Date.now() + 4,
          title: 'Learn Something New',
          description: 'Spend time learning a new skill or technology',
          successPoints: 30,
          failPoints: -10,
          frequency: 'custom',
          customDays: 3,
          status: 'pending',
          date: today.toISOString(),
          dateKey: this.formatDateKey(today)
        },
        {
          id: Date.now() + 5,
          title: 'Complete Project Report',
          description: 'Finish and submit the quarterly project report',
          successPoints: 50,
          failPoints: -25,
          frequency: 'once',
          customDays: 7,
          status: 'pending',
          date: today.toISOString(),
          dateKey: this.formatDateKey(today)
        }
      ]

      // Demo tasks for yesterday
      const yesterdayTasks = [
        {
          id: Date.now() + 10,
          title: 'Drink 8 glasses of water',
          description: 'Stay hydrated throughout the day',
          successPoints: 10,
          failPoints: -5,
          frequency: 'daily',
          customDays: 7,
          status: 'success',
          date: yesterday.toISOString(),
          dateKey: this.formatDateKey(yesterday)
        },
        {
          id: Date.now() + 11,
          title: 'Meditate for 15 minutes',
          description: 'Practice mindfulness or breathing exercises',
          successPoints: 20,
          failPoints: -8,
          frequency: 'daily',
          customDays: 7,
          status: 'fail',
          date: yesterday.toISOString(),
          dateKey: this.formatDateKey(yesterday)
        },
        {
          id: Date.now() + 12,
          title: 'Review Monthly Budget',
          description: 'Check expenses and update budget spreadsheet',
          successPoints: 35,
          failPoints: -15,
          frequency: 'monthly',
          customDays: 30,
          status: 'success',
          date: yesterday.toISOString(),
          dateKey: this.formatDateKey(yesterday)
        }
      ]

      // Demo tasks for two days ago
      const twoDaysAgoTasks = [
        {
          id: Date.now() + 20,
          title: 'Weekly Grocery Shopping',
          description: 'Buy groceries for the week',
          successPoints: 15,
          failPoints: -8,
          frequency: 'weekly',
          customDays: 7,
          status: 'success',
          date: twoDaysAgo.toISOString(),
          dateKey: this.formatDateKey(twoDaysAgo)
        },
        {
          id: Date.now() + 21,
          title: 'Call Family',
          description: 'Check in with family members',
          successPoints: 25,
          failPoints: -10,
          frequency: 'custom',
          customDays: 5,
          status: 'success',
          date: twoDaysAgo.toISOString(),
          dateKey: this.formatDateKey(twoDaysAgo)
        }
      ]

      // Demo tasks for a week ago
      const weekAgoTasks = [
        {
          id: Date.now() + 30,
          title: 'Organize Workspace',
          description: 'Clean and organize desk and work area',
          successPoints: 20,
          failPoints: -5,
          frequency: 'weekly',
          customDays: 7,
          status: 'success',
          date: weekAgo.toISOString(),
          dateKey: this.formatDateKey(weekAgo)
        },
        {
          id: Date.now() + 31,
          title: 'Practice Guitar',
          description: 'Practice guitar for 30 minutes',
          successPoints: 25,
          failPoints: -10,
          frequency: 'custom',
          customDays: 2,
          status: 'fail',
          date: weekAgo.toISOString(),
          dateKey: this.formatDateKey(weekAgo)
        }
      ]

      // Save all demo tasks
      this.saveDemoTasksForDate(todayTasks, this.formatDateKey(today))
      this.saveDemoTasksForDate(yesterdayTasks, this.formatDateKey(yesterday))
      this.saveDemoTasksForDate(twoDaysAgoTasks, this.formatDateKey(twoDaysAgo))
      this.saveDemoTasksForDate(weekAgoTasks, this.formatDateKey(weekAgo))

      // Create history records for completed tasks
      this.createDemoHistoryRecords(todayTasks, today)
      this.createDemoHistoryRecords(yesterdayTasks, yesterday)
      this.createDemoHistoryRecords(twoDaysAgoTasks, twoDaysAgo)
      this.createDemoHistoryRecords(weekAgoTasks, weekAgo)

      // Create some demo trash items
      this.createDemoTrashItems()

      // Refresh the UI
      this.refreshTrigger++
      this.loadHistoryForDate()
    },

    saveDemoTasksForDate(tasks, dateKey) {
      const existingTasks = this.getTasksForDate(dateKey)
      const existingIds = new Set(existingTasks.map(t => t.id))

      // Only add tasks that don't already exist
      const newTasks = tasks.filter(task => !existingIds.has(task.id))

      if (newTasks.length > 0) {
        const mergedTasks = [...existingTasks, ...newTasks]
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(mergedTasks))
      }
    },

    createDemoHistoryRecords(tasks, date) {
      const dateKey = this.formatDateKey(date)
      const completedTasks = tasks.filter(task => task.status !== 'pending')

      if (completedTasks.length === 0) return

      const existingHistory = this.getHistoryRecordsForDate(dateKey)
      const existingHistoryIds = new Set(existingHistory.map(h => h.id))

      const newHistoryRecords = []

      completedTasks.forEach(task => {
        if (!existingHistoryIds.has(task.id)) {
          // Create completion time within the day
          const completionDate = new Date(date)
          completionDate.setHours(
            Math.floor(Math.random() * 16) + 6, // Random hour between 6 AM and 10 PM
            Math.floor(Math.random() * 60), // Random minute
            0, 0
          )

          newHistoryRecords.push({
            id: task.id,
            title: task.title,
            description: task.description,
            successPoints: task.successPoints,
            failPoints: task.failPoints,
            status: task.status,
            completedDate: completionDate.toISOString(),
            originalTaskId: task.id
          })
        }
      })

      if (newHistoryRecords.length > 0) {
        const mergedHistory = [...existingHistory, ...newHistoryRecords]
        localStorage.setItem(`history_${dateKey}`, JSON.stringify(mergedHistory))
      }
    },

    createDemoTrashItems() {
      const existingTrash = JSON.parse(localStorage.getItem('todo_trash') || '[]')
      const existingTrashIds = new Set(existingTrash.map(t => t.id))

      const demoTrashItems = [
        {
          id: Date.now() + 100,
          title: 'Old Task Example',
          description: 'This is an example of a deleted task',
          successPoints: 15,
          failPoints: -5,
          frequency: 'daily',
          customDays: 7,
          status: 'pending',
          originalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          deletedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
          id: Date.now() + 101,
          title: 'Cancelled Project',
          description: 'A project that was cancelled and moved to trash',
          successPoints: 40,
          failPoints: -20,
          frequency: 'once',
          customDays: 7,
          status: 'pending',
          originalDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          deletedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
      ]

      const newTrashItems = demoTrashItems.filter(item => !existingTrashIds.has(item.id))

      if (newTrashItems.length > 0) {
        localStorage.setItem('todo_trash', JSON.stringify([...existingTrash, ...newTrashItems]))
      }
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
  padding: 0;
}

.main-card {
  border-radius: 2px;
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
  flex-wrap: nowrap;
}

.control-btn {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  min-width: auto;
}

.control-btn i {
  font-size: 14px;
  flex-shrink: 0;
}

.btn-text {
  white-space: nowrap;
  font-size: 13px;
}

.total-points {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.points-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.points-badge {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

/* Responsive header controls */
@media (max-width: 1200px) {
  .header-controls {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .header-controls {
    gap: 12px;
  }

  .import-export-controls {
    gap: 6px;
  }

  .control-btn {
    padding: 8px 10px;
    gap: 4px;
  }

  .btn-text {
    font-size: 12px;
  }

  .control-btn i {
    font-size: 13px;
  }
}

@media (max-width: 600px) {
  .header-controls {
    gap: 8px;
    flex-direction: column;
    align-items: center;
  }

  .import-export-controls {
    gap: 4px;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .control-btn {
    padding: 6px 8px;
    min-width: 36px;
    max-width: 80px;
    height: 36px;
    justify-content: center;
    flex: 1;
  }

  .btn-text {
    display: none;
  }

  .control-btn i {
    font-size: 14px;
    margin: 0;
  }

  .import-export-controls .el-upload {
    flex: 1;
    max-width: 80px;
  }

  .import-export-controls .el-upload .control-btn {
    width: 100%;
    height: 36px;
    min-width: 36px;
    max-width: 80px;
  }

  .total-points {
    margin-top: 4px;
  }

  .points-label {
    font-size: 13px;
  }

  .points-badge {
    font-size: 13px;
    padding: 3px 10px;
  }
}

@media (max-width: 480px) {
  .header-controls {
    gap: 6px;
    flex-direction: column;
    align-items: stretch;
  }

  .import-export-controls {
    gap: 3px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .control-btn {
    padding: 5px 6px;
    min-width: 32px;
    max-width: 70px;
    height: 32px;
  }

  .control-btn i {
    font-size: 13px;
  }

  .import-export-controls .el-upload {
    flex: 1;
    max-width: 70px;
  }

  .import-export-controls .el-upload .control-btn {
    width: 100%;
    height: 32px;
    min-width: 32px;
    max-width: 70px;
  }

  .ranking-display {
    order: -1;
    max-width: 100%;
    margin-bottom: 8px;
  }

  .total-points {
    align-self: center;
    margin-top: 8px;
  }

  .points-label {
    font-size: 12px;
  }

  .points-badge {
    font-size: 12px;
    padding: 2px 8px;
  }
}

@media (max-width: 360px) {
  .header-controls {
    gap: 4px;
  }

  .import-export-controls {
    gap: 2px;
    max-width: 100%;
  }

  .control-btn {
    padding: 4px 5px;
    min-width: 28px;
    max-width: 60px;
    height: 30px;
  }

  .control-btn i {
    font-size: 12px;
  }

  .import-export-controls .el-upload {
    flex: 1;
    max-width: 60px;
  }

  .import-export-controls .el-upload .control-btn {
    width: 100%;
    height: 30px;
    min-width: 28px;
    max-width: 60px;
  }

  .points-label {
    font-size: 11px;
  }

  .points-badge {
    font-size: 11px;
    padding: 2px 6px;
  }
}

@media (max-width: 320px) {
  .import-export-controls {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 2px;
  }

  .control-btn {
    flex: 1;
    min-width: 26px;
    max-width: 50px;
    height: 28px;
    padding: 3px 4px;
  }

  .control-btn i {
    font-size: 11px;
  }

  .import-export-controls .el-upload {
    flex: 1;
    max-width: 50px;
  }

  .import-export-controls .el-upload .control-btn {
    width: 100%;
    height: 28px;
    min-width: 26px;
    max-width: 50px;
  }
}

/* Task input and form styles */
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
  max-width: 300px;
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
  flex-direction: column;
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

.task-completion-status {
  display: flex;
  align-items: center;
}

.completion-tag {
  font-weight: 600;
}

.task-edit-form {
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
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.edit-input,
.edit-select {
  width: 100%;
}

.edit-points-row {
  margin-top: 8px;
}

.edit-points-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.edit-points-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 140px;
}

.edit-number-input {
  width: 100%;
}

.task-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  margin-top: 8px;
}

.normal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
  justify-content: flex-end;
}

.status-actions,
.manage-actions,
.reset-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.edit-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  width: 100%;
  justify-content: flex-end;
}

.status-display {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.status-tag {
  font-weight: 600;
}

.action-btn,
.status-btn,
.reset-btn,
.manage-btn {
  padding: 6px 8px;
  border-radius: 4px;
}

.no-tasks {
  text-align: center;
  padding: 40px 20px;
}

/* History controls */
.history-controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.responsive-date-picker {
  max-width: 200px;
}

.history-date-title {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.history-tasks {
  display: grid;
  gap: 16px;
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
}

.history-task-status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.status-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.history-status-tag {
  white-space: nowrap;
}

.history-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.history-delete-btn {
  margin: 0;
  padding: 8px;
  min-width: 32px;
  height: 32px;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
}

/* Trash controls */
.trash-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.clear-trash-btn {
  margin: 0;
}

.trash-tasks {
  display: grid;
  gap: 16px;
}

.task-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.date-label {
  font-weight: 500;
}

.date-value {
  font-weight: normal;
}

.trash-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.trash-action-btn {
  padding: 6px 8px;
}

/* Analytics controls */
.analytics-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.responsive-radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chart-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  min-width: 100px;
  justify-content: center;
}

.chart-option i {
  font-size: 16px;
}

.option-text {
  font-size: 13px;
}

.chart-container {
  background: #fafbfc;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid #e4e7ec;
}

.responsive-chart {
  max-height: 400px;
  width: 100% !important;
  height: 400px !important;
}

/* Monthly summary styles */
.monthly-summary {
  margin-top: 24px;
}

.summary-card {
  border-radius: 12px;
  border: 1px solid #e4e7ec;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.summary-title {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 8px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #cbd5e1 100%);
  border-radius: 10px;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(45deg, #409eff, #67c23a);
  transition: width 0.3s ease;
}

.stat-item:hover::before {
  width: 6px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.stat-icon::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  margin: 0;
  line-height: 1.2;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #2c3e50 0%, #409eff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-item:nth-child(1) .stat-icon {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
}

.stat-item:nth-child(2) .stat-icon {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
}

.stat-item:nth-child(3) .stat-icon {
  background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
  box-shadow: 0 2px 8px rgba(142, 68, 173, 0.3);
}

/* Responsive tabs */
.responsive-tabs {
  width: 100%;
}

.responsive-tabs .el-tabs__header {
  margin-bottom: 0;
}

.responsive-tabs .el-tabs__nav-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.responsive-tabs .el-tabs__nav-wrap::-webkit-scrollbar {
  display: none;
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

/* Task status classes */
.task-success {
  border-left: 4px solid #67c23a;
}

.task-fail {
  border-left: 4px solid #f56c6c;
}

.task-pending {
  border-left: 4px solid #e6a23c;
}

/* Enhanced Ranking display styles */
.ranking-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
  flex-shrink: 0;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 25px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.rank-badge::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 25px;
  padding: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  z-index: -1;
}

.rank-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.rank-badge::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
  z-index: 1;
}

.rank-badge:hover::after {
  left: 100%;
}

.rank-icon {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
  z-index: 2;
}

.rank-icon::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%);
  z-index: 1;
}

.rank-icon i {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.rank-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 2;
}

.rank-name {
  font-weight: 700;
  font-size: 16px;
  color: #1a202c;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rank-level {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.rank-details-icon {
  margin-left: 8px;
  display: flex;
  align-items: center;
  z-index: 2;
}

.rank-info-icon {
  color: #4299e1;
  cursor: pointer;
  font-size: 18px;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.2);
}

.rank-info-icon:hover {
  background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.ranking-details {
  padding: 16px 0;
}

.current-rank-details,
.next-rank-details,
.all-ranks-preview {
  margin-bottom: 20px;
}

.current-rank-details h4,
.next-rank-details h4,
.all-ranks-preview h4 {
  margin: 0 0 12px 0;
  color: #2d3748;
  font-size: 15px;
  font-weight: 600;
  padding-bottom: 6px;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.current-rank-details h4::after,
.next-rank-details h4::after,
.all-ranks-preview h4::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.rank-item:hover {
  background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
  transform: translateY(-1px);
}

.rank-item.current-rank {
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  border-color: #4299e1;
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.2);
}

.rank-item.current-rank::before {
  content: '✓';
  position: absolute;
  right: 8px;
  color: #2b6cb0;
  font-weight: bold;
  font-size: 12px;
}

.rank-item i {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.rank-preview-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
}

.rank-preview-threshold {
  font-size: 11px;
  color: #718096;
  font-weight: 500;
  padding: 2px 6px;
  background-color: #edf2f7;
  border-radius: 8px;
}

.rank-progress {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 13px;
  color: #4a5568;
  font-weight: 600;
}

.progress-percentage {
  font-size: 13px;
  color: #4a5568;
  font-weight: 700;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.progress-percentage.max-rank {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
}

.rank-progress-bar {
  margin: 8px 0;
}

.next-rank-info,
.max-rank-info {
  text-align: center;
  margin-top: 6px;
}

.next-rank-text,
.max-rank-text {
  font-size: 11px;
  color: #718096;
  font-weight: 500;
  padding: 4px 8px;
  background-color: #edf2f7;
  border-radius: 8px;
  display: inline-block;
}

.max-rank-text {
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #2f855a;
  font-weight: 600;
}

/* Mobile optimizations for task cards */
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
    min-width: calc(4 * 90px);
  }

  .task-content {
    gap: 12px;
  }

  .task-actions {
    padding-top: 10px;
    margin-top: 6px;
    gap: 6px;
  }

  .normal-actions {
    gap: 6px;
    flex-wrap: wrap;
  }

  .status-actions,
  .manage-actions,
  .reset-actions {
    gap: 4px;
  }

  .history-task-content {
    gap: 12px;
  }

  .history-task-status {
    gap: 8px;
    flex-direction: row;
    align-items: center;
  }

  .history-status-tag {
    font-size: 12px;
    padding: 4px 8px;
  }

  .history-delete-btn {
    padding: 6px;
    min-width: 28px;
    height: 28px;
  }

  .task-meta-history {
    gap: 8px;
  }

  .monthly-summary {
    margin-top: 20px;
  }

  .summary-title {
    font-size: 1.15rem;
    margin-bottom: 16px;
    padding-bottom: 10px;
  }

  .summary-stats {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 4px 0;
  }

  .stat-item {
    padding: 14px;
    gap: 14px;
  }

  .stat-icon {
    width: 42px;
    height: 42px;
    font-size: 18px;
  }

  .stat-label {
    font-size: 13px;
  }

  .stat-value {
    font-size: 22px;
  }

  .chart-container {
    padding: 16px;
    margin: 16px 0;
  }

  .responsive-chart {
    max-height: 300px;
    height: 300px !important;
  }

  .ranking-display {
    min-width: 180px;
  }

  .rank-badge {
    gap: 10px;
    padding: 10px 14px;
  }

  .rank-icon {
    font-size: 24px;
    width: 42px;
    height: 42px;
  }

  .rank-name {
    font-size: 15px;
  }

  .rank-level {
    font-size: 11px;
  }

  .rank-info-icon {
    font-size: 16px;
    padding: 5px;
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
    min-width: calc(4 * 80px);
  }

  .task-content {
    gap: 10px;
  }

  .task-actions {
    padding-top: 8px;
    margin-top: 4px;
    gap: 4px;
    flex-wrap: wrap;
  }

  .normal-actions {
    gap: 4px;
    flex-direction: row;
    justify-content: flex-end;
  }

  .status-actions,
  .manage-actions,
  .reset-actions {
    gap: 3px;
  }

  .edit-actions {
    gap: 4px;
  }

  .history-task-content {
    gap: 8px;
  }

  .history-task-status {
    gap: 6px;
    min-width: 0;
  }

  .history-status-tag {
    font-size: 11px;
    padding: 3px 6px;
    min-width: 0;
  }

  .history-delete-btn {
    padding: 5px;
    min-width: 26px;
    height: 26px;
  }

  .history-delete-btn i {
    font-size: 12px;
  }

  .task-meta-history {
    gap: 6px;
    flex-wrap: wrap;
  }

  .completion-time .el-tag {
    font-size: 11px;
    padding: 2px 4px;
  }

  .time-text {
    font-size: 10px;
  }

  .monthly-summary {
    margin-top: 16px;
  }

  .summary-title {
    font-size: 1.1rem;
    margin-bottom: 14px;
    padding-bottom: 8px;
  }

  .summary-stats {
    gap: 12px;
  }

  .stat-item {
    padding: 12px;
    gap: 12px;
    border-radius: 8px;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-value {
    font-size: 20px;
  }

  .chart-container {
    padding: 12px;
    margin: 12px 0;
  }

  .responsive-chart {
    max-height: 250px;
    height: 250px !important;
  }

  .ranking-display {
    min-width: 160px;
  }

  .rank-badge {
    gap: 8px;
    padding: 8px 12px;
  }

  .rank-icon {
    font-size: 22px;
    width: 38px;
    height: 38px;
  }

  .rank-name {
    font-size: 14px;
  }

  .rank-level {
    font-size: 10px;
  }

  .rank-info-icon {
    font-size: 15px;
    padding: 4px;
  }

  .rank-progress {
    padding: 10px;
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
    min-width: calc(4 * 75px);
  }

  .task-actions {
    padding-top: 6px;
    margin-top: 2px;
    gap: 3px;
  }

  .normal-actions {
    gap: 3px;
  }

  .status-actions,
  .manage-actions,
  .reset-actions {
    gap: 2px;
  }

  .edit-actions {
    gap: 3px;
  }

  .history-task-status {
    gap: 4px;
  }

  .history-status-tag {
    font-size: 10px;
    padding: 2px 4px;
  }

  .history-delete-btn {
    padding: 4px;
    min-width: 24px;
    height: 24px;
  }

  .history-delete-btn i {
    font-size: 11px;
  }

  .monthly-summary {
    margin-top: 12px;
  }

  .summary-title {
    font-size: 1rem;
    margin-bottom: 12px;
    padding-bottom: 6px;
  }

  .summary-stats {
    gap: 10px;
  }

  .stat-item {
    padding: 10px;
    gap: 10px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 18px;
  }

  .ranking-display {
    min-width: 140px;
  }

  .rank-badge {
    gap: 6px;
    padding: 6px 10px;
  }

  .rank-icon {
    font-size: 20px;
    width: 34px;
    height: 34px;
  }

  .rank-name {
    font-size: 13px;
  }

  .rank-level {
    font-size: 9px;
  }

  .rank-info-icon {
    font-size: 14px;
    padding: 3px;
  }

  .rank-progress {
    padding: 8px;
  }

  .progress-text,
  .progress-percentage {
    font-size: 12px;
  }
}

/* Demo button specific fix for mobile */
@media (max-width: 600px) {
  .control-btn .btn-text {
    display: none;
  }

  .control-btn i {
    display: block !important;
    font-size: 14px;
    margin: 0;
  }

  .demo-btn i {
    display: inline-block !important;
    font-size: 14px;
    margin: 0;
  }
}

@media (max-width: 480px) {
  .control-btn i {
    font-size: 13px;
  }

  .demo-btn i {
    font-size: 13px !important;
  }
}

@media (max-width: 360px) {
  .control-btn i {
    font-size: 12px;
  }

  .demo-btn i {
    font-size: 12px !important;
  }
}
</style>
