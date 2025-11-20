<template>
  <el-card class="main-card todo-gamification">
    <div slot="header">
      <TodoHeader
        :total-points="totalPoints"
        :current-rank="currentRankDisplay"
        :sorted-ranks-for-display="sortedRanksForDisplay"
        :rank-progress="rankProgress"
        :get-rank-name="key => getRankName(key)"
        :get-rank-class="name => getRankClass(name)"
        :get-rank-image="name => getRankImage(name)"
        :get-rank-color="name => getRankColor(name)"
        :get-next-rank-image="() => getNextRankImage()"
        :on-rank-image-error="e => onRankImageError(e)"
        @demo="createDemoTasks"
        @clear="clearAllData"
        @open-rank-image="openRankImagePreview"
      />
    </div>

    <el-tabs v-model="activeTab" type="card" class="responsive-tabs">
      <el-tab-pane :label="$t('todo.taskList')" name="tasks">
        <TaskInput :new-task="newTask" :on-add="() => addTask()" />
        <TaskFilters :task-filter.sync="taskFilter" :frequency-filter.sync="frequencyFilter" @reset-all="resetAllTaskStatuses" />
        <TaskList
          :tasks="filteredTasks"
          :editing-task-id="editingTaskId"
          :editing-task="editingTask"
          :empty-description="emptyDescriptionText"
          :get-task-status-class="s => getTaskStatusClass(s)"
          :get-frequency-text="(f, d) => getFrequencyText(f, d)"
          :should-show-done-tag="t => shouldShowDoneTag(t)"
          :should-show-status-display="t => shouldShowStatusDisplay(t)"
          :get-completion-tag-type="t => getCompletionTagType(t)"
          :get-completion-tag-text="t => getCompletionTagText(t)"
          :should-show-status-actions="t => shouldShowStatusActions(t)"
          :should-show-reset-action="t => shouldShowResetAction(t)"
          :on-complete="(id, status) => completeTask(id, status)"
          :on-start-edit="t => startTaskEdit(t)"
          :on-save-edit="id => saveTaskEdit(id)"
          :on-cancel-edit="() => cancelTaskEdit()"
          :on-delete="id => deleteTask(id)"
          :on-reset-status="id => resetTaskStatus(id)"
        />
      </el-tab-pane>

      <el-tab-pane :label="$t('todo.history')" name="history">
        <HistoryPanel
          :selected-date="selectedDate"
          :history-tasks="historyTasks"
          :format-date="d => formatDate(d)"
          :format-time="d => formatTime(d)"
          :get-task-status-class="s => getTaskStatusClass(s)"
          :on-date-changed="d => loadHistoryForDate(d)"
          :on-delete-history-record="(id, originalDate) => deleteHistoryRecord(id, originalDate)"
        />
      </el-tab-pane>

      <el-tab-pane :label="$t('todo.trash')" name="trash">
        <TrashList
          :trashed-tasks="trashedTasks"
          :format-date="d => formatDate(d)"
          :on-restore-task="id => restoreTask(id)"
          :on-permanently-delete-task="id => permanentlyDeleteTask(id)"
          :on-clear-trash-click="() => clearTrash()"
        />
      </el-tab-pane>

      <el-tab-pane :label="$t('todo.analytics')" name="analytics">
        <AnalyticsPanel
          :chart-type.sync="chartType"
          :monthly-data="getMonthlyData()"
          :current-month-points="currentMonthPoints"
          :current-month-completed="currentMonthCompleted"
          :success-rate="successRate"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Move dialogs inside root and append to body to keep behavior -->
    <el-dialog :visible.sync="showFullScreenRanking" width="90%" :before-close="closeFullScreenRanking" custom-class="full-screen-ranking-modal" :show-close="false" append-to-body>
      <div class="full-screen-ranking-header">
        <h2 class="modal-title">{{ $t('todo.rankingSystem') }}</h2>
        <el-button type="primary" icon="el-icon-close" circle @click="closeFullScreenRanking" class="close-btn"></el-button>
      </div>

      <div class="full-screen-ranking-content">
        <div class="current-rank-showcase">
          <div class="showcase-rank-icon">
            <img :src="getRankImage(currentRankDisplay.name)" :alt="currentRankDisplay.name" class="showcase-rank-image" />
          </div>
          <div class="showcase-rank-info">
            <h3 class="showcase-rank-name">{{ currentRankDisplay.name }}</h3>
            <p class="showcase-rank-level">{{ $t('todo.rankLevel', { level: currentRankDisplay.level }) }}</p>
            <p class="showcase-rank-points">{{ totalPoints }} {{ $t('todo.points') }}</p>
          </div>
        </div>

        <div class="full-screen-ranks-grid">
          <div v-for="rank in achievedRanksForDisplay" :key="`fullscreen-rank-${rank.key}-${rank.threshold}`" class="full-screen-rank-item" :class="{ 'current-rank': rank.threshold <= totalPoints }">
            <img :src="rank.image" :alt="getRankName(rank.key)" class="full-screen-rank-image" />
            <div class="full-screen-rank-details">
              <span class="full-screen-rank-name">{{ getRankName(rank.key) }}</span>
              <span class="full-screen-rank-threshold">{{ rank.threshold }}+ {{ $t('todo.points') }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="showRankImagePreview" fullscreen :show-close="false" custom-class="rank-image-preview-dialog" append-to-body>
      <div class="rank-image-preview-container" @click="showRankImagePreview = false">
        <img :src="getRankImage(currentRankDisplay.name)" :alt="currentRankDisplay.name" class="rank-image-fullscreen" />
      </div>
    </el-dialog>
  </el-card>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import TodoHeader from '@/page/todo/TodoHeader.vue'
import TaskInput from '@/page/todo/TaskInput.vue'
import TaskFilters from '@/page/todo/TaskFilters.vue'
import TaskList from '@/page/todo/TaskList.vue'
import HistoryPanel from '@/page/todo/HistoryPanel.vue'
import TrashList from '@/page/todo/TrashList.vue'
import AnalyticsPanel from '@/page/todo/AnalyticsPanel.vue'

// Local mapping for rank assets (images/colors) keyed by rank key
const RANK_ASSETS = {
  legendary: { color: '#FFD700', image: '/assets/rankings/legendary.png' },
  mythic: { color: '#FF6B35', image: '/assets/rankings/mythic.png' },
  immortal: { color: '#E74C3C', image: '/assets/rankings/immortal.png' },
  divine: { color: '#9B59B6', image: '/assets/rankings/divine.png' },
  celestial: { color: '#3498DB', image: '/assets/rankings/celestial.png' },
  grandmaster: { color: '#1ABC9C', image: '/assets/rankings/grandmaster.png' },
  master: { color: '#2ECC71', image: '/assets/rankings/master.png' },
  diamond: { color: '#85C1E9', image: '/assets/rankings/diamond.png' },
  platinum: { color: '#AED6F1', image: '/assets/rankings/platinum.png' },
  gold: { color: '#F7DC6F', image: '/assets/rankings/gold.png' },
  silver: { color: '#D5DBDB', image: '/assets/rankings/silver.png' },
  bronze: { color: '#CD853F', image: '/assets/rankings/bronze.png' },
  iron: { color: '#2C3E50', image: '/assets/rankings/iron.png' },
  steel: { color: '#566573', image: '/assets/rankings/steel.png' },
  stone: { color: '#7D8B8C', image: '/assets/rankings/stone.png' },
  wood: { color: '#8B4513', image: '/assets/rankings/wood.png' },
  apprentice: { color: '#52C41A', image: '/assets/rankings/apprentice.png' },
  novice: { color: '#13C2C2', image: '/assets/rankings/novice.png' },
  trainee: { color: '#722ED1', image: '/assets/rankings/trainee.png' },
  beginner: { color: '#595959', image: '/assets/rankings/beginner.png' }
}

export default {
  name: 'TodoGamification',
  components: { TodoHeader, TaskInput, TaskFilters, TaskList, HistoryPanel, TrashList, AnalyticsPanel },
  data() {
    return {
      activeTab: 'tasks',
      taskFilter: 'all',
      frequencyFilter: 'all',
      newTask: { title: '', description: '', successPoints: 10, failPoints: -5, frequency: 'once', customDays: 7 },
      selectedDate: new Date(),
      chartType: 'bar',
      editingTaskId: null,
      editingTask: { title: '', description: '', successPoints: 10, failPoints: -5, frequency: 'once', customDays: 7 },
      showFullScreenRanking: false,
      showRankImagePreview: false,
      fallbackRankImage: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" rx="8" fill="#f3f4f6"/><g fill="none" stroke="#cbd5e1" stroke-width="2"><rect x="10" y="10" width="44" height="44" rx="6"/><path d="M16 44l10-12 8 8 6-8 8 12" fill="none"/></g></svg>`),
      // internal holder for analytics summary (reactive)
      _analyticsSummary: { totalPoints: 0, completedCount: 0, successRatePct: 0 }
    }
  },
  computed: {
    ...mapState('todo', ['tasks', 'tasksMeta', 'history', 'historyMeta', 'trash', 'trashMeta', 'ranking', 'ranks', 'analyticsMonthly']),
    ...mapGetters('todo', ['todoTaskEtag']),

    allTasks() {
      // always use store tasks; server as source of truth
      return this.tasks || []
    },
    filteredTasks() {
      let tasks = [...this.allTasks]
      // Apply server-supported frequency filter client-side too (we also request it in fetch)
      if (this.frequencyFilter && this.frequencyFilter !== 'all') {
        tasks = tasks.filter(t => (t.frequency || 'once') === this.frequencyFilter)
      }
      // Map taskFilter to UI-specific concepts
      if (this.taskFilter === 'pending') {
        tasks = tasks.filter(t => t.status === 'pending')
      } else if (this.taskFilter === 'completed') {
        tasks = tasks.filter(t => t.status === 'success' || t.status === 'fail')
      } else if (this.taskFilter === 'done') {
        tasks = tasks.filter(t => this.shouldShowDoneTag(t) && (t.status === 'success' || t.status === 'fail'))
      }
      // default sort to points_desc then updatedAt/createdAt desc
      return tasks.sort((a, b) => {
        const ap = a.successPoints || 0; const bp = b.successPoints || 0; if (ap !== bp) return bp - ap
        const ad = new Date(a.updatedAt || a.createdAt || 0).getTime(); const bd = new Date(b.updatedAt || b.createdAt || 0).getTime(); return bd - ad
      })
    },

    // Provide empty description text for TaskList based on current filter
    emptyDescriptionText() {
      switch (this.taskFilter) {
        case 'pending': return this.$t('todo.noPendingTasks') || 'No pending tasks'
        case 'completed': return this.$t('todo.noCompletedTasks') || 'No completed tasks'
        case 'done': return this.$t('todo.noDoneTasks') || 'No done tasks'
        default: return this.$t('todo.noTasksAvailable') || 'No tasks available'
      }
    },

    // Ranking-related computed derived from API ranking + server ranks + local assets
    totalPoints() { return (this.ranking && typeof this.ranking.totalPoints === 'number') ? this.ranking.totalPoints : 0 },
    currentRankDisplay() {
      const current = this.ranking && this.ranking.currentRank ? this.ranking.currentRank : { key: 'beginner', threshold: 0, level: 1 }
      const next = this.ranking && this.ranking.nextRank ? this.ranking.nextRank : null
      const name = this.getRankName(current.key)
      return {
        ...current,
        name,
        nextThreshold: next ? next.threshold : null,
        nextRankName: next ? this.getRankName(next.key) : null
      }
    },
    serverRanksForDisplay() {
      // merge server ranks with local assets
      const defs = Array.isArray(this.ranks) ? this.ranks : []
      return defs.map(r => ({
        ...r,
        image: (RANK_ASSETS[r.key] && RANK_ASSETS[r.key].image) || '/assets/rankings/beginner.png',
        color: (RANK_ASSETS[r.key] && RANK_ASSETS[r.key].color) || '#595959'
      }))
    },
    sortedRanksForDisplay() { return [...this.serverRanksForDisplay].sort((a,b)=> b.threshold - a.threshold) },
    achievedRanksForDisplay() { return this.sortedRanksForDisplay.filter(r=> r.threshold <= this.totalPoints) },
    rankProgress() { return this.ranking && typeof this.ranking.progressPct === 'number' ? this.ranking.progressPct : 0 },

    // History & Trash mapped to store
    historyTasks() { return this.history || [] },
    trashedTasks() { return this.trash || [] },

    // Analytics summary for current month (defensive guards)
    currentMonthPoints() {
      const s = this._analyticsSummary || {}
      return typeof s.totalPoints === 'number' ? s.totalPoints : 0
    },
    currentMonthCompleted() {
      const s = this._analyticsSummary || {}
      return typeof s.completedCount === 'number' ? s.completedCount : 0
    },
    successRate() {
      const s = this._analyticsSummary || {}
      return typeof s.successRatePct === 'number' ? s.successRatePct : 0
    },
  },
  created() {
    // Initial loads
    this.fetchAllInitial()
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'history') {
        this.$nextTick(() => this.loadHistoryForDate(this.selectedDate))
      } else if (newTab === 'trash') {
        this.$nextTick(() => this.loadTrash())
      } else if (newTab === 'analytics') {
        this.$nextTick(() => this.loadAnalytics())
      }
    },
    taskFilter() { this.fetchTasksWithFilters() },
    frequencyFilter() { this.fetchTasksWithFilters() }
  },
  methods: {
    ...mapActions('todo', {
      fetchTasksAction: 'fetchTasks',
      createTaskAction: 'createTask',
      fetchTaskAction: 'fetchTask',
      updateTaskAction: 'updateTask',
      deleteTaskAction: 'deleteTask',
      completeTaskAction: 'completeTask',
      resetTaskStatusAction: 'resetTaskStatus',
      resetAllTaskStatusesAction: 'resetAllTaskStatuses',
      demoSeedAction: 'demoSeed',
      fetchTrashAction: 'fetchTrash',
      clearTrashAction: 'clearTrash',
      deleteTrashItemAction: 'deleteTrashItem',
      restoreTrashItemAction: 'restoreTrashItem',
      fetchHistoryAction: 'fetchHistory',
      deleteHistoryAction: 'deleteHistory',
      fetchRankingAction: 'fetchRanking',
      fetchRanksAction: 'fetchRanks',
      fetchAnalyticsMonthlyAction: 'fetchAnalyticsMonthly',
      fetchAnalyticsSummaryAction: 'fetchAnalyticsSummary'
    }),

    // UI helpers
    openRankImagePreview() { this.showRankImagePreview = true },
    closeFullScreenRanking() { this.showFullScreenRanking = false },
    getEmptyDescription() {
      switch (this.taskFilter) {
        case 'pending': return this.$t('todo.noPendingTasks') || 'No pending tasks'
        case 'completed': return this.$t('todo.noCompletedTasks') || 'No completed tasks'
        case 'done': return this.$t('todo.noDoneTasks') || 'No done tasks'
        default: return this.$t('todo.noTasksAvailable') || 'No tasks available'
      }
    },
    getFrequencyText(freq, days) {
      switch (freq) {
        case 'daily': return this.$t('todo.freqDaily') || 'Daily'
        case 'weekly': return this.$t('todo.freqWeekly') || 'Weekly'
        case 'monthly': return this.$t('todo.freqMonthly') || 'Monthly'
        case 'custom': return (this.$t('todo.freqEveryNDays', { days }) || `Every ${days} days`)
        default: return this.$t('todo.freqOnce') || 'One-time'
      }
    },

    async fetchAllInitial() {
      await Promise.all([
        this.fetchTasksWithFilters(),
        this.fetchRankingAction(),
        this.fetchRanksAction(),
        this.loadHistoryForDate(this.selectedDate),
        this.loadAnalytics()
      ])
    },

    // Map UI filters -> server query params, then fetch
    async fetchTasksWithFilters() {
      const params = { page: 1, pageSize: 100, sort: 'points_desc' }
      if (this.taskFilter === 'pending') params.status = 'pending'
      else if (this.taskFilter === 'completed' || this.taskFilter === 'done') params.status = 'all'
      else params.status = 'all'
      if (this.frequencyFilter && this.frequencyFilter !== 'all') params.frequency = this.frequencyFilter
      else params.frequency = 'all'
      try { await this.fetchTasksAction(params) } catch (_) { }
    },

    // Task CRUD
    async addTask() {
      if (!this.newTask.title || !this.newTask.title.trim()) return
      try {
        await this.createTaskAction({ body: {
          title: this.newTask.title,
          description: this.newTask.description || null,
          successPoints: this.newTask.successPoints,
          failPoints: this.newTask.failPoints,
          frequency: this.newTask.frequency,
          customDays: this.newTask.frequency === 'custom' ? this.newTask.customDays : null
        } })
        this.newTask = { title: '', description: '', successPoints: 10, failPoints: -5, frequency: 'once', customDays: 7 }
        await this.fetchTasksWithFilters()
        this.$message.success(this.$t('todo.taskAddedSuccess'))
      } catch (e) { }
    },
    async completeTask(taskId, status) {
      try {
        const res = await this.completeTaskAction({ id: taskId, status })
        await this.fetchTasksWithFilters()
        const points = res && res.history && typeof res.history.pointsApplied === 'number' ? res.history.pointsApplied : 0
        this.$message({ message: this.$t('todo.taskStatusUpdate', { status: this.$t(`todo.${status}`), points: points > 0 ? ('+' + points) : points }), type: status === 'success' ? 'success' : 'warning' })
      } catch (_) { }
    },

    async startTaskEdit(task) {
      try {
        const { task: latest } = await this.fetchTaskAction(task.id)
        const t = latest || task
        this.editingTaskId = t.id
        this.editingTask = {
          title: t.title || '',
          description: t.description || '',
          successPoints: t.successPoints,
          failPoints: t.failPoints,
          frequency: t.frequency || 'once',
          customDays: t.customDays || 7
        }
      } catch (_) { }
    },
    async saveTaskEdit(taskId) {
      if (!this.editingTask.title || !this.editingTask.title.trim()) { this.$message.warning(this.$t('todo.taskTitleRequired')); return }
      try {
        await this.updateTaskAction({ id: taskId, patch: {
          title: this.editingTask.title,
          description: this.editingTask.description || null,
          successPoints: this.editingTask.successPoints,
          failPoints: this.editingTask.failPoints,
          frequency: this.editingTask.frequency,
          customDays: this.editingTask.frequency === 'custom' ? this.editingTask.customDays : null
        } })
        this.editingTaskId = null
        await this.fetchTasksWithFilters()
        this.$message.success(this.$t('todo.taskUpdatedSuccess'))
      } catch (err) {
        const msg = (err && err.message) || ''
        if (/etag mismatch/i.test(msg)) {
          try {
            await this.fetchTaskAction(taskId)
            // Use todo-specific i18n title instead of missing common key
            this.$alert(this.$t('todo.etagMismatchRefetched') || 'The task was updated elsewhere. We reloaded the latest version. Please re-apply your changes.', this.$t('todo.editConflictTitle'), { type: 'warning' })
          } catch (_) {}
        }
      }
    },
    cancelTaskEdit() { this.editingTaskId = null; this.editingTask = { title:'', description:'', successPoints:10, failPoints:-5, frequency:'once', customDays:7 } },
    async deleteTask(taskId) {
      try {
        await this.deleteTaskAction(taskId)
        await Promise.all([ this.fetchTasksWithFilters(), this.loadTrash() ])
        this.$message.success(this.$t('todo.taskDeletedSuccess') || 'Task moved to trash')
      } catch (_) { }
    },

    shouldShowDoneTag(task) { const isNonDaily = task.frequency && task.frequency !== 'daily'; return isNonDaily && (task.status === 'success' || task.status === 'fail') },
    shouldShowStatusActions(task) { return task.status === 'pending' },
    shouldShowResetAction(task) { return task.status === 'success' || task.status === 'fail' },

    getCompletionTagType(task) { if (task.status==='success') return 'success'; if (task.status==='fail') return 'danger'; return 'info' },
    getCompletionTagText(task) { if (task.status==='success') return this.$t('todo.completed'); if (task.status==='fail') return this.$t('todo.failed'); return this.$t('common.done') },

    async resetTaskStatus(taskId) {
      try { await this.resetTaskStatusAction(taskId); await this.fetchTasksWithFilters(); this.$message.success(this.$t('todo.taskStatusReset') || 'Task status reset to pending') } catch (_) {}
    },
    async resetAllTaskStatuses() {
      try {
        const toConfirm = await this.$confirm(this.$t('todo.resetAllConfirm') || 'This will reset all tasks to Pending. Continue?', this.$t('todo.resetAllTitle'), { confirmButtonText: this.$t('todo.resetAll') || 'Reset All', cancelButtonText: this.$t('common.cancel') || 'Cancel', type:'warning' }).catch(() => false)
        if (!toConfirm) return
        await this.resetAllTaskStatusesAction()
        await this.fetchTasksWithFilters()
        this.$message.success(this.$t('todo.resetAllDone') || 'All applicable tasks reset to pending')
      } catch (_) {}
    },

    // Trash
    async loadTrash() { try { await this.fetchTrashAction({ page: 1, pageSize: 50 }) } catch (_) {} },
    async restoreTask(taskId) { try { await this.restoreTrashItemAction(taskId); await Promise.all([ this.loadTrash(), this.fetchTasksWithFilters() ]); this.$message.success(this.$t('todo.taskRestored') || 'Task restored successfully') } catch (_) {} },
    async permanentlyDeleteTask(taskId) { try { await this.deleteTrashItemAction(taskId); await this.loadTrash(); this.$message.success(this.$t('todo.trashDeleted') || 'Task permanently deleted') } catch (_) {} },
    async clearTrash() {
      const ok = await this.$confirm(this.$t('todo.clearTrashConfirm') || 'This will permanently delete all items in trash. This cannot be undone.', this.$t('todo.clearTrashTitle'), { confirmButtonText: this.$t('todo.clearAll') || 'Clear All', cancelButtonText: this.$t('common.cancel') || 'Cancel', type:'warning' }).catch(()=>false)
      if (!ok) return
      try { await this.clearTrashAction(); await this.loadTrash(); this.$message.success(this.$t('todo.trashCleared') || 'Trash cleared') } catch (_) {}
    },

    // Demo / Clear All
    async createDemoTasks() {
      try { await this.demoSeedAction(); await Promise.all([ this.fetchTasksWithFilters(), this.loadHistoryForDate(this.selectedDate) ]); this.$message.success(this.$t('todo.demoCreated') || 'Demo tasks created') } catch (_) {}
    },
    async clearAllData() {
      const ok = await this.$confirm(this.$t('todo.clearAllServerNote') || 'Server does not support clearing all data. This will clear trash only. Continue?', this.$t('todo.clearDataTitle'), { confirmButtonText: this.$t('todo.clearAll') || 'Clear', cancelButtonText: this.$t('common.cancel') || 'Cancel', type:'warning' }).catch(()=>false)
      if (!ok) return
      await this.clearTrash()
    },

    // Utils
    formatDateKey(date) { const d=new Date(date); const y=d.getFullYear(); const m=(d.getMonth()+1).toString().padStart(2,'0'); const day=d.getDate().toString().padStart(2,'0'); return `${y}-${m}-${day}` },
    formatMonthKey(date) { const d=new Date(date); const y=d.getFullYear(); const m=(d.getMonth()+1).toString().padStart(2,'0'); return `${y}-${m}` },
    formatDate(date) { try { return new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) } catch(_) { return '' } },
    formatTime(dateString) { if (!dateString) return ''; try { const date=new Date(dateString); if (isNaN(date.getTime())) return ''; return date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}) } catch(e){ return '' } },
    getTaskStatusClass(status) { return { 'task-success': status==='success', 'task-fail': status==='fail', 'task-pending': status==='pending' } },

    getRankName(key) { return this.$t(`todo.ranks.${key}`) },
    getRankClass(name) { const rank = this.serverRanksForDisplay.find(r=> this.getRankName(r.key) === name) || this.serverRanksForDisplay.find(r=> r.key==='beginner'); const key = rank? rank.key: 'beginner'; return `rank-${key}` },
    getRankImage(name) { const item = this.serverRanksForDisplay.find(r=> this.getRankName(r.key) === name) || { key: 'beginner' }; const assets = RANK_ASSETS[item.key] || RANK_ASSETS.beginner; return assets.image },
    getRankColor(name) { const item = this.serverRanksForDisplay.find(r=> this.getRankName(r.key) === name) || { key: 'beginner' }; const assets = RANK_ASSETS[item.key] || RANK_ASSETS.beginner; return assets.color },
    getNextRankImage() { if (!this.currentRankDisplay.nextThreshold) return (RANK_ASSETS.legendary && RANK_ASSETS.legendary.image) || '/assets/rankings/legendary.png'; const next = this.serverRanksForDisplay.find(r=> this.getRankName(r.key) === this.currentRankDisplay.nextRankName); return next? next.image: ((RANK_ASSETS.legendary && RANK_ASSETS.legendary.image) || '/assets/rankings/legendary.png') },

    shouldShowStatusDisplay(task) { return task.status !== 'pending' },
    onRankImageError(e) { if (!e || !e.target) return; e.target.onerror=null; e.target.src=this.fallbackRankImage; if (!e.target.title) e.target.title=this.$t('todo.placeholderImage') },

    // Added: History helpers wired to store
    async loadHistoryForDate(date) {
      try {
        const ymd = this.formatDateKey(date)
        this.selectedDate = new Date(date)
        await this.fetchHistoryAction({ date: ymd, page: 1, pageSize: 100 })
      } catch (_) {}
    },
    async deleteHistoryRecord(id, originalDate) {
      try {
        await this.deleteHistoryAction(id)
        // Reload current date view (prefer the original date passed from record)
        await this.loadHistoryForDate(originalDate || this.selectedDate)
        this.$message.success(this.$t('todo.historyRecordDeleted'))
      } catch (_) {}
    },

    // Added: Analytics wiring and adapter for chart component
    async loadAnalytics() {
      try {
        // Fetch last 6 months trend
        await this.fetchAnalyticsMonthlyAction(6)
        const currentMonth = this.formatMonthKey(new Date())
        const summary = await this.fetchAnalyticsSummaryAction(currentMonth)
        if (summary && typeof summary === 'object') {
          this._analyticsSummary = {
            totalPoints: typeof summary.totalPoints === 'number' ? summary.totalPoints : 0,
            completedCount: typeof summary.completedCount === 'number' ? summary.completedCount : 0,
            successRatePct: typeof summary.successRatePct === 'number' ? summary.successRatePct : 0
          }
        } else {
          this._analyticsSummary = { totalPoints: 0, completedCount: 0, successRatePct: 0 }
        }
      } catch (_) {
        this._analyticsSummary = { totalPoints: 0, completedCount: 0, successRatePct: 0 }
      }
    },
    getMonthlyData() {
      const labels = (this.analyticsMonthly && Array.isArray(this.analyticsMonthly.labels)) ? this.analyticsMonthly.labels : []
      const points = (this.analyticsMonthly && Array.isArray(this.analyticsMonthly.points)) ? this.analyticsMonthly.points : []
      return { labels, data: points }
    },
  }
}
</script>

<style>
.todo-gamification {
  padding: 0;
}

.main-card {
  border-radius: var(--card-border-radius);
  overflow: hidden;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
}

.header {
  background-color: var(--bg-header);
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

/* Center the ranking display on all screens */
.ranking-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
  flex-shrink: 0;
  margin-left: auto;   /* added */
  margin-right: auto;  /* added */
}

/* Remove previous "left on large screens" behavior; keep centered */
@media (min-width: 1200px) {
  .header-controls {
    display: grid;                      /* switch to grid for robust layout */
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 24px;
    max-width: 1400px;                  /* constrain width for beauty on big screens */
    margin: 16px auto 0;
  }

  .import-export-controls {
    justify-self: start;
    flex-wrap: nowrap;
    gap: 12px;
  }

  .ranking-display {
    justify-self: center;
    margin: 0;                          /* remove auto margins from flex solution */
  }

  .total-points {
    justify-self: end;
  }

  /* Slight upscale for rank badge on big screens for clarity */
  .rank-badge {
    padding: 14px 18px;
  }
  .rank-icon {
    width: 56px;
    height: 56px;
    padding: 6px;
  }
  .rank-info .rank-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .rank-info .rank-level {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Make header buttons a touch larger and consistent on big screens */
  .control-btn {
    padding: 10px 14px;
    font-size: 14px;
    border-radius: 10px;
  }
}

/* Total points: tidy and consistent */
.total-points {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.points-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--gradient-success);
  color: #fff;
  font-weight: 700;
  box-shadow: var(--shadow-card);
}

/* Rank progress: clearer layout without logic changes */
.rank-progress {
  width: 100%;
  max-width: 420px;
  margin-top: 10px;
}

.rank-progress .progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 6px;
}

.rank-progress .progress-percentage {
  font-weight: 700;
  color: var(--text-primary);
}
.rank-progress .progress-percentage.max-rank {
  color: var(--color-primary);
}

.rank-progress-bar {
  margin-bottom: 6px;
}

.next-rank-info .next-rank-text,
.max-rank-info .max-rank-text {
  font-size: 12px;
  color: var(--text-secondary);
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
  /* Replace the previous '.header-controls .control-btn .btn-text' rule with this narrower scope */
  .import-export-controls .control-btn .btn-text {
    display: none !important;
  }

  /* Center icons inside buttons */
  .header-controls .control-btn i {
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

  /* Ensure el-upload wrapped button matches the same size */
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

/* Visually hide the native file input but keep it accessible and clickable */
.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Import/Export controls: flex with gaps and wrapping by default */
.import-export-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Base control button styles (used by Export / Import / Demo / Clear All) */
.control-btn {
  -webkit-appearance: none;
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease;
}
.control-btn i {
  margin-right: 6px;
}
.control-btn:active {
  transform: translateY(0);
}

/* Color variants */
.control-btn.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
.control-btn.btn-primary:hover {
  opacity: 0.9;
}
.control-btn.btn-primary:focus {
  box-shadow: 0 0 0 3px var(--color-primary-light-5);
}

.control-btn.btn-success {
  background-color: var(--color-success);
  border-color: var(--color-success);
}
.control-btn.btn-success:hover {
  opacity: 0.9;
}
.control-btn.btn-success:focus {
  box-shadow: 0 0 0 3px var(--color-success-light-5);
}

.control-btn.btn-info {
  background-color: var(--color-info);
  border-color: var(--color-info);
}
.control-btn.btn-info:hover {
  opacity: 0.9;
}
.control-btn.btn-info:focus {
  box-shadow: 0 0 0 3px var(--color-info-light-5);
}

.control-btn.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
}
.control-btn.btn-danger:hover {
  opacity: 0.9;
}
.control-btn.btn-danger:focus {
  box-shadow: 0 0 0 3px var(--color-danger-light-5);
}

/* Task input and form styles */
.task-input-section {
  padding: 20px;
  background-color: var(--bg-body);
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: left; /* ensure left alignment on all screens */
}

.responsive-form {
  max-width: 1000px;
  margin: 0; /* was: margin: 0 auto; left-align on large screens too */
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

/* Toggle header for task input section */
.task-input-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  cursor: pointer;
  user-select: none;
  color: var(--text-primary);
  font-weight: 600;
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}
.task-input-toggle:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--border-color-light);
}
.toggle-icon {
  transition: transform 0.2s ease;
}
.toggle-icon.open {
  transform: rotate(90deg);
}

/* Small screens: align everything left inside task-input-section */
@media (max-width: 768px) {
  .task-input-section {
    text-align: left;
  }
  .task-input-section .responsive-form {
    margin: 0;
    max-width: 100%;
  }
  .task-input-section .form-row {
    justify-content: flex-start;
    align-items: flex-start;
  }
  .task-input-section .el-form-item__label {
    text-align: left;
    padding-right: 8px;
  }
}

/* Task filter styles (base) */
.task-filter-section {
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-radio-group .el-radio-button__inner {
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.2;
}

.frequency-filter-select {
  min-width: 140px;
}

/* Small screens: compact filters and enable horizontal scroll for buttons */
@media (max-width: 768px) {
  /* Existing header centering remains; improve buttons container usability */
  .import-export-controls {
    flex-wrap: nowrap;              /* keep in one line */
    overflow-x: auto;               /* allow scroll if overflow */
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;            /* space for hidden scrollbar */
  }
  .import-export-controls::-webkit-scrollbar { display: none; }

  /* Stack filter groups vertically and make them compact */
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .filter-group {
    width: 100%;
    justify-content: flex-start;
    gap: 6px;
  }
  .filter-radio-group {
    gap: 4px;
  }
  .filter-radio-group .el-radio-button__inner {
    padding: 4px 8px;
    font-size: 12px;
  }
  .frequency-filter-select {
    min-width: 0;
    width: 100%;
  }
  .frequency-filter-select .el-input__inner {
    height: 32px;
    line-height: 32px;
    font-size: 12px;
  }
}

/* Very small screens: hide labels to save space, tighten controls further */
@media (max-width: 480px) {
  .filter-label {
    display: none;
  }
  .filter-radio-group .el-radio-button__inner {
    padding: 3px 6px;
    font-size: 11px;
  }
  .frequency-filter-select .el-input__inner {
    height: 30px;
    line-height: 30px;
    font-size: 11px;
  }
}

/* Task cards */
.tasks-list {
  display: grid;
  gap: 16px;
}

.task-card {
  transition: all 0.3s ease;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
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
  color: var(--text-primary);
}

.task-description {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
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
  color: var(--text-primary);
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
  border-top: 1px solid var(--border-color);
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
  color: var(--text-primary);
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
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.history-task-description {
  color: var(--text-secondary);
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
  border-left: 4px solid var(--color-success);
}

.task-fail {
  border-left: 4px solid var(--color-danger);
}

.task-pending {
  border-left: 4px solid var(--color-warning);
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
  background: var(--bg-container);
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  overflow: hidden;
}

.rank-badge::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 25px;
  padding: 2px;
  background: var(--gradient-primary);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  z-index: -1;
}

.rank-badge:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
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
  background: var(--gradient-primary);
  box-shadow: var(--shadow-card);
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
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.rank-item:hover {
  background: var(--bg-container);
  transform: translateY(-1px);
}

.rank-item.current-rank {
  background: var(--bg-container);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-hover);
  position: relative;
}

.rank-item.current-rank::before {
  content: '✓';
  position: absolute;
  right: 8px;
  color: var(--color-primary);
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
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
}

.rank-preview-item:hover {
  background: var(--bg-container);
  transform: translateY(-1px);
}

.rank-preview-item.current-rank {
  background: var(--bg-container);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-hover);
}

.rank-preview-item.current-rank::before {
  content: '✓';
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--color-primary);
  font-weight: bold;
  font-size: 10px;
  background: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
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
  color: var(--text-primary);
  text-align: center;
  line-height: 1.2;
}

.rank-preview-threshold {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 2px 6px;
  background-color: var(--bg-body);
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

/* Monthly Summary: responsive layout and circular charts */
.summary-card.enhanced-summary {
  padding: 16px;
  border-radius: 10px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.summary-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-container);
  color: var(--color-primary);
}

.summary-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-stats.enhanced-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  align-items: stretch;
}

.stat-item.enhanced-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-color-light);
  border-radius: 10px;
  background: var(--bg-card);
}

.stat-visual {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon.enhanced-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--bg-container);
}
.stat-icon.points-icon { color: var(--color-warning); background: var(--color-warning-light-9); }
.stat-icon.completed-icon { color: var(--color-success); background: var(--color-success-light-9); }
.stat-icon.success-icon { color: var(--color-primary); background: var(--color-primary-light-9); }

.stat-circle,
.circular-chart {
  width: 64px;
  height: 64px;
}

.circular-chart .circle-bg {
  fill: none;
  stroke: var(--border-color-light);
  stroke-width: 3.8;
}

.circular-chart .circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  animation: chart-progress 1s ease-out forwards;
}
.circular-chart.gold .circle { stroke: var(--color-warning); }
.circular-chart.green .circle { stroke: var(--color-success); }
.circular-chart.blue .circle { stroke: var(--color-primary); }

@keyframes chart-progress {
  from { stroke-dasharray: 0 100; }
  to { /* final dasharray set via binding */ }
}

.stat-content.enhanced-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label { font-size: 12px; color: var(--text-secondary); }
.stat-value.enhanced-value { font-size: 20px; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
.stat-subtitle { font-size: 11px; color: var(--text-placeholder); }

/* Small screen tweaks */
@media (max-width: 480px) {
  .stat-item.enhanced-stat-item { padding: 10px; }
  .stat-circle, .circular-chart { width: 56px; height: 56px; }
  .stat-value.enhanced-value { font-size: 18px; }
}

/* Fullscreen rank image preview: minimal, centered, and not oversized */
:deep(.rank-image-preview-dialog.is-fullscreen) {
  background: var(--bg-overlay);
  box-shadow: none;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
}

:deep(.rank-image-preview-dialog .el-dialog__header) { display: none; }
:deep(.rank-image-preview-dialog .el-dialog__body) { padding: 0 !important; height: 100vh; }

.rank-image-preview-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.rank-image-fullscreen {
  max-width: min(85vw, 560px);
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
</style>
