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
              <div class="rank-icon" @click="openRankImagePreview" style="cursor: pointer;">
                <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="rank-image" />
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
                        <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="rank-preview-image" />
                        <span class="rank-name">{{ currentRank.name }}</span>
                        <span class="rank-points">{{ currentRank.threshold }}+ {{ $t('todo.points') }}</span>
                      </div>
                    </div>
                    <div class="next-rank-details" v-if="currentRank.nextRankName">
                      <h4>{{ $t('todo.nextRankTarget') }}</h4>
                      <div class="rank-item">
                        <img :src="getNextRankImage()" :alt="currentRank.nextRankName" class="rank-preview-image" />
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
                          :key="`rank-${rank.key}-${rank.threshold}`"
                          class="rank-preview-item"
                          :class="{ 'current-rank': rank.threshold <= totalPoints }"
                        >
                          <img :src="rank.image" :alt="getRankName(rank.key)" class="rank-grid-image" />
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
        <!-- Task List Tab -->
        <el-tab-pane :label="$t('todo.taskList')" name="tasks">
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
                :key="`task-${task.id}-${task.dateKey || 'default'}`"
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
                :key="`history-${task.id}-${task.completedDate || task.date || Date.now()}`"
                class="task-card history-task-card responsive-history-card"
                :class="getTaskStatusClass(task.status)"
            >
              <div class="task-content history-task-content">
                <div class="history-task-main">
                  <div class="task-info history-task-info">
                    <h4 class="task-title history-task-title">{{ task.title }}</h4>
                    <p v-if="task.description" class="task-description history-task-description">{{ task.description }}</p>
                  </div>
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
                :key="`trash-${task.id}-${task.deletedDate || task.originalDate || Date.now()}`"
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
                        <path class="circle-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path class="circle"
                              :stroke-dasharray="`${Math.min(currentMonthPoints / 100, 100)}, 100`"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
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
                        <path class="circle-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path class="circle"
                              :stroke-dasharray="`${Math.min(currentMonthCompleted / 10, 100)}, 100`"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
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
                        <path class="circle-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path class="circle"
                              :stroke-dasharray="`${successRate}, 100`"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
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
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Full Screen Ranking Modal -->
    <el-dialog
      :visible.sync="showFullScreenRanking"
      width="90%"
      :before-close="closeFullScreenRanking"
      custom-class="full-screen-ranking-modal"
      :show-close="false"
    >
      <div class="full-screen-ranking-header">
        <h2 class="modal-title">{{ $t('todo.rankingSystem') }}</h2>
        <el-button
          type="primary"
          icon="el-icon-close"
          circle
          @click="closeFullScreenRanking"
          class="close-btn"
        ></el-button>
      </div>

      <div class="full-screen-ranking-content">
        <div class="current-rank-showcase">
          <div class="showcase-rank-icon">
            <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="showcase-rank-image" />
          </div>
          <div class="showcase-rank-info">
            <h3 class="showcase-rank-name">{{ currentRank.name }}</h3>
            <p class="showcase-rank-level">{{ $t('todo.rankLevel', { level: currentRank.level }) }}</p>
            <p class="showcase-rank-points">{{ totalPoints }} {{ $t('todo.points') }}</p>
          </div>
        </div>

        <div class="full-screen-ranks-grid">
          <div
            v-for="rank in achievedRanksForDisplay"
            :key="`fullscreen-rank-${rank.key}-${rank.threshold}`"
            class="full-screen-rank-item"
            :class="{ 'current-rank': rank.threshold <= totalPoints }"
          >
            <img :src="rank.image" :alt="getRankName(rank.key)" class="full-screen-rank-image" />
            <div class="full-screen-rank-details">
              <span class="full-screen-rank-name">{{ getRankName(rank.key) }}</span>
              <span class="full-screen-rank-threshold">{{ rank.threshold }}+ {{ $t('todo.points') }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Fullscreen Current Rank Image Preview -->
    <el-dialog
      :visible.sync="showRankImagePreview"
      fullscreen
      :show-close="false"
      custom-class="rank-image-preview-dialog"
    >
      <div class="rank-image-preview-container" @click="showRankImagePreview = false">
        <img
          :src="getRankImage(currentRank.name)"
          :alt="currentRank.name"
          class="rank-image-fullscreen"
        />
        <div class="rank-image-preview-meta">
          <span class="name">{{ currentRank.name }}</span>
          <span class="level">{{ $t('todo.rankLevel', { level: currentRank.level }) }}</span>
          <span class="points">{{ totalPoints }} {{ $t('todo.points') }}</span>
          <span class="hint">Tap anywhere to close</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'TodoGamification',
  data() {
    return {
      activeTab: 'tasks',
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

      // Ranking system data - using images instead of icons
      ranks: [
        { level: 20, key: 'legendary', threshold: 100000, color: '#FFD700', image: '/assets/rankings/legendary.png' },
        { level: 19, key: 'mythic', threshold: 80000, color: '#FF6B35', image: '/assets/rankings/mythic.png' },
        { level: 18, key: 'immortal', threshold: 64000, color: '#E74C3C', image: '/assets/rankings/immortal.png' },
        { level: 17, key: 'divine', threshold: 52000, color: '#9B59B6', image: '/assets/rankings/divine.png' },
        { level: 16, key: 'celestial', threshold: 42000, color: '#3498DB', image: '/assets/rankings/celestial.png' },
        { level: 15, key: 'grandmaster', threshold: 34000, color: '#1ABC9C', image: '/assets/rankings/grandmaster.png' },
        { level: 14, key: 'master', threshold: 28000, color: '#2ECC71', image: '/assets/rankings/master.png' },
        { level: 13, key: 'diamond', threshold: 23000, color: '#85C1E9', image: '/assets/rankings/diamond.png' },
        { level: 12, key: 'platinum', threshold: 19000, color: '#AED6F1', image: '/assets/rankings/platinum.png' },
        { level: 11, key: 'gold', threshold: 15600, color: '#F7DC6F', image: '/assets/rankings/gold.png' },
        { level: 10, key: 'silver', threshold: 12800, color: '#D5DBDB', image: '/assets/rankings/silver.png' },
        { level: 9, key: 'bronze', threshold: 10400, color: '#CD853F', image: '/assets/rankings/bronze.png' },
        { level: 8, key: 'iron', threshold: 8400, color: '#2C3E50', image: '/assets/rankings/iron.png' },
        { level: 7, key: 'steel', threshold: 6800, color: '#566573', image: '/assets/rankings/steel.png' },
        { level: 6, key: 'stone', threshold: 5400, color: '#7D8B8C', image: '/assets/rankings/stone.png' },
        { level: 5, key: 'wood', threshold: 4200, color: '#8B4513', image: '/assets/rankings/wood.png' },
        { level: 4, key: 'apprentice', threshold: 3200, color: '#52C41A', image: '/assets/rankings/apprentice.png' },
        { level: 3, key: 'novice', threshold: 2400, color: '#13C2C2', image: '/assets/rankings/novice.png' },
        { level: 2, key: 'trainee', threshold: 1600, color: '#722ED1', image: '/assets/rankings/trainee.png' },
        { level: 1, key: 'beginner', threshold: 0, color: '#595959', image: '/assets/rankings/beginner.png' }
      ],
      showFullScreenRanking: false,
      showRankImagePreview: false
    }
  },
  computed: {
    allTasks() {
      this.refreshTrigger
      return this.getAllTasks()
    },
    filteredTasks() {
      let tasks = this.allTasks

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
              return this.shouldShowDoneTag(task) && (task.status === 'success' || task.status === 'fail')
            default:
              return true
          }
        })
      }

      // Sort by points (desc), then by creation date (newest first) as tiebreaker
      return tasks.sort((a, b) => {
        const aPoints = a.successPoints || 0
        const bPoints = b.successPoints || 0
        if (bPoints !== aPoints) return bPoints - aPoints
        const aDate = new Date(a.date || 0).getTime()
        const bDate = new Date(b.date || 0).getTime()
        return bDate - aDate
      })
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
    achievedRanksForDisplay() {
      return this.sortedRanksForDisplay.filter(r => r.threshold <= this.totalPoints)
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
        id: Date.now() + Math.floor(Math.random() * 1000), // Add random component to ensure uniqueness
        title: this.newTask.title,
        description: this.newTask.description,
        successPoints: this.newTask.successPoints,
        failPoints: this.newTask.failPoints,
        frequency: this.newTask.frequency,
        customDays: this.newTask.customDays,
        status: 'pending',
        date: new Date().toISOString(),
        dateKey: 'general' // Use a general key instead of date-specific
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
      const tasks = this.getAllTasks()
      const task = tasks.find(t => t.id === taskId)

      if (task) {
        // Update task status
        task.status = status
        this.updateTaskInStorage(task)

        this.createHistoryRecord(task, status)
        const points = status === 'success' ? task.successPoints : task.failPoints

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
      const dateKey = task.dateKey || 'general'
      const existingTasks = this.getTasksForDate(dateKey)
      existingTasks.push(task)
      localStorage.setItem(`todo_${dateKey}`, JSON.stringify(existingTasks))
    },
    updateTaskInStorage(task) {
      const dateKey = task.dateKey || 'general'
      const tasks = this.getTasksForDate(dateKey)
      const taskIndex = tasks.findIndex(t => t.id === task.id)

      if (taskIndex !== -1) {
        tasks[taskIndex] = task
        localStorage.setItem(`todo_${dateKey}`, JSON.stringify(tasks))
      }
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
      console.log('Loading history for date:', dateKey)
      this.historyTasks = this.getHistoryRecordsForDate(dateKey)
    },
    formatDateKey(date) {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const day = d.getDate().toString().padStart(2, '0')
      const key = `${year}-${month}-${day}`
      console.log('Loading history for date:', key)
      return key
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

      const tasks = this.getAllTasks()
      const task = tasks.find(t => t.id === taskId)

      if (task) {
        task.title = this.editingTask.title
        task.description = this.editingTask.description
        task.successPoints = this.editingTask.successPoints
        task.failPoints = this.editingTask.failPoints
        task.frequency = this.editingTask.frequency
        task.customDays = this.editingTask.customDays

        this.updateTaskInStorage(task)

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
      const tasks = this.getAllTasks()
      const task = tasks.find(t => t.id === taskId)

      if (task) {
        const dateKey = task.dateKey || 'general'
        this.moveTaskToTrash(taskId, dateKey)
      }
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
        originalTaskId: task.id,
        historyId: `${task.id}-${Date.now()}` // Add unique history identifier
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
    closeFullScreenRanking() {
      this.showFullScreenRanking = false
    },
    openRankImagePreview() {
      this.showRankImagePreview = true
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

    getRankImage(rankName) {
      // Extract the key from the localized name by finding the matching rank
      const rank = this.ranks.find(r => this.getRankName(r.key) === rankName)
      return rank ? rank.image : '/assets/rankings/beginner.png'
    },

    getRankColor(rankName) {
      // Extract the key from the localized name by finding the matching rank
      const rank = this.ranks.find(r => this.getRankName(r.key) === rankName)
      return rank ? rank.color : '#595959'
    },

    getNextRankImage() {
      if (!this.currentRank.nextThreshold) return '/assets/rankings/legendary.png'
      const sortedRanks = [...this.ranks].sort((a, b) => a.threshold - b.threshold) // Sort ascending
      const nextRank = sortedRanks.find(r => r.threshold === this.currentRank.nextThreshold)
      return nextRank ? nextRank.image : '/assets/rankings/legendary.png'
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
          return 'No tasks available'
      }
    },

    resetTaskStatus(taskId) {
      const tasks = this.getAllTasks()
      const task = tasks.find(t => t.id === taskId)

      if (task) {
        task.status = 'pending'
        this.updateTaskInStorage(task)
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
            this.activeTab = 'tasks'

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

      // Demo tasks for general use
      const demoTasks = [
        {
          id: Date.now() + Math.floor(Math.random() * 10000) + 1,
          title: 'Morning Exercise',
          description: 'Do 30 minutes of cardio or strength training',
          successPoints: 20,
          failPoints: -10,
          frequency: 'daily',
          customDays: 7,
          status: 'pending',
          date: today.toISOString(),
          dateKey: 'general'
        },
        {
          id: Date.now() + Math.floor(Math.random() * 10000) + 2,
          title: 'Read for 20 minutes',
          description: 'Read a book, article, or educational material',
          successPoints: 15,
          failPoints: -5,
          frequency: 'daily',
          customDays: 7,
          status: 'success',
          date: today.toISOString(),
          dateKey: 'general'
        },
        {
          id: Date.now() + Math.floor(Math.random() * 10000) + 3,
          title: 'Weekly Team Meeting',
          description: 'Attend the weekly team sync meeting',
          successPoints: 25,
          failPoints: -15,
          frequency: 'weekly',
          customDays: 7,
          status: 'pending',
          date: today.toISOString(),
          dateKey: 'general'
        },
        {
          id: Date.now() + Math.floor(Math.random() * 10000) + 4,
          title: 'Learn Something New',
          description: 'Spend time learning a new skill or technology',
          successPoints: 30,
          failPoints: -10,
          frequency: 'custom',
          customDays: 3,
          status: 'pending',
          date: today.toISOString(),
          dateKey: 'general'
        },
        {
          id: Date.now() + Math.floor(Math.random() * 10000) + 5,
          title: 'Complete Project Report',
          description: 'Finish and submit the quarterly project report',
          successPoints: 50,
          failPoints: -25,
          frequency: 'once',
          customDays: 7,
          status: 'pending',
          date: today.toISOString(),
          dateKey: 'general'
        }
      ]

      // Save demo tasks
      this.saveDemoTasksForDate(demoTasks, 'general')

      // Create history records for completed tasks
      this.createDemoHistoryRecords(demoTasks, today)

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
          id: Date.now() + Math.floor(Math.random() * 10000) + 100,
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
          id: Date.now() + Math.floor(Math.random() * 10000) + 101,
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

/* Place ranking display on the left on large screens only */
@media (min-width: 1200px) {
  .header-controls {
    display: flex;
  }
  .ranking-display {
    order: -1;          /* move to the left */
    margin-right: auto; /* push others to the right */
  }
  .import-export-controls {
    order: 0;
  }
  .total-points {
    order: 1;
  }
}

/* Responsive header controls */
@media (max-width: 1200px) {
  .header-controls {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  /* Center the header content (actions, rankings, points) */
  .header-controls {
    justify-content: center !important;
    align-items: center !important;
    text-align: center;
  }
  .ranking-display,
  .import-export-controls,
  .total-points {
    margin: 0 auto;
    align-self: center;
    text-align: center;
  }
  .ranking-display { min-width: 0; }

  /* Small screens: only show icons for import-export-controls */
  .import-export-controls .control-btn .btn-text {
    display: none !important;
  }

  /* Center icons inside import/export buttons */
  .import-export-controls .control-btn i {
    margin: 0 !important;
  }

  /* Make header buttons square and equal-sized (including el-upload button) */
  .todo-gamification { --hdr-btn-size: 40px; }

  .header-controls .control-btn {
    width: var(--hdr-btn-size) !important;
    min-width: var(--hdr-btn-size) !important;
    max-width: var(--hdr-btn-size) !important;
    height: var(--hdr-btn-size) !important;
    padding: 0 !important;
    justify-content: center;
  }

  .header-controls .el-upload {
    flex: 0 0 var(--hdr-btn-size);
    max-width: var(--hdr-btn-size);
  }
  .header-controls .el-upload .control-btn {
    width: var(--hdr-btn-size) !important;
    height: var(--hdr-btn-size) !important;
    min-width: var(--hdr-btn-size) !important;
    max-width: var(--hdr-btn-size) !important;
  }
}

@media (max-width: 600px) {
  .todo-gamification { --hdr-btn-size: 36px; }

  /* Apply to all header buttons, including upload's inner button */
  .header-controls .control-btn {
    width: var(--hdr-btn-size) !important;
    min-width: var(--hdr-btn-size) !important;
    max-width: var(--hdr-btn-size) !important;
    height: var(--hdr-btn-size) !important;
    padding: 0 !important;
    justify-content: center;
  }

  /* Keep el-upload wrapper aligned to the same size */
  .header-controls .el-upload {
    flex: 0 0 var(--hdr-btn-size);
    max-width: var(--hdr-btn-size);
  }
  .header-controls .el-upload .control-btn {
    width: var(--hdr-btn-size) !important;
    height: var(--hdr-btn-size) !important;
    min-width: var(--hdr-btn-size) !important;
    max-width: var(--hdr-btn-size) !important;
  }
}

@media (max-width: 480px) {
  .todo-gamification { --hdr-btn-size: 32px; }
}

@media (max-width: 360px) {
  .todo-gamification { --hdr-btn-size: 30px; }
}

@media (max-width: 320px) {
  .todo-gamification { --hdr-btn-size: 28px; }
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
  align-items: stretch;
  gap: 16px;
}

.history-task-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
  padding: 8px 0;
}

.history-task-info {
  width: 100%;
  margin-bottom: 12px;
}

.history-task-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.history-task-description {
  color: #666;
  line-height: 1.4;
  margin: 0;
  font-size: 14px;
}

.task-meta-history {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
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
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  justify-content: center;
  min-width: 100px;
}

.status-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.history-status-tag {
  white-space: nowrap;
  font-weight: 600;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
  z-index: 2;
  padding: 4px;
}

.rank-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
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
  position: relative;
}

.rank-item.current-rank::before {
  content: '✓';
  position: absolute;
  right: 8px;
  color: #2b6cb0;
  font-weight: bold;
  font-size: 12px;
}

.rank-preview-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 2px;
  flex-shrink: 0;
}

.ranks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.rank-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.rank-preview-item:hover {
  background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
  transform: translateY(-1px);
}

.rank-preview-item.current-rank {
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  border-color: #4299e1;
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.2);
}

.rank-preview-item.current-rank::before {
  content: '✓';
  position: absolute;
  top: 4px;
  right: 4px;
  color: #2b6cb0;
  font-weight: bold;
  font-size: 10px;
  background: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.rank-grid-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}

.rank-preview-name {
  font-size: 11px;
  font-weight: 600;
  color: #2d3748;
  text-align: center;
  line-height: 1.2;
}

.rank-preview-threshold {
  font-size: 10px;
  color: #718096;
  font-weight: 500;
  padding: 2px 6px;
  background-color: #edf2f7;
  border-radius: 8px;
}

/* Mobile responsive adjustments for images */
@media (max-width: 768px) {
  .rank-icon {
    width: 42px;
    height: 42px;
    padding: 3px;
  }

  .rank-preview-image {
    width: 18px;
    height: 18px;
  }

  .rank-grid-image {
    width: 28px;
    height: 28px;
  }

  .ranks-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }

  .rank-preview-item {
    padding: 6px 4px;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .rank-icon {
    width: 36px;
    height: 36px;
    padding: 2px;
  }

  .rank-preview-image {
    width: 16px;
    height: 16px;
  }

  .rank-grid-image {
    width: 24px;
    height: 24px;
  }

  .ranks-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 4px;
  }

  .rank-preview-item {
    padding: 4px 3px;
    gap: 3px;
  }

  .rank-preview-name {
    font-size: 10px;
  }

  .rank-preview-threshold {
    font-size: 9px;
    padding: 1px 4px;
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

/* Fullscreen Current Rank Image Preview */
.rank-image-preview-dialog .el-dialog__body {
  padding: 0;
  background: rgba(10, 10, 10, 0.95);
}

.rank-image-preview-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: grid;
  place-items: center;
  cursor: zoom-out;
  padding: 16px 16px 96px; /* reserve space for meta */
  box-sizing: border-box;
}

.rank-image-fullscreen {
  /* Never scale up, only scale down; appear smaller for better suitability */
  width: auto;
  height: auto;
  max-width: min(70vw, 900px);
  max-height: min(70vh, 900px);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

@media (max-height: 520px) {
  .rank-image-preview-container {
    padding-bottom: 72px;
  }
  .rank-image-fullscreen {
    max-width: min(80vw, 800px);
    max-height: min(60vh, 600px);
  }
}

.rank-image-preview-meta {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  backdrop-filter: blur(6px);
  font-size: 14px;
}
.rank-image-preview-meta .hint {
  opacity: 0.7;
  font-weight: 400;
}

/* Monthly Summary layout and visuals */
.monthly-summary {
  margin-top: 24px;
}

.enhanced-summary {
  border-radius: 12px;
  overflow: hidden;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
}

.summary-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.summary-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.summary-stats.enhanced-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.enhanced-stat-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.stat-visual {
  display: flex;
  align-items: center;
  gap: 12px;
}

.enhanced-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 22px;
}
.points-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.completed-icon { background: linear-gradient(135deg, #10b981, #34d399); }
.success-icon { background: linear-gradient(135deg, #3b82f6, #60a5fa); }

.stat-circle {
  width: 56px;
  height: 56px;
}

.circular-chart {
  width: 56px;
  height: 56px;
}
.circular-chart .circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3.2;
}
.circular-chart .circle {
  fill: none;
  stroke-width: 3.2;
  stroke-linecap: round;
  animation: progress 1.2s ease-out;
}
.circular-chart.gold .circle { stroke: #f59e0b; }
.circular-chart.green .circle { stroke: #10b981; }
.circular-chart.blue .circle { stroke: #3b82f6; }

@keyframes progress {
  0% { stroke-dasharray: 0 100; }
}

.enhanced-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.enhanced-value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
}

.stat-subtitle {
  color: #909399;
  font-size: 12px;
}

/* Chart container height for better balance with Monthly Summary */
.chart-container {
  width: 100%;
  height: 360px;
}
@media (min-width: 1200px) {
  .chart-container {
    height: 420px;
  }
}
@media (max-width: 768px) {
  .summary-stats.enhanced-stats {
    grid-template-columns: 1fr; /* keep small screens unchanged and readable */
    gap: 12px;
    padding: 12px;
  }
  .chart-container {
    height: 280px;
  }
}

/* Full Screen Ranking Modal */
.full-screen-ranking-modal {
  margin-top: 5vh !important;
  margin-bottom: 5vh !important;
}

.full-screen-ranking-modal .el-dialog {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
}

.full-screen-ranking-modal .el-dialog__body {
  flex: 1;
  padding: 0;
}

.full-screen-ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: -20px -20px 0 -20px;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.full-screen-ranking-content {
  padding: 30px;
  min-height: 500px;
}

.current-rank-showcase {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.showcase-rank-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
}

.showcase-rank-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.showcase-rank-info {
  text-align: center;
}

.showcase-rank-name {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.showcase-rank-level {
  font-size: 1.2rem;
  color: #666;
  margin: 0 0 8px 0;
}

.showcase-rank-points {
  font-size: 1.1rem;
  color: #409eff;
  font-weight: 600;
  margin: 0;
}

.full-screen-ranks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.full-screen-rank-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.full-screen-rank-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.full-screen-rank-item.current-rank {
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  border-color: #4299e1;
  box-shadow: 0 4px 20px rgba(66, 153, 225, 0.3);
}

.full-screen-rank-item.current-rank::before {
  content: '✓';
  position: absolute;
  top: 10px;
  right: 10px;
  color: #2b6cb0;
  font-weight: bold;
  font-size: 16px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.full-screen-rank-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.full-screen-rank-details {
  flex: 1;
}

.full-screen-rank-name {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.full-screen-rank-threshold {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 500;
}

/* Mobile responsive for full screen modal */
@media (max-width: 768px) {
  .full-screen-ranking-modal {
    margin: 0 !important;
  }

  .full-screen-ranking-header {
    padding: 15px 20px;
  }

  .modal-title {
    font-size: 1.3rem;
  }

  .full-screen-ranking-content {
    padding: 20px;
  }

  .current-rank-showcase {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .showcase-rank-icon {
    width: 100px;
    height: 100px;
  }

  .showcase-rank-name {
    font-size: 1.6rem;
  }

  .full-screen-ranks-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .full-screen-rank-item {
    padding: 15px;
  }

  .full-screen-rank-image {
    width: 50px;
    height: 50px;
  }

  .enhanced-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .enhanced-stat-item {
    padding: 15px;
    gap: 15px;
  }

  .enhanced-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  .points-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.completed-icon { background: linear-gradient(135deg, #10b981, #34d399); }
.success-icon { background: linear-gradient(135deg, #3b82f6, #60a5fa); }

  .stat-circle {
    width: 50px;
    height: 50px;
  }

  .circular-chart {
    width: 50px;
    height: 50px;
  }
}
</style>

