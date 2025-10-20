<template>
  <div class="todo-gamification">
    <el-card class="main-card">
      <div slot="header">
        <TodoHeader
          :total-points="totalPoints"
          :current-rank="currentRank"
          :sorted-ranks-for-display="sortedRanksForDisplay"
          :rank-progress="rankProgress"
          :get-rank-name="getRankName"
          :get-rank-class="getRankClass"
          :get-rank-image="getRankImage"
          :get-rank-color="getRankColor"
          :get-next-rank-image="getNextRankImage"
          :on-rank-image-error="onRankImageError"
          @export="exportTodoData"
          @demo="createDemoTasks"
          @clear="clearAllData"
          @import-file-selected="importTodoData"
          @open-rank-image="openRankImagePreview"
        />
      </div>

      <el-tabs v-model="activeTab" type="card" class="responsive-tabs">
        <el-tab-pane :label="$t('todo.taskList')" name="tasks">
          <TaskInput :new-task="newTask" :on-add="addTask" />
          <TaskFilters :task-filter.sync="taskFilter" :frequency-filter.sync="frequencyFilter" @reset-all="resetAllTaskStatuses" />
          <TaskList
            :tasks="filteredTasks"
            :editing-task-id="editingTaskId"
            :editing-task="editingTask"
            :empty-description="getEmptyDescription()"
            :get-task-status-class="getTaskStatusClass"
            :get-frequency-text="getFrequencyText"
            :should-show-done-tag="shouldShowDoneTag"
            :should-show-status-display="shouldShowStatusDisplay"
            :get-completion-tag-type="getCompletionTagType"
            :get-completion-tag-text="getCompletionTagText"
            :should-show-status-actions="shouldShowStatusActions"
            :should-show-reset-action="shouldShowResetAction"
            :on-complete="completeTask"
            :on-start-edit="startTaskEdit"
            :on-save-edit="saveTaskEdit"
            :on-cancel-edit="cancelTaskEdit"
            :on-delete="deleteTask"
            :on-reset-status="resetTaskStatus"
          />
        </el-tab-pane>

        <el-tab-pane :label="$t('todo.history')" name="history">
          <HistoryPanel
            :selected-date="selectedDate"
            :history-tasks="historyTasks"
            :format-date="formatDate"
            :format-time="formatTime"
            :get-task-status-class="getTaskStatusClass"
            :on-date-changed="loadHistoryForDate"
            :on-delete-history-record="deleteHistoryRecord"
          />
        </el-tab-pane>

        <el-tab-pane :label="$t('todo.trash')" name="trash">
          <TrashList
            :trashed-tasks="trashedTasks"
            :format-date="formatDate"
            :on-restore-task="restoreTask"
            :on-permanently-delete-task="permanentlyDeleteTask"
            :on-clear-trash-click="clearTrash"
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
    </el-card>


    <el-dialog :visible.sync="showFullScreenRanking" width="90%" :before-close="closeFullScreenRanking" custom-class="full-screen-ranking-modal" :show-close="false">
      <div class="full-screen-ranking-header">
        <h2 class="modal-title">{{ $t('todo.rankingSystem') }}</h2>
        <el-button type="primary" icon="el-icon-close" circle @click="closeFullScreenRanking" class="close-btn"></el-button>
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

    <el-dialog :visible.sync="showRankImagePreview" fullscreen :show-close="false" custom-class="rank-image-preview-dialog">
      <div class="rank-image-preview-container" @click="showRankImagePreview = false">
        <img :src="getRankImage(currentRank.name)" :alt="currentRank.name" class="rank-image-fullscreen" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import TodoHeader from '@/page/todo/TodoHeader.vue'
import TaskInput from '@/page/todo/TaskInput.vue'
import TaskFilters from '@/page/todo/TaskFilters.vue'
import TaskList from '@/page/todo/TaskList.vue'
import HistoryPanel from '@/page/todo/HistoryPanel.vue'
import TrashList from '@/page/todo/TrashList.vue'
import AnalyticsPanel from '@/page/todo/AnalyticsPanel.vue'

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
      historyTasks: [],
      chartType: 'bar',
      chart: null,
      refreshTrigger: 0,
      editingTaskId: null,
      editingTask: { title: '', description: '', successPoints: 10, failPoints: -5, frequency: 'once', customDays: 7 },
      taskFormCollapsed: true,
      ranks: [
        { level: 20, key: 'legendary', threshold: 200000, color: '#FFD700', image: '/assets/rankings/legendary.png' },
        { level: 19, key: 'mythic', threshold: 160000, color: '#FF6B35', image: '/assets/rankings/mythic.png' },
        { level: 18, key: 'immortal', threshold: 128000, color: '#E74C3C', image: '/assets/rankings/immortal.png' },
        { level: 17, key: 'divine', threshold: 104000, color: '#9B59B6', image: '/assets/rankings/divine.png' },
        { level: 16, key: 'celestial', threshold: 84000, color: '#3498DB', image: '/assets/rankings/celestial.png' },
        { level: 15, key: 'grandmaster', threshold: 68000, color: '#1ABC9C', image: '/assets/rankings/grandmaster.png' },
        { level: 14, key: 'master', threshold: 56000, color: '#2ECC71', image: '/assets/rankings/master.png' },
        { level: 13, key: 'diamond', threshold: 46000, color: '#85C1E9', image: '/assets/rankings/diamond.png' },
        { level: 12, key: 'platinum', threshold: 38000, color: '#AED6F1', image: '/assets/rankings/platinum.png' },
        { level: 11, key: 'gold', threshold: 31200, color: '#F7DC6F', image: '/assets/rankings/gold.png' },
        { level: 10, key: 'silver', threshold: 25600, color: '#D5DBDB', image: '/assets/rankings/silver.png' },
        { level: 9, key: 'bronze', threshold: 20800, color: '#CD853F', image: '/assets/rankings/bronze.png' },
        { level: 8, key: 'iron', threshold: 16800, color: '#2C3E50', image: '/assets/rankings/iron.png' },
        { level: 7, key: 'steel', threshold: 13600, color: '#566573', image: '/assets/rankings/steel.png' },
        { level: 6, key: 'stone', threshold: 10800, color: '#7D8B8C', image: '/assets/rankings/stone.png' },
        { level: 5, key: 'wood', threshold: 8400, color: '#8B4513', image: '/assets/rankings/wood.png' },
        { level: 4, key: 'apprentice', threshold: 6400, color: '#52C41A', image: '/assets/rankings/apprentice.png' },
        { level: 3, key: 'novice', threshold: 4800, color: '#13C2C2', image: '/assets/rankings/novice.png' },
        { level: 2, key: 'trainee', threshold: 3200, color: '#722ED1', image: '/assets/rankings/trainee.png' },
        { level: 1, key: 'beginner', threshold: 0, color: '#595959', image: '/assets/rankings/beginner.png' }
      ],
      showFullScreenRanking: false,
      showRankImagePreview: false,
      fallbackRankImage: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" rx="8" fill="#f3f4f6"/><g fill="none" stroke="#cbd5e1" stroke-width="2"><rect x="10" y="10" width="44" height="44" rx="6"/><path d="M16 44l10-12 8 8 6-8 8 12" fill="none"/></g></svg>`)
    }
  },
  computed: {
    allTasks() { this.refreshTrigger; return this.getAllTasks() },
    filteredTasks() {
      let tasks = this.allTasks
      if (this.frequencyFilter !== 'all') {
        tasks = tasks.filter(t => (t.frequency || 'once') === this.frequencyFilter)
      }
      if (this.taskFilter !== 'all') {
        tasks = tasks.filter(task => {
          switch (this.taskFilter) {
            case 'pending': return task.status === 'pending'
            case 'completed': return task.status === 'success' || task.status === 'fail'
            case 'done': return this.shouldShowDoneTag(task) && (task.status === 'success' || task.status === 'fail')
            default: return true
          }
        })
      }
      return tasks.sort((a,b) => {
        const ap = a.successPoints || 0; const bp = b.successPoints || 0; if (ap !== bp) return bp - ap
        const ad = new Date(a.date || 0).getTime(); const bd = new Date(b.date || 0).getTime(); return bd - ad
      })
    },
    totalPoints() {
      this.refreshTrigger
      return this.getAllHistoryRecords().reduce((total, r) => total + (r.status === 'success' ? r.successPoints : r.status === 'fail' ? r.failPoints : 0), 0)
    },
    currentMonthPoints() {
      const m = new Date().getMonth(), y = new Date().getFullYear();
      return this.getAllHistoryRecords().filter(r => { const d = new Date(r.completedDate); return d.getMonth() === m && d.getFullYear() === y }).reduce((t,r)=> t + (r.status==='success'?r.successPoints:r.failPoints), 0)
    },
    currentMonthCompleted() {
      const m = new Date().getMonth(), y = new Date().getFullYear();
      return this.getAllHistoryRecords().filter(r => { const d = new Date(r.completedDate); return d.getMonth()===m && d.getFullYear()===y && r.status==='success' }).length
    },
    successRate() {
      const m = new Date().getMonth(), y = new Date().getFullYear();
      const month = this.getAllHistoryRecords().filter(r => { const d = new Date(r.completedDate); return d.getMonth()===m && d.getFullYear()===y })
      if (!month.length) return 0; const s = month.filter(r=>r.status==='success').length; return Math.round((s/month.length)*100)
    },
    trashedTasks() { this.refreshTrigger; const s = localStorage.getItem('todo_trash'); return s? JSON.parse(s): [] },
    currentRank() {
      const sorted = [...this.ranks].sort((a,b)=> a.threshold - b.threshold)
      for (let i=sorted.length-1;i>=0;i--) { const rank = sorted[i]; if (this.totalPoints >= rank.threshold) { const next = i < sorted.length-1 ? sorted[i+1] : null; return { ...rank, name: this.getRankName(rank.key), nextThreshold: next ? next.threshold : null, nextRankName: next ? this.getRankName(next.key): null } } }
      const beginner = sorted[0]; const next = sorted.length>1? sorted[1] : null; return { ...beginner, name: this.getRankName(beginner.key), nextThreshold: next? next.threshold: null, nextRankName: next? this.getRankName(next.key): null }
    },
    sortedRanksForDisplay() { return [...this.ranks].sort((a,b)=> b.threshold - a.threshold) },
    achievedRanksForDisplay() { return this.sortedRanksForDisplay.filter(r=> r.threshold <= this.totalPoints) },
    rankProgress() {
      if (!this.currentRank.nextThreshold) return 100
      const c = this.currentRank.threshold, n = this.currentRank.nextThreshold
      return Math.min(Math.max(((this.totalPoints - c)/(n-c))*100, 0), 100)
    }
  },
  mounted() {
    this.loadHistoryForDate()
  },
  watch: {
    activeTab(newTab) { if (newTab === 'history') { this.$nextTick(()=> this.loadHistoryForDate()) } }
  },
  methods: {
    addTask() {
      if (!this.newTask.title.trim()) return
      const task = { id: Date.now() + Math.floor(Math.random()*1000), title: this.newTask.title, description: this.newTask.description, successPoints: this.newTask.successPoints, failPoints: this.newTask.failPoints, frequency: this.newTask.frequency, customDays: this.newTask.customDays, status: 'pending', date: new Date().toISOString(), dateKey: 'general' }
      this.saveTask(task)
      this.newTask = { title: '', description: '', successPoints: 10, failPoints: -5, frequency: 'once', customDays: 7 }
      this.refreshTrigger++
      this.$message.success(this.$t('todo.taskAddedSuccess'))
    },
    completeTask(taskId, status) {
      const tasks = this.getAllTasks(); const task = tasks.find(t=> t.id === taskId)
      if (task) { task.status = status; this.updateTaskInStorage(task); this.createHistoryRecord(task, status); const points = status==='success'? task.successPoints : task.failPoints; this.refreshTrigger++; this.$message({ message: this.$t('todo.taskStatusUpdate', { status: this.$t(`todo.${status}`), points: points>0? '+'+points: points }), type: status==='success'? 'success':'warning' }) }
    },
    saveTask(task) { const key = task.dateKey || 'general'; const list = this.getTasksForDate(key); list.push(task); localStorage.setItem(`todo_${key}`, JSON.stringify(list)) },
    updateTaskInStorage(task) { const key = task.dateKey || 'general'; const list = this.getTasksForDate(key); const idx = list.findIndex(t=> t.id===task.id); if (idx!==-1) { list[idx] = task; localStorage.setItem(`todo_${key}`, JSON.stringify(list)) } },
    getTasksForDate(key) { const s = localStorage.getItem(`todo_${key}`); return s? JSON.parse(s): [] },
    getAllTasks() { const tasks = []; for (let i=0;i<localStorage.length;i++){ const key = localStorage.key(i); if (key && key.startsWith('todo_') && !key.startsWith('todo_trash')) { const t = JSON.parse(localStorage.getItem(key)); tasks.push(...t) } } return tasks },
    loadHistoryForDate(date) { const d = date || this.selectedDate; this.selectedDate = d; const key = this.formatDateKey(d); this.historyTasks = this.getHistoryRecordsForDate(key) },
    formatDateKey(date) { const d=new Date(date); const y=d.getFullYear(); const m=(d.getMonth()+1).toString().padStart(2,'0'); const day=d.getDate().toString().padStart(2,'0'); return `${y}-${m}-${day}` },
    formatDate(date) { return new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) },
    getTaskStatusClass(status) { return { 'task-success': status==='success', 'task-fail': status==='fail', 'task-pending': status==='pending' } },
    getMonthlyData() {
      const monthlyPoints = {}; const all = this.getAllHistoryRecords(); const months=[]; for (let i=5;i>=0;i--){ const d=new Date(); d.setMonth(d.getMonth()-i); const k=`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`; months.push(k); monthlyPoints[k]=0 }
      all.forEach(r=> { const d=new Date(r.completedDate); const k=`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`; if (monthlyPoints.hasOwnProperty(k)) monthlyPoints[k]+= r.status==='success'? r.successPoints: r.failPoints })
      return { labels: months.map(m=>{ const [y,mm]=m.split('-'); return new Date(y,mm-1).toLocaleDateString('en-US',{month:'short',year:'numeric'}) }), data: months.map(m=> monthlyPoints[m]) }
    },
    startTaskEdit(task) { this.editingTaskId = task.id; this.editingTask = { title: task.title, description: task.description || '', successPoints: task.successPoints, failPoints: task.failPoints, frequency: task.frequency || 'once', customDays: task.customDays || 7 } },
    saveTaskEdit(taskId) {
      if (!this.editingTask.title.trim()) { this.$message.warning(this.$t('todo.taskTitleRequired')); return }
      const tasks = this.getAllTasks(); const task = tasks.find(t=> t.id === taskId)
      if (task) { Object.assign(task, { title: this.editingTask.title, description: this.editingTask.description, successPoints: this.editingTask.successPoints, failPoints: this.editingTask.failPoints, frequency: this.editingTask.frequency, customDays: this.editingTask.customDays }); this.updateTaskInStorage(task); this.editingTaskId = null; this.refreshTrigger++; this.$message.success(this.$t('todo.taskUpdatedSuccess')) }
    },
    cancelTaskEdit() { this.editingTaskId = null; this.editingTask = { title:'', description:'', successPoints:10, failPoints:-5, frequency:'once', customDays:7 } },
    deleteTask(taskId) { const tasks = this.getAllTasks(); const task = tasks.find(t=> t.id===taskId); if (task) { const key = task.dateKey || 'general'; this.moveTaskToTrash(taskId, key) } },
    moveTaskToTrash(taskId, key) {
      const tasks = this.getTasksForDate(key); const toTrash = tasks.find(t=> t.id===taskId)
      if (toTrash) { const trashedTask = { ...toTrash, originalDate: toTrash.date || new Date(key).toISOString(), deletedDate: new Date().toISOString() }; const trash = this.trashedTasks; trash.push(trashedTask); localStorage.setItem('todo_trash', JSON.stringify(trash)); const filtered = tasks.filter(t=> t.id !== taskId); localStorage.setItem(`todo_${key}`, JSON.stringify(filtered)); this.refreshTrigger++; this.loadHistoryForDate(); this.$message.success('Task moved to trash') }
    },
    formatTime(dateString) { if (!dateString) return ''; try { const date=new Date(dateString); if (isNaN(date.getTime())) return ''; return date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}) } catch(e){ return '' } },
    deleteHistoryRecord(id, originalDate) { if (!originalDate) { this.$message.error('Invalid date for historical record'); return } let d; try { d=new Date(originalDate); if (isNaN(d.getTime())) throw new Error('Invalid date') } catch(e){ d=new Date() } const key=this.formatDateKey(d); const list = this.getHistoryRecordsForDate(key); const filtered = list.filter(r=> r.id !== id); localStorage.setItem(`history_${key}`, JSON.stringify(filtered)); this.loadHistoryForDate(); this.refreshTrigger++; this.$message.success(this.$t('todo.historyRecordDeleted')) },
    createHistoryRecord(task, status) { const key=this.formatDateKey(new Date()); const record={ id: task.id, title: task.title, description: task.description, successPoints: task.successPoints, failPoints: task.failPoints, status, completedDate: new Date().toISOString(), originalTaskId: task.id, historyId: `${task.id}-${Date.now()}` }; const existing=this.getHistoryRecordsForDate(key); existing.push(record); localStorage.setItem(`history_${key}`, JSON.stringify(existing)) },
    getHistoryRecordsForDate(key) { const s = localStorage.getItem(`history_${key}`); return s? JSON.parse(s): [] },
    getAllHistoryRecords() { const rec=[]; for (let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if (key && key.startsWith('history_')) { const r=JSON.parse(localStorage.getItem(key)||'[]'); rec.push(...r) } } return rec },
    exportTodoData() {
      try {
        const todoData={ exportDate: new Date().toISOString(), version:'1.1', appVersion:'1.0', tasks:{}, history:{}, trash: JSON.parse(localStorage.getItem('todo_trash')||'[]'), metadata:{ totalTasks:0, totalHistoryRecords:0, exportedDates:[] } }
        let taskCount=0, historyCount=0
        for (let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if (key && key.startsWith('todo_') && key !== 'todo_trash'){ const dateKey=key.replace('todo_',''); try{ const tasks=JSON.parse(localStorage.getItem(key)||'[]'); if (Array.isArray(tasks) && tasks.length>0){ const valid=tasks.filter(t=> t && typeof t==='object' && t.id && t.title); if (valid.length>0){ todoData.tasks[dateKey]=valid; taskCount+=valid.length; todoData.metadata.exportedDates.push(dateKey) } } } catch(e){ /* ignore */ } } }
        for (let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if (key && key.startsWith('history_')){ const dateKey=key.replace('history_',''); try{ const history=JSON.parse(localStorage.getItem(key)||'[]'); if (Array.isArray(history) && history.length>0){ const valid=history.filter(r=> r && typeof r==='object' && r.id && r.title && r.status && r.completedDate); if (valid.length>0){ todoData.history[dateKey]=valid; historyCount+=valid.length } } } catch(e){ /* ignore */ } } }
        if (Array.isArray(todoData.trash)) { todoData.trash = todoData.trash.filter(t=> t && typeof t==='object' && t.id && t.title) } else { todoData.trash = [] }
        todoData.metadata.totalTasks = taskCount; todoData.metadata.totalHistoryRecords = historyCount; todoData.metadata.totalTrashItems = todoData.trash.length
        if (taskCount===0 && historyCount===0 && todoData.trash.length===0){ this.$message.warning('No data available to export'); return }
        const dataStr = JSON.stringify(todoData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `todo-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.$message.success(`Data exported successfully! (${taskCount} tasks, ${historyCount} history records, ${todoData.trash.length} trash items)`)
      } catch (e) {
        console.error('Export failed:', e)
        this.$message.error('Failed to export todo data: ' + e.message)
      }
    },
    importTodoData(file) {
      return new Promise((resolve, reject) => {
        const fileToRead = file.raw || file
        if (!fileToRead) { this.$message.error('Invalid file selected'); return reject(new Error('Invalid file')) }
        if (fileToRead.type !== 'application/json' && !fileToRead.name.toLowerCase().endsWith('.json')) { this.$message.error('Please select a valid JSON file'); return reject(new Error('Invalid file type')) }
        const reader = new FileReader()
        reader.onerror = () => { this.$message.error('Failed to read file'); reject(new Error('File read error')) }
        reader.onload = (e) => {
          try {
            let importedData
            try { importedData = JSON.parse(e.target.result) } catch (parseError) { throw new Error('Invalid JSON format - please check your file content') }
            const isCurrentFormat = importedData && importedData.version === '1.1' && importedData.exportDate && typeof importedData.tasks==='object' && typeof importedData.history==='object' && Array.isArray(importedData.trash)
            const isLegacyFormat = importedData && importedData.data && typeof importedData.data==='object' && !importedData.version
            if (!isCurrentFormat && !isLegacyFormat) { throw new Error('Unsupported file format. Please make sure you are importing a valid todo data export file (version 1.1 or legacy format).') }
            let previewMessage = 'Import Preview:\n'; let tasksToImport=0, historyToImport=0, trashToImport=0
            if (isCurrentFormat) {
              if (importedData.tasks && typeof importedData.tasks==='object') { tasksToImport = Object.values(importedData.tasks).filter(a=> Array.isArray(a)).reduce((t,a)=> t+a.length, 0) }
              if (importedData.history && typeof importedData.history==='object') { historyToImport = Object.values(importedData.history).filter(a=> Array.isArray(a)).reduce((t,a)=> t+a.length, 0) }
              if (importedData.trash && Array.isArray(importedData.trash)) { trashToImport = importedData.trash.length }
              if (importedData.metadata && importedData.exportDate) { previewMessage += `Export Date: ${new Date(importedData.exportDate).toLocaleDateString()}\n`; previewMessage += `Exported Dates: ${importedData.metadata.exportedDates?.length || 0} dates\n` }
            } else {
              if (importedData.data && typeof importedData.data==='object') { tasksToImport = Object.values(importedData.data).filter(a=> Array.isArray(a)).reduce((t,a)=> t+a.length, 0) }
            }
            previewMessage += `Tasks: ${tasksToImport}\nHistory Records: ${historyToImport}\nTrash Items: ${trashToImport}\n\nThis will merge with your existing data. Continue?`
            this.$confirm(previewMessage, 'Import Confirmation', { confirmButtonText:'Import', cancelButtonText:'Cancel', type:'info' }).then(() => {
              let importedTaskCount=0, importedHistoryCount=0, importedTrashCount=0, skippedDuplicates=0
              try {
                if (isCurrentFormat) {
                  if (importedData.tasks && typeof importedData.tasks==='object') { Object.keys(importedData.tasks).forEach(dateKey => { const arr = importedData.tasks[dateKey]; if (Array.isArray(arr) && arr.length>0) { const existing = this.getTasksForDate(dateKey); const ids = new Set(existing.map(t=> t.id)); const newTasks = arr.filter(task => task && typeof task==='object' && task.id && task.title && !ids.has(task.id)); if (newTasks.length>0) { const validated = newTasks.map(task => ({ id: task.id, title: task.title, description: task.description || '', successPoints: task.successPoints || 10, failPoints: task.failPoints || -5, frequency: task.frequency || 'once', customDays: task.customDays || 7, status: task.status || 'pending', date: task.date || new Date().toISOString(), dateKey: task.dateKey || dateKey })); const merged = [...existing, ...validated]; localStorage.setItem(`todo_${dateKey}`, JSON.stringify(merged)); importedTaskCount += validated.length } else { skippedDuplicates += arr.length - newTasks.length } } }) }
                  if (importedData.history && typeof importedData.history==='object') { Object.keys(importedData.history).forEach(dateKey => { const arr = importedData.history[dateKey]; if (Array.isArray(arr) && arr.length>0) { const existing = this.getHistoryRecordsForDate(dateKey); const ids = new Set(existing.map(h=> `${h.id}_${h.completedDate}`)); const newHist = arr.filter(r => r && typeof r==='object' && r.id && r.completedDate && !ids.has(`${r.id}_${r.completedDate}`)); if (newHist.length>0) { const validated = newHist.map(r => ({ id: r.id, title: r.title, description: r.description || '', successPoints: r.successPoints || 10, failPoints: r.failPoints || -5, status: r.status, completedDate: r.completedDate, originalTaskId: r.originalTaskId || r.id })); const merged = [...existing, ...validated]; localStorage.setItem(`history_${dateKey}`, JSON.stringify(merged)); importedHistoryCount += validated.length } else { skippedDuplicates += arr.length - newHist.length } } }) }
                  if (importedData.trash && Array.isArray(importedData.trash)) { const existingTrash = JSON.parse(localStorage.getItem('todo_trash')||'[]'); const ids = new Set(existingTrash.map(t=> t.id)); const newTrash = importedData.trash.filter(item => item && typeof item==='object' && item.id && item.title && !ids.has(item.id)); if (newTrash.length>0) { const validated = newTrash.map(item => ({ ...item, description: item.description || '', successPoints: item.successPoints || 10, failPoints: item.failPoints || -5, originalDate: item.originalDate || item.date || new Date().toISOString(), deletedDate: item.deletedDate || new Date().toISOString() })); localStorage.setItem('todo_trash', JSON.stringify([...existingTrash, ...validated])); importedTrashCount = validated.length } else { skippedDuplicates += importedData.trash.length - newTrash.length } }
                } else {
                  if (importedData.data && typeof importedData.data==='object') { Object.keys(importedData.data).forEach(dateKey => { const arr = importedData.data[dateKey]; if (Array.isArray(arr) && arr.length>0) { const existing = this.getTasksForDate(dateKey); const ids = new Set(existing.map(t=> t.id)); const newTasks = arr.filter(task => task && typeof task==='object' && task.id && task.title && !ids.has(task.id)); if (newTasks.length>0) { const validated = newTasks.map(task => ({ id: task.id, title: task.title, description: task.description || '', successPoints: task.successPoints || 10, failPoints: task.failPoints || -5, frequency: task.frequency || 'once', customDays: task.customDays || 7, status: task.status || 'pending', date: task.date || new Date().toISOString(), dateKey: task.dateKey || dateKey })); const merged = [...existing, ...validated]; localStorage.setItem(`todo_${dateKey}`, JSON.stringify(merged)); importedTaskCount += validated.length } else { skippedDuplicates += arr.length - newTasks.length } } }) }
                }
                this.refreshTrigger++; this.loadHistoryForDate()
                let msg = `Import completed successfully!\nTasks: ${importedTaskCount} imported\n`; if (importedHistoryCount>0) msg += `History: ${importedHistoryCount} imported\n`; if (importedTrashCount>0) msg += `Trash: ${importedTrashCount} imported\n`; if (skippedDuplicates>0) msg += `Skipped: ${skippedDuplicates} duplicates`
                this.$message.success(msg); resolve()
              } catch (err) { console.error('Import processing error:', err); this.$message.error('Import failed during data processing: ' + err.message); reject(err) }
            }).catch(() => reject(new Error('Import cancelled')))
          } catch (error) { console.error('Import error:', error); this.$message.error('Failed to import todo data: ' + error.message); reject(error) }
        }
        reader.readAsText(fileToRead)
      })
    },
    closeFullScreenRanking() { this.showFullScreenRanking = false },
    openRankImagePreview() { this.showRankImagePreview = true },
    getRankName(key) { return this.$t(`todo.ranks.${key}`) },
    getRankClass(name) { const rank = this.ranks.find(r=> this.getRankName(r.key) === name); const key = rank? rank.key: 'beginner'; return `rank-${key}` },
    getRankImage(name) { const rank = this.ranks.find(r=> this.getRankName(r.key) === name); return rank? rank.image: '/assets/rankings/beginner.png' },
    getRankColor(name) { const rank = this.ranks.find(r=> this.getRankName(r.key) === name); return rank? rank.color : '#595959' },
    getNextRankImage() { if (!this.currentRank.nextThreshold) return '/assets/rankings/legendary.png'; const sorted=[...this.ranks].sort((a,b)=> a.threshold - b.threshold); const next = sorted.find(r=> r.threshold === this.currentRank.nextThreshold); return next? next.image: '/assets/rankings/legendary.png' },
    shouldShowDoneTag(task) { const isNonDaily = task.frequency && task.frequency !== 'daily'; return isNonDaily && (task.status === 'success' || task.status === 'fail') },
    shouldShowStatusActions(task) { return task.status === 'pending' },
    shouldShowResetAction(task) { return task.status === 'success' || task.status === 'fail' },
    getCompletionTagType(task) { if (task.status==='success') return 'success'; if (task.status==='fail') return 'danger'; return 'info' },
    getCompletionTagText(task) { if (task.status==='success') return this.$t('todo.completed'); if (task.status==='fail') return this.$t('todo.failed'); return 'Done' },
    getFrequencyText(freq, days) { switch(freq){ case 'daily': return 'Daily'; case 'weekly': return 'Weekly'; case 'monthly': return 'Monthly'; case 'custom': return `Every ${days} days`; default: return 'One-time' } },
    getEmptyDescription() { switch(this.taskFilter){ case 'pending': return 'No pending tasks'; case 'completed': return 'No completed tasks'; case 'done': return 'No done tasks'; default: return 'No tasks available' } },
    resetTaskStatus(taskId) { const tasks = this.getAllTasks(); const task = tasks.find(t=> t.id===taskId); if (task){ task.status='pending'; this.updateTaskInStorage(task); this.refreshTrigger++; this.$message.success('Task status reset to pending') } },
    resetAllTaskStatuses() {
      const all = this.getAllTasks(); const toReset = all.filter(t=> t.status !== 'pending').length
      if (toReset===0) { this.$message.info('All tasks are already pending'); return }
      this.$confirm(`This will reset ${toReset} task(s) to Pending. Continue?`, 'Reset All Task Status', { confirmButtonText: 'Reset All', cancelButtonText: 'Cancel', type:'warning' }).then(() => {
        const dateKeys = new Set(); for (let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if (key && key.startsWith('todo_') && key !== 'todo_trash'){ dateKeys.add(key.replace('todo_','')) } }
        let changed=0; dateKeys.forEach(k=> { const tasks = this.getTasksForDate(k); let touched=false; tasks.forEach(t=> { if (t.status !== 'pending'){ t.status='pending'; touched=true; changed++ } }); if (touched){ localStorage.setItem(`todo_${k}`, JSON.stringify(tasks)) } })
        this.refreshTrigger++; this.$message.success(`Reset ${changed} task(s) to pending`)
      }).catch(()=>{})
    },
    restoreTask(taskId) { const trash = this.trashedTasks; const idx = trash.findIndex(t=> t.id===taskId); if (idx!==-1){ const t = trash[idx]; const originalDate = new Date(t.originalDate); const key = this.formatDateKey(originalDate); trash.splice(idx,1); localStorage.setItem('todo_trash', JSON.stringify(trash)); const existing = this.getTasksForDate(key); const restored = { ...t, status: 'pending' }; delete restored.originalDate; delete restored.deletedDate; existing.push(restored); localStorage.setItem(`todo_${key}`, JSON.stringify(existing)); this.refreshTrigger++; this.$message.success('Task restored successfully') } },
    permanentlyDeleteTask(taskId) { const trash = this.trashedTasks; const filtered = trash.filter(t=> t.id!==taskId); localStorage.setItem('todo_trash', JSON.stringify(filtered)); this.refreshTrigger++; this.$message.success('Task permanently deleted') },
    clearTrash() { this.$confirm('This will permanently delete all items in trash. This cannot be undone.', 'Clear Trash', { confirmButtonText: 'Clear All', cancelButtonText: 'Cancel', type:'warning' }).then(()=>{ localStorage.removeItem('todo_trash'); this.refreshTrigger++; this.$message.success('Trash cleared') }) },
    clearAllData() {
      this.$confirm('This will permanently delete all your todo data including tasks, history, and trash. This action cannot be undone.\n\nAre you sure you want to continue?', 'Clear All Data', { confirmButtonText: 'Yes, Clear All Data', cancelButtonText: 'Cancel', type:'error', customClass:'clear-data-confirm-dialog', dangerouslyUseHTMLString:false }).then(()=>{
        this.$confirm('Last confirmation: This will delete ALL your todo data permanently. This cannot be undone.', 'Final Confirmation', { confirmButtonText:'DELETE ALL DATA', cancelButtonText:'Cancel', type:'error', customClass:'clear-data-final-confirm' }).then(()=>{
          try {
            let deletedItems=0; const keys=[]
            for (let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if (key && (key.startsWith('todo_') || key.startsWith('history_') || key==='todo_trash')) keys.push(key) }
            keys.forEach(key=> { try { const data = localStorage.getItem(key); if (data){ if (key==='todo_trash'){ const t = JSON.parse(data); deletedItems += Array.isArray(t)? t.length: 0 } else { const parsed = JSON.parse(data); deletedItems += Array.isArray(parsed)? parsed.length: 0 } } localStorage.removeItem(key) } catch(e){ localStorage.removeItem(key) } })
            this.refreshTrigger++; this.historyTasks = []; this.selectedDate = new Date(); this.taskFilter='all'; this.frequencyFilter='all'; this.activeTab='tasks'; this.newTask={ title:'', description:'', successPoints:10, failPoints:-5, frequency:'once', customDays:7 }; this.loadHistoryForDate(); this.$message({ message: `All data cleared successfully! Removed ${keys.length} storage entries containing ${deletedItems} items.`, type:'success', duration:5000, showClose:true })
          } catch (e){ console.error('Error during data clearing:', e); this.$message.error('Failed to clear all data: ' + e.message) }
        }).catch(()=>{ this.$message.info('Data clearing cancelled') })
      }).catch(()=>{ this.$message.info('Data clearing cancelled') })
    },
    shouldShowStatusDisplay(task) { return task.status !== 'pending' },
    onRankImageError(e) { if (!e || !e.target) return; e.target.onerror=null; e.target.src=this.fallbackRankImage; if (!e.target.title) e.target.title='Placeholder' },
    createDemoTasks() {
      this.$confirm(
        'This will create sample tasks to demonstrate the app features. The demo includes:\n\n' +
        '• Various task types (daily, weekly, monthly, one-time, custom)\n' +
        '• Different point values and descriptions\n' +
        '• Some completed tasks with history records\n' +
        '• Tasks across multiple dates\n\n' +
        'Continue?',
        'Create Demo Tasks',
        { confirmButtonText: 'Create Demo', cancelButtonText: 'Cancel', type: 'info', customClass: 'demo-confirm-dialog' }
      ).then(() => {
        try {
          this.generateDemoTasks()
          this.$message({ message: 'Demo tasks created successfully! Explore different tabs to see all features.', type: 'success', duration: 5000, showClose: true })
        } catch (error) {
          console.error('Failed to create demo tasks:', error)
          this.$message.error('Failed to create demo tasks: ' + error.message)
        }
      }).catch(() => { this.$message.info('Demo creation cancelled') })
    },
    generateDemoTasks() {
      const today = new Date()
      const demoTasks = [
        { id: Date.now() + Math.floor(Math.random()*10000) + 1, title: 'Morning Exercise', description: 'Do 30 minutes of cardio or strength training', successPoints: 20, failPoints: -10, frequency: 'daily', customDays: 7, status: 'pending', date: today.toISOString(), dateKey: 'general' },
        { id: Date.now() + Math.floor(Math.random()*10000) + 2, title: 'Read for 20 minutes', description: 'Read a book, article, or educational material', successPoints: 15, failPoints: -5, frequency: 'daily', customDays: 7, status: 'success', date: today.toISOString(), dateKey: 'general' },
        { id: Date.now() + Math.floor(Math.random()*10000) + 3, title: 'Weekly Team Meeting', description: 'Attend the weekly team sync meeting', successPoints: 25, failPoints: -15, frequency: 'weekly', customDays: 7, status: 'pending', date: today.toISOString(), dateKey: 'general' },
        { id: Date.now() + Math.floor(Math.random()*10000) + 4, title: 'Learn Something New', description: 'Spend time learning a new skill or technology', successPoints: 30, failPoints: -10, frequency: 'custom', customDays: 3, status: 'pending', date: today.toISOString(), dateKey: 'general' },
        { id: Date.now() + Math.floor(Math.random()*10000) + 5, title: 'Complete Project Report', description: 'Finish and submit the quarterly project report', successPoints: 50, failPoints: -25, frequency: 'once', customDays: 7, status: 'pending', date: today.toISOString(), dateKey: 'general' }
      ]
      this.saveDemoTasksForDate(demoTasks, 'general')
      this.createDemoHistoryRecords(demoTasks, today)
      this.createDemoTrashItems()
      this.refreshTrigger++
      this.loadHistoryForDate()
    },
    saveDemoTasksForDate(tasks, dateKey) {
      const existingTasks = this.getTasksForDate(dateKey)
      const existingIds = new Set(existingTasks.map(t => t.id))
      const newTasks = tasks.filter(task => !existingIds.has(task.id))
      if (newTasks.length > 0) { const merged = [...existingTasks, ...newTasks]; localStorage.setItem(`todo_${dateKey}`, JSON.stringify(merged)) }
    },
    createDemoHistoryRecords(tasks, date) {
      const dateKey = this.formatDateKey(date)
      const completedTasks = tasks.filter(task => task.status !== 'pending')
      if (!completedTasks.length) return
      const existingHistory = this.getHistoryRecordsForDate(dateKey)
      const existingIds = new Set(existingHistory.map(h => h.id))
      const newHistory = []
      completedTasks.forEach(task => {
        if (!existingIds.has(task.id)) {
          const completionDate = new Date(date)
          completionDate.setHours(Math.floor(Math.random()*16)+6, Math.floor(Math.random()*60), 0, 0)
          newHistory.push({ id: task.id, title: task.title, description: task.description, successPoints: task.successPoints, failPoints: task.failPoints, status: task.status, completedDate: completionDate.toISOString(), originalTaskId: task.id })
        }
      })
      if (newHistory.length > 0) { const merged = [...existingHistory, ...newHistory]; localStorage.setItem(`history_${dateKey}`, JSON.stringify(merged)) }
    },
    createDemoTrashItems() {
      const existingTrash = JSON.parse(localStorage.getItem('todo_trash') || '[]')
      const existingIds = new Set(existingTrash.map(t => t.id))
      const items = [
        { id: Date.now() + Math.floor(Math.random()*10000) + 100, title: 'Old Task Example', description: 'This is an example of a deleted task', successPoints: 15, failPoints: -5, frequency: 'daily', customDays: 7, status: 'pending', originalDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(), deletedDate: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
        { id: Date.now() + Math.floor(Math.random()*10000) + 101, title: 'Cancelled Project', description: 'A project that was cancelled and moved to trash', successPoints: 40, failPoints: -20, frequency: 'once', customDays: 7, status: 'pending', originalDate: new Date(Date.now() - 7*24*60*60*1000).toISOString(), deletedDate: new Date(Date.now() - 1*24*60*60*1000).toISOString() }
      ]
      const newItems = items.filter(it => !existingIds.has(it.id))
      if (newItems.length > 0) { localStorage.setItem('todo_trash', JSON.stringify([...existingTrash, ...newItems])) }
    },
    // ...existing code...
  }
}
</script>

<style>
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
    color: #1f2937;
  }
  .rank-info .rank-level {
    font-size: 12px;
    color: #6b7280;
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
  color: #4b5563;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
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
  color: #4b5563;
  font-size: 12px;
  margin-bottom: 6px;
}

.rank-progress .progress-percentage {
  font-weight: 700;
  color: #111827;
}
.rank-progress .progress-percentage.max-rank {
  color: #2563eb;
}

.rank-progress-bar {
  margin-bottom: 6px;
}

.next-rank-info .next-rank-text,
.max-rank-info .max-rank-text {
  font-size: 12px;
  color: #6b7280;
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
  background-color: #409eff;
  border-color: #409eff;
}
.control-btn.btn-primary:hover {
  background-color: #337ecc;
  border-color: #337ecc;
}
.control-btn.btn-primary:focus {
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.control-btn.btn-success {
  background-color: #67c23a;
  border-color: #67c23a;
}
.control-btn.btn-success:hover {
  background-color: #52a832;
  border-color: #52a832;
}
.control-btn.btn-success:focus {
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.2);
}

.control-btn.btn-info {
  background-color: #909399;
  border-color: #909399;
}
.control-btn.btn-info:hover {
  background-color: #767a80;
  border-color: #767a80;
}
.control-btn.btn-info:focus {
  box-shadow: 0 0 0 3px rgba(144, 147, 153, 0.2);
}

.control-btn.btn-danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
}
.control-btn.btn-danger:hover {
  background-color: #dd6161;
  border-color: #dd6161;
}
.control-btn.btn-danger:focus {
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.2);
}

/* Task input and form styles */
.task-input-section {
  padding: 20px;
  background-color: #fafbfc;
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

/* Toggle header for task input section */
.task-input-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  cursor: pointer;
  user-select: none;
  color: #333;
  font-weight: 600;
  background: #f0f2f5;
  border: 1px solid #e4e7ec;
  border-radius: 6px;
}
.task-input-toggle:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25);
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
  color: #666;
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
  background: linear-gradient(135deg, #e0f2fe, #dbeafe);
  color: #2563eb;
}

.summary-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
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
  color: #111827;
  background: #f3f4f6;
}
.stat-icon.points-icon { color: #b45309; background: #fff7ed; }
.stat-icon.completed-icon { color: #166534; background: #ecfdf5; }
.stat-icon.success-icon { color: #1d4ed8; background: #eff6ff; }

.stat-circle,
.circular-chart {
  width: 64px;
  height: 64px;
}

.circular-chart .circle-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3.8;
}

.circular-chart .circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  animation: chart-progress 1s ease-out forwards;
}
.circular-chart.gold .circle { stroke: #f59e0b; }
.circular-chart.green .circle { stroke: #10b981; }
.circular-chart.blue .circle { stroke: #3b82f6; }

@keyframes chart-progress {
  from { stroke-dasharray: 0 100; }
  to { /* final dasharray set via binding */ }
}

.stat-content.enhanced-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label { font-size: 12px; color: #6b7280; }
.stat-value.enhanced-value { font-size: 20px; font-weight: 800; color: #111827; line-height: 1.1; }
.stat-subtitle { font-size: 11px; color: #9ca3af; }

/* Small screen tweaks */
@media (max-width: 480px) {
  .stat-item.enhanced-stat-item { padding: 10px; }
  .stat-circle, .circular-chart { width: 56px; height: 56px; }
  .stat-value.enhanced-value { font-size: 18px; }
}

/* Fullscreen rank image preview: minimal, centered, and not oversized */
:deep(.rank-image-preview-dialog.is-fullscreen) {
  background: rgba(0, 0, 0, 0.9);
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
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
}
</style>

