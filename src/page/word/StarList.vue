<script>
import {getStore, setStore} from '@/util/store'
import wordStarList from '@/api/wordStarList'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'
import kiwiConsts from '@/const/kiwiConsts'
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'

function emptyExampleStars() {
  setStore({
    name: 'example_stars',
    content: null,
    type: 'local'
  })
}

function emptyParaphraseStars() {
  setStore({
    name: 'paraphrase_stars',
    content: null,
    type: 'local'
  })
}

function emptyWordStars() {
  setStore({
    name: 'word_stars',
    content: null,
    type: 'local'
  })
}

function cacheWordList(list) {
  if (list && list.length > 0)
    setStore({
      name: 'word_stars',
      content: list,
      type: 'local'
    })
}

function cacheParaphraseList(list) {
  if (list && list.length > 0)
    setStore({
      name: 'paraphrase_stars',
      content: list,
      type: 'local'
    })
}

function cacheExampleList(list) {
  if (list && list.length > 0)
    setStore({
      name: 'example_stars',
      content: list,
      type: 'local'
    })
}

export default {
  components: {
    WordListDetail: () => import('@/page/word/WordListDetail'),
    ParaphraseListDetail: () => import('@/page/word/paraphrase/ParaphraseListDetail.vue'),
    ExampleListDetail: () => import('@/page/word/ExampleListDetail'),
    KiwiDropdown,
    KiwiDropdownItem
  },
  data() {
    return {
      tableVisible: true,
      loading: true,
      page: {
        current: 1,
        size: 20
      },
      list: {
        starListData: [],
        listName: '释',
        listType: 'paraphrase',
        status: 'list',
        reviewMode: '',
        isChToEn: false,
        // 编辑模式
        editMode: false
      },
      detail: {
        wordDetailVisible: false,
        paraphraseDetailVisible: false,
        paraphraseIsReview: false,
        paraphraseIsRead: false,
        exampleDetailVisible: false,
        listId: 0,
        isShowParaphrase: false
      },
      edit: {
        type: '',
        title: '',
        dialogVisible: false,
        form: {
          id: 0,
          listName: ''
        }
      },
      // dynamic top spacing helpers to avoid overlap with fixed control bar
      controlBarHeight: 0,
      controlBarOffsetTop: 0,
      // control bar fold/expand state
      isControlBarFolded: false,
      // Track which row's dropdown is currently active (for z-index management)
      activeDropdownRowId: null
    }
  },
  async mounted() {
    await this.init(false)
    this.$nextTick(() => {
      this.updateControlBarMetrics()
      window.addEventListener('resize', this.updateControlBarMetrics, { passive: true })
      window.addEventListener('orientationchange', this.updateControlBarMetrics, { passive: true })
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateControlBarMetrics)
    window.removeEventListener('orientationchange', this.updateControlBarMetrics)
  },
  watch: {
    'list.status'() {
      this.$nextTick(this.updateControlBarMetrics)
    },
    'list.listType'() {
      this.$nextTick(this.updateControlBarMetrics)
    },
    tableVisible() {
      this.$nextTick(this.updateControlBarMetrics)
    }
  },
  methods: {
    // Measure the fixed control bar and compute offset to push content below it
    updateControlBarMetrics() {
      this.$nextTick(() => {
        const bar = this.$refs.controlBar
        if (!bar) return
        const height = Math.ceil(bar.getBoundingClientRect().height || 0)
        const computed = window.getComputedStyle(bar)
        let topPx = 0
        if (computed && computed.top && computed.top.endsWith('px')) {
          topPx = parseFloat(computed.top) || 0
        }
        this.controlBarHeight = height
        this.controlBarOffsetTop = topPx
      })
    },
    async init(isUpdateCache) {
      if (this.$route.query.listType) {
        this.list.listType = this.$route.query.listType
      }
      if (this.list.listType === 'word') {
        if (isUpdateCache) emptyWordStars()
        this.list.starListData = getStore({name: 'word_stars'})
        if (!this.list.starListData || this.list.starListData.length < 1) {
          await wordStarList.getWordStarList().then(response => {
            this.list.starListData = response.data.data
            cacheWordList(this.list.starListData)
          }).catch(e => {
            console.error(e)
          })
        }
      } else if (this.list.listType === 'paraphrase') {
        if (isUpdateCache) emptyParaphraseStars()
        this.list.starListData = getStore({name: 'paraphrase_stars'})
        if (!this.list.starListData || this.list.starListData.length < 1) {
          await paraphraseStarList.getParaphraseStarList().then(response => {
            this.list.starListData = response.data.data
            cacheParaphraseList(this.list.starListData)
          }).catch(e => {
            console.error(e)
          })
        }
      } else if (this.list.listType === 'example') {
        if (isUpdateCache) emptyExampleStars()
        this.list.starListData = getStore({name: 'example_stars'})
        if (!this.list.starListData || this.list.starListData.length < 1) {
          await exampleStarList.getExampleStarList().then(response => {
            this.list.starListData = response.data.data
            cacheExampleList(this.list.starListData)
          }).catch(e => {
            console.error(e)
          })
        }
      }
      this.loading = false
      this.$nextTick(this.updateControlBarMetrics)
    },
    async refresh() {
      if (this.list.status === 'list') {
        await this.init(true)
      } else {
        if (this.list.listType === 'word') {
          await this.$refs.wordDetail.initList()
        } else if (this.list.listType === 'paraphrase') {
          await this.$refs.paraphraseDetail.init()
        } else if (this.list.listType === 'example') {
          await this.$refs.exampleDetail.initList()
        }
      }
    },
    selectOneList(id, isReview) {
      this.detail.paraphraseIsReview = isReview
      this.detail.listId = id
      this.visibleToggle()
      this.list.status = 'detail'
    },
    visibleToggle() {
      this.tableVisible = !this.tableVisible
      if (this.list.listType === 'word') {
        this.detail.wordDetailVisible = !this.detail.wordDetailVisible
      } else if (this.list.listType === 'paraphrase') {
        this.detail.paraphraseDetailVisible = !this.detail.paraphraseDetailVisible
      } else if (this.list.listType === 'example') {
        this.detail.exampleDetailVisible = !this.detail.exampleDetailVisible
      }
      this.$nextTick(this.updateControlBarMetrics)
    },
    computeListLabel() {
      return this.$t(`starList.listLabel.${this.list.listType}`)
    },
    handleOperate() {
      const label = this.computeListLabel()
      this.edit.title = `${label} - ${this.$t('common.add')}`
      this.edit.type = 'add'
      this.edit.form.id = null
      this.edit.form.listName = ''
      this.edit.dialogVisible = true
    },
    handleEdit(index, row) {
      const label = this.computeListLabel()
      this.edit.title = `${label} - ${this.$t('common.edit')}`
      this.edit.type = 'update'
      this.edit.form.id = row.id
      this.edit.dialogVisible = true
    },
    handleDelete(index, row) {
      const loading = this.$loading({
        lock: true,
        text: this.$t('common.loading'),
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      this.$confirm(this.$t('messages.confirmDelete'), this.$t('collections.deleteOperation'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        if (this.list.listType === 'word') {
          wordStarList.delById(row.id)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'paraphrase') {
          paraphraseStarList.delById(row.id)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'example') {
          exampleStarList.delById(row.id)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        }
      }).finally(() => {
        loading.close()
      })
    },
    handleEditClose() {
      this.edit.dialogVisible = false
    },
    async handleEditSubmit() {
      this.loading = true
      if (this.edit.type === 'update') {
        if (this.list.listType === 'word') {
          await wordStarList.updateById(this.edit.form)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'paraphrase') {
          await paraphraseStarList.updateById(this.edit.form)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'example') {
          await exampleStarList.updateById(this.edit.form)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        }
      } else if (this.edit.type === 'add') {
        if (this.list.listType === 'word') {
          await wordStarList.save(this.edit.form)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'paraphrase') {
          await paraphraseStarList.save(this.edit.form)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'example') {
          await exampleStarList.save(this.edit.form)
              .then(() => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        }
      }
      this.loading = false
      this.handleEditClose()
    },
    goBack() {
      if (this.list.status === 'detail') {
        if (this.detail.paraphraseIsReview || this.detail.paraphraseIsRead) {
          this.closeAutoReview()
        } else {
          this.detail.paraphraseIsReview = false
          this.detail.paraphraseIsRead = false
          this.visibleToggle()
          this.list.status = 'list'
        }
      } else {
        let queryTmp = {active: 'search'}
        let query
        if (this.$route.query.word) {
          query = {
            ...queryTmp,
            word: this.$route.query.word
          }
        } else {
          query = {...queryTmp}
        }
        this.$router.push({path: kiwiConsts.ROUTES.DETAIL, query: query})
      }
      this.list.status = 'list'
    },
    async selectReviewMode(command) {
      if (command.mode === 'stockReview') {
        this.list.isChToEn = false
        this.multiModeReview(command.id, 'stockReview')
      } else if (command.mode === 'enhanceReview') {
        this.list.isChToEn = false
        this.multiModeReview(command.id, 'enhanceReview')
      } else if (command.mode === 'totalReview') {
        this.list.isChToEn = false
        this.totalReview(command.id)
      } else if (command.mode === 'stockRead') {
        this.list.isChToEn = false
        this.detail.paraphraseIsRead = true
        this.multiModeRead(command.id, 'stockRead')
      } else if (command.mode === 'enhanceRead') {
        this.list.isChToEn = false
        this.detail.paraphraseIsRead = true
        this.multiModeRead(command.id, 'enhanceRead')
      } else if (command.mode === 'totalRead') {
        this.list.isChToEn = false
        this.detail.paraphraseIsRead = true
        this.selectOneList(command.id, false)
      } else if (command.mode === 'stockReviewChToEn') {
        this.list.isChToEn = true
        this.multiModeReview(command.id, 'stockReview')
      } else if (command.mode === 'totalReviewChToEn') {
        this.list.isChToEn = true
        this.totalReview(command.id, command.mode)
      } else if (command.mode === kiwiConsts.REVIEW_MODEL.DOWNLOAD_REVIEW_AUDIO) {
        this.list.isChToEn = true
        this.totalReview(command.id, command.mode)
      }
    },
    async listTypeClick(command) {
      if (this.list.status === 'detail') {
        this.visibleToggle()
      }
      this.list.status = 'list'
      this.list.listType = command
      if (command === 'word') {
        this.list.listName = '单'
      } else if (command === 'paraphrase') {
        this.list.listName = '释'
      } else if (command === 'example') {
        this.list.listName = '例'
      }
      await this.init(false)
    },
    async operationClick(command) {
      if (command === 'add') {
        this.handleOperate()
      } else if (command === 'refresh') {
        this.refresh()
      } else if (command === 'switch') {
        if (this.list.status === 'detail') {
          this.detail.isShowParaphrase = !this.detail.isShowParaphrase
        } else if (this.list.status === 'list') {
          this.list.editMode = !this.list.editMode
        }
      }
    },
    doSuccess() {
      this.$message.success({
        duration: 1000,
        center: true,
        message: this.$t('messages.operationSuccess')
      })
    },
    multiModeReview(listId, mode) {
      let query
      this.list.reviewMode = mode
      if ('word' === this.list.listType) {
        query = {
          active: 'search',
          mode: mode,
          listId: listId,
          listType: this.list.listType,
          now: new Date().getTime()
        }
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, true)
        query = {
          active: 'starList',
          mode: mode,
          listId: listId,
          listType: this.list.listType,
          now: new Date().getTime()
        }
      }
      this.$router.push({path: kiwiConsts.ROUTES.DETAIL, query: query})
    },
    totalReview(listId, currentMode) {
      let query
      this.list.reviewMode = currentMode
      if ('word' === this.list.listType) {
        query = {
          active: 'search',
          mode: currentMode,
          listId: listId,
          listType: this.list.listType,
          now: new Date().getTime()
        }
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, true)
        query = {
          active: 'starList',
          mode: currentMode,
          listId: listId,
          listType: this.list.listType,
          now: new Date().getTime()
        }
      }
      this.$router.push({path: kiwiConsts.ROUTES.DETAIL, query: query})
    },
    multiModeRead(listId, mode) {
      let query
      this.list.reviewMode = mode
      if ('word' === this.list.listType) {
        query = {active: 'search', mode: mode, listId: listId, listType: this.list.listType}
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, false)
        query = {active: 'starList', mode: mode, listId: listId, listType: this.list.listType}
      }
      this.$router.push({path: kiwiConsts.ROUTES.DETAIL, query: query})
    },
    closeAutoReview() {
      this.detail.paraphraseIsReview = false
      this.detail.paraphraseIsRead = false
      this.detail.paraphraseDetailVisible = false
      let query = {active: 'starList'}
      this.$router.push({path: kiwiConsts.ROUTES.DETAIL, query: query})
      window.location.reload()
    },
    getListTypeLabel(type) {
      const labels = {
        'paraphrase': this.$t('starList.listType.paraphrase'),
        'word': this.$t('starList.listType.word'),
        'example': this.$t('starList.listType.example')
      }
      return labels[type] || this.$t('starList.listType.paraphrase')
    },
    toggleControlBar() {
      this.isControlBarFolded = !this.isControlBarFolded
      this.$nextTick(this.updateControlBarMetrics)
    },
    handleGlobalReviewMode(mode) {
      this.selectReviewMode({ mode, id: 0 })
    },
    handleRowReviewMode(mode, id) {
      this.activeDropdownRowId = null
      this.selectReviewMode({ mode, id })
    },
    handleRowDropdownVisible(rowId, visible) {
      this.activeDropdownRowId = visible ? rowId : null
    }
  },
  computed: {
    // total top margin for the list to clear the fixed control bar
    listContentTop() {
      // add an extra small gap (12px) for breathing room
      return Math.max(80, Math.ceil(this.controlBarOffsetTop + this.controlBarHeight + 12))
    }
  }
}
</script>

<template>

  <div class="text item starlist-container" v-loading="loading">
    <!-- Native control bar -->
    <div class="control-bar" :class="{ 'is-folded': isControlBarFolded }" ref="controlBar">
      <!-- Fold/Expand toggle button -->
      <button class="ctrl-toggle" @click="toggleControlBar" :title="isControlBarFolded ? $t('common.expand') : $t('common.collapse')">
        <i :class="isControlBarFolded ? 'el-icon-caret-bottom' : 'el-icon-caret-top'"></i>
        <span class="toggle-label">{{ isControlBarFolded ? $t('common.expand') : $t('common.collapse') }}</span>
      </button>

      <!-- Collapsible content -->
      <div class="control-bar-content" v-show="!isControlBarFolded">
        <!-- List type selector -->
        <KiwiDropdown @command="listTypeClick" class="list-type-dropdown">
          <button class="ctrl-select" :disabled="loading || list.status !== 'list'">
            {{ getListTypeLabel(list.listType) }}
            <i class="el-icon-arrow-down"></i>
          </button>
          <template slot="dropdown">
            <KiwiDropdownItem command="paraphrase">{{ $t('starList.listType.paraphrase') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="word">{{ $t('starList.listType.word') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="example">{{ $t('starList.listType.example') }}</KiwiDropdownItem>
          </template>
        </KiwiDropdown>

        <!-- Global review mode selector (paraphrase list only) -->
        <KiwiDropdown v-if="list.listType === 'paraphrase' && list.status === 'list'" @command="handleGlobalReviewMode" class="review-mode-dropdown">
          <button class="ctrl-select" :disabled="loading">
            {{ $t('starList.selectReviewModePlaceholder') }}
            <i class="el-icon-arrow-down"></i>
          </button>
          <template slot="dropdown">
            <KiwiDropdownItem command="stockReviewChToEn">{{ $t('review.stockReviewChToEn') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="totalReviewChToEn">{{ $t('review.totalReviewChToEn') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="stockReview">{{ $t('review.stockReview') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="enhanceReview">{{ $t('review.enhanceReview') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="totalReview">{{ $t('review.totalReview') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="stockRead">{{ $t('review.stockRead') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="enhanceRead">{{ $t('review.enhanceRead') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="totalRead">{{ $t('review.totalRead') }}</KiwiDropdownItem>
            <KiwiDropdownItem command="downloadReviewAudio">{{ $t('review.downloadResources') }}</KiwiDropdownItem>
          </template>
        </KiwiDropdown>

        <!-- Actions -->
        <button class="ctrl-btn info" @click="goBack" :disabled="loading">{{ $t('common.back') }}</button>
        <button class="ctrl-btn primary" @click="refresh" :disabled="loading">{{ $t('common.refresh') }}</button>
        <button class="ctrl-btn primary" @click="handleOperate" :disabled="loading || list.status !== 'list'">{{ $t('common.add') }}</button>
        <button class="ctrl-btn secondary" @click="operationClick('switch')" :disabled="loading || list.status !== 'list'">{{ list.editMode ? $t('common.done') : $t('common.edit') }}</button>
      </div>

      <!-- Folded state indicator -->
      <span v-if="isControlBarFolded" class="folded-label">{{ getListTypeLabel(list.listType) }}</span>
    </div>

    <!-- Simple list instead of el-table -->
    <div v-show="tableVisible" class="starlist-table" :style="{ marginTop: listContentTop + 'px' }">
      <ul class="starlist-list">
        <li v-for="row in list.starListData" :key="row.id" class="starlist-item" :class="{ 'dropdown-active': activeDropdownRowId === row.id }">
          <button class="list-name-button" @click="selectOneList(row.id, false)" :disabled="loading">{{ row.listName }}</button>

          <!-- Per-row review mode (paraphrase list only, not in edit mode) -->
          <KiwiDropdown v-if="list.listType === 'paraphrase' && list.status === 'list' && !list.editMode" @command="(mode) => handleRowReviewMode(mode, row.id)" @visible-change="(visible) => handleRowDropdownVisible(row.id, visible)" class="row-review-dropdown">
            <button class="row-select" :disabled="loading">
              {{ $t('starList.selectMode') }}
              <i class="el-icon-arrow-down"></i>
            </button>
            <template slot="dropdown">
              <KiwiDropdownItem command="stockReviewChToEn">{{ $t('review.stockReviewChToEn') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="totalReviewChToEn">{{ $t('review.totalReviewChToEn') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="stockReview">{{ $t('review.stockReview') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="enhanceReview">{{ $t('review.enhanceReview') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="totalReview">{{ $t('review.totalReview') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="stockRead">{{ $t('review.stockRead') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="enhanceRead">{{ $t('review.enhanceRead') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="totalRead">{{ $t('review.totalRead') }}</KiwiDropdownItem>
            </template>
          </KiwiDropdown>

          <!-- Edit actions -->
          <div v-if="list.editMode" class="row-actions">
            <button class="icon-btn" :title="$t('common.edit')" @click="handleEdit(null, row)">✎</button>
            <button class="icon-btn danger" :title="$t('common.delete')" :disabled="loading" @click="handleDelete(null, row)">🗑️</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Detail views -->
    <WordListDetail
        ref="wordDetail"
        v-if="detail.wordDetailVisible && list.listType === 'word' && list.status === 'detail'"
        :listId="detail.listId"
        :isShowParaphrase.sync="detail.isShowParaphrase"
        @tableVisibleToggle="visibleToggle"></WordListDetail>
    <ParaphraseListDetail
        ref="paraphraseDetail"
        v-if="detail.paraphraseDetailVisible && list.listType === 'paraphrase' && list.status === 'detail'"
        :listId="detail.listId"
        :isReview="detail.paraphraseIsReview"
        :isChToEn="list.isChToEn"
        :reviewMode="list.reviewMode"
        :isShowParaphrase.sync="detail.isShowParaphrase"
        @tableVisibleToggle="visibleToggle"></ParaphraseListDetail>
    <ExampleListDetail
        ref="exampleDetail"
        v-if="detail.exampleDetailVisible && list.listType === 'example' && list.status === 'detail'"
        :listId="detail.listId"
        :isShowParaphrase.sync="detail.isShowParaphrase"
        @tableVisibleToggle="visibleToggle"></ExampleListDetail>

    <!-- Custom Modal for Add/Edit -->
    <div v-if="edit.dialogVisible" class="modal-overlay" @click.self="handleEditClose">
      <div class="modal">
        <div class="modal-header">{{ edit.title }}</div>
        <div class="modal-body">
          <label class="modal-label">{{ $t('collections.listName') }}</label>
          <input class="modal-input" v-model="edit.form.listName" :disabled="loading" />
        </div>
        <div class="modal-footer">
          <button class="ctrl-btn secondary" @click="handleEditClose" :disabled="loading">{{ $t('common.cancel') }}</button>
          <button class="ctrl-btn primary" @click="handleEditSubmit" :disabled="loading">{{ $t('common.confirm') }}</button>
        </div>
      </div>
    </div>

  </div>

</template>

<style scoped>
/* ========================================
   STARLIST CONTAINER - Enhanced Styles
   ======================================== */
.starlist-container {
  padding-top: 8px;
  min-height: 100vh;
  position: relative;
}

/* ========================================
   CONTROL BAR - Glassmorphic Floating Panel
   ======================================== */
.control-bar {
  position: fixed;
  top: 60px;
  left: 35px;
  right: 35px;
  z-index: 99;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-color-light);
  box-shadow:
    var(--shadow-card),
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity, padding;
}

.control-bar:hover {
  box-shadow:
    var(--shadow-card),
    0 12px 40px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Control bar folded state */
.control-bar.is-folded {
  padding: 10px 18px;
  box-shadow:
    var(--shadow-sm),
    0 4px 16px rgba(0, 0, 0, 0.06);
}

/* ========================================
   TOGGLE BUTTON - Pill Style
   ======================================== */
.ctrl-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 32px;
  height: 32px;
  padding: 0 12px;
  background: rgba(var(--color-primary-rgb), 0.12);
  color: var(--color-primary);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
}

.ctrl-toggle::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ctrl-toggle:hover {
  color: #fff;
  transform: scale(1.05);
  box-shadow:
    0 4px 16px rgba(var(--color-primary-rgb), 0.4),
    0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
}

.ctrl-toggle:hover::before {
  opacity: 1;
}

.ctrl-toggle:active {
  transform: scale(0.95);
}

.ctrl-toggle i,
.ctrl-toggle .toggle-label {
  position: relative;
  z-index: 1;
}

.ctrl-toggle i {
  font-size: 14px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ctrl-toggle:hover i {
  transform: translateY(1px);
}

.ctrl-toggle .toggle-label {
  display: none;
}

@media (min-width: 481px) {
  .ctrl-toggle .toggle-label {
    display: inline;
  }
}

/* Folded state toggle - more prominent */
.control-bar.is-folded .ctrl-toggle {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow:
    0 4px 12px rgba(var(--color-primary-rgb), 0.35),
    0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.control-bar.is-folded .ctrl-toggle::before {
  opacity: 1;
}

.control-bar.is-folded .ctrl-toggle:hover {
  filter: brightness(1.15);
  box-shadow:
    0 6px 20px rgba(var(--color-primary-rgb), 0.45),
    0 0 0 4px rgba(var(--color-primary-rgb), 0.15);
}

/* ========================================
   CONTROL BAR CONTENT
   ======================================== */
.control-bar-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  animation: contentFadeIn 0.3s ease;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Folded label */
.folded-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-left: 10px;
  padding: 4px 12px;
  background: rgba(var(--color-primary-rgb), 0.08);
  border-radius: 20px;
  animation: labelSlideIn 0.3s ease;
}

@keyframes labelSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========================================
   CONTROL SELECT BUTTONS
   ======================================== */
.ctrl-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.ctrl-select::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.1), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.ctrl-select:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow:
    0 4px 12px rgba(var(--color-primary-rgb), 0.15),
    0 0 0 3px rgba(var(--color-primary-rgb), 0.08);
  transform: translateY(-1px);
}

.ctrl-select:hover:not(:disabled)::before {
  opacity: 1;
}

.ctrl-select:active:not(:disabled) {
  transform: translateY(0);
}

.ctrl-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ctrl-select i {
  font-size: 12px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.ctrl-select:hover:not(:disabled) i {
  transform: translateY(2px);
}

/* ========================================
   CONTROL BUTTONS
   ======================================== */
.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-md);
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.2px;
}

/* Shine effect */
.ctrl-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.ctrl-btn:hover::after {
  left: 100%;
}

/* Primary button */
.ctrl-btn.primary {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow:
    0 4px 12px rgba(var(--color-primary-rgb), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.ctrl-btn.primary:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow:
    0 6px 20px rgba(var(--color-primary-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.ctrl-btn.primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(var(--color-primary-rgb), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Info button */
.ctrl-btn.info {
  background: var(--gradient-info);
  color: #fff;
  box-shadow:
    0 4px 12px rgba(var(--color-info-rgb), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.ctrl-btn.info:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow:
    0 6px 20px rgba(var(--color-info-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.ctrl-btn.info:active:not(:disabled) {
  transform: translateY(0);
}

/* Secondary button */
.ctrl-btn.secondary {
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
}

.ctrl-btn.secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.12);
  transform: translateY(-2px);
}

.ctrl-btn.secondary:active:not(:disabled) {
  transform: translateY(0);
}

.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  filter: grayscale(0.3);
}

/* ========================================
   LIST STYLING
   ======================================== */
.starlist-table {
  padding: 0 8px;
  overflow: visible;
}

.starlist-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow: visible;
}

/* List items with staggered animation */
.starlist-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  margin: 14px auto;
  max-width: 600px;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    var(--shadow-sm),
    0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1), z-index 0s;
  position: relative;
  overflow: visible;
  animation: itemSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  /* Reverse stacking order so earlier items appear above later ones for dropdown visibility */
  z-index: 1;
}

/* When a dropdown inside an item is active, raise that item above all others */
.starlist-item:has(.kiwi-dropdown.is-active),
.starlist-item.dropdown-active {
  z-index: 100;
}

/* Staggered animation for list items */
.starlist-item:nth-child(1) { animation-delay: 0.05s; }
.starlist-item:nth-child(2) { animation-delay: 0.1s; }
.starlist-item:nth-child(3) { animation-delay: 0.15s; }
.starlist-item:nth-child(4) { animation-delay: 0.2s; }
.starlist-item:nth-child(5) { animation-delay: 0.25s; }
.starlist-item:nth-child(6) { animation-delay: 0.3s; }
.starlist-item:nth-child(7) { animation-delay: 0.35s; }
.starlist-item:nth-child(8) { animation-delay: 0.4s; }
.starlist-item:nth-child(n+9) { animation-delay: 0.45s; }

@keyframes itemSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Subtle gradient overlay on hover */
.starlist-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb), 0.03),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.starlist-item:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
  box-shadow:
    var(--shadow-hover),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(var(--color-primary-rgb), 0.1);
  transform: translateY(-3px) scale(1.005);
}

.starlist-item:hover::before {
  opacity: 1;
}

.starlist-item:active {
  transform: translateY(-1px) scale(1);
}

/* ========================================
   LIST NAME BUTTON
   ======================================== */
.list-name-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(var(--color-primary-rgb), 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  letter-spacing: 0.3px;
}

/* Shine sweep effect */
.list-name-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.25),
    transparent
  );
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-name-button:hover::before {
  left: 100%;
}

.list-name-button:hover {
  filter: brightness(1.1);
  box-shadow:
    0 8px 24px rgba(var(--color-primary-rgb), 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
  transform: scale(1.02);
}

.list-name-button:active {
  transform: scale(0.98);
  box-shadow:
    0 2px 8px rgba(var(--color-primary-rgb), 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.list-name-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.3);
}

/* ========================================
   ROW SELECT DROPDOWN
   ======================================== */
.row-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.row-select::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.08), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.row-select:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow:
    0 4px 12px rgba(var(--color-primary-rgb), 0.15),
    0 0 0 3px rgba(var(--color-primary-rgb), 0.08);
  transform: translateY(-1px);
}

.row-select:hover:not(:disabled)::before {
  opacity: 1;
}

.row-select:active:not(:disabled) {
  transform: translateY(0);
}

.row-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.row-select i {
  font-size: 11px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.row-select:hover:not(:disabled) i {
  transform: translateY(2px);
}

/* ========================================
   ROW ACTIONS
   ======================================== */
.row-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 10px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-container);
  color: var(--text-secondary);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 15px;
  position: relative;
  overflow: hidden;
}

.icon-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(var(--color-primary-rgb), 0.1);
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: inherit;
}

.icon-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1.1) rotate(2deg);
  box-shadow:
    0 4px 12px rgba(var(--color-primary-rgb), 0.2),
    0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.icon-btn:hover::before {
  opacity: 1;
}

.icon-btn:active {
  transform: scale(0.95);
}

/* Danger icon button */
.icon-btn.danger {
  color: var(--color-danger);
  border-color: rgba(var(--color-danger-rgb), 0.3);
}

.icon-btn.danger::before {
  background: rgba(var(--color-danger-rgb), 0.1);
}

.icon-btn.danger:hover {
  color: #fff;
  background: var(--gradient-danger);
  border-color: var(--color-danger);
  box-shadow:
    0 4px 16px rgba(var(--color-danger-rgb), 0.4),
    0 0 0 3px rgba(var(--color-danger-rgb), 0.15);
  transform: scale(1.1) rotate(-2deg);
}

/* ========================================
   MODAL - Glassmorphic Design
   ======================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px) saturate(150%);
  }
}

.modal {
  width: 90%;
  max-width: 440px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-xl);
  box-shadow:
    var(--shadow-float),
    0 24px 80px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  animation: modalBounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalBounceIn {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(-30px);
  }
  50% {
    transform: scale(1.02) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  background: var(--gradient-primary);
  color: #fff;
  padding: 18px 24px;
  font-weight: 600;
  font-size: 17px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.modal-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1));
}

.modal-body {
  padding: 24px;
}

.modal-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-secondary);
  letter-spacing: 0.3px;
}

.modal-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 4px rgba(var(--color-primary-rgb), 0.12),
    0 4px 12px rgba(var(--color-primary-rgb), 0.1);
}

.modal-input::placeholder {
  color: var(--text-placeholder);
}

.modal-footer {
  padding: 18px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  border-top: 1px solid var(--border-color-light);
  background: rgba(var(--color-primary-rgb), 0.02);
}

/* ========================================
   DROPDOWN STYLING
   ======================================== */
.list-type-dropdown,
.review-mode-dropdown,
.row-review-dropdown {
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

/* Ensure dropdown in row appears above other items */
.row-review-dropdown {
  z-index: 20;
}

::v-deep .kiwi-dropdown.is-active {
  z-index: 9999;
}

/* Ensure the dropdown menu renders above list items */
::v-deep .kiwi-dropdown-menu {
  min-width: 180px;
  z-index: 9999;
}


/* ========================================
   BUTTON GROUP
   ======================================== */
.control-bar .btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ========================================
   RESPONSIVE STYLES
   ======================================== */
@media (max-width: 768px) {
  .control-bar {
    top: 56px;
    left: 12px;
    right: 12px;
    padding: 12px 14px;
    gap: 8px;
  }

  .control-bar.is-folded {
    padding: 8px 14px;
  }

  .ctrl-toggle {
    height: 30px;
    padding: 0 10px;
    font-size: 11px;
  }

  .ctrl-toggle i {
    font-size: 13px;
  }

  .control-bar-content {
    gap: 8px;
  }

  .starlist-item {
    padding: 14px 16px;
    gap: 12px;
    max-width: 500px;
  }
}

@media (max-width: 480px) {
  .control-bar {
    left: 8px;
    right: 8px;
    padding: 10px 12px;
    gap: 6px;
  }

  .control-bar.is-folded {
    padding: 8px 12px;
    flex-direction: row;
    align-items: center;
  }

  .control-bar-content {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    width: 100%;
  }

  .ctrl-btn {
    width: auto;
    flex: 0 0 auto;
    padding: 8px 12px;
    font-size: 12px;
  }

  .ctrl-select {
    width: auto;
    flex: 0 0 auto;
    padding: 8px 12px;
    font-size: 12px;
  }

  .ctrl-toggle {
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    flex-shrink: 0;
  }

  .ctrl-toggle i {
    font-size: 12px;
  }

  .folded-label {
    font-size: 13px;
    padding: 3px 10px;
  }

  .control-bar .btn-group {
    justify-content: center;
  }

  .starlist-item {
    padding: 12px 14px;
    margin: 10px auto;
    max-width: 100%;
    gap: 10px;
    flex-wrap: wrap;
  }

  .list-name-button {
    padding: 10px 14px;
    font-size: 13px;
    min-width: 100px;
  }

  .row-select {
    padding: 8px 12px;
    font-size: 11px;
  }

  .row-actions {
    gap: 8px;
  }

  .icon-btn {
    width: 34px;
    height: 34px;
    font-size: 14px;
  }
}

/* ========================================
   ACCESSIBILITY & FOCUS STATES
   ======================================== */
.ctrl-btn:focus-visible,
.ctrl-select:focus-visible,
.ctrl-toggle:focus-visible,
.list-name-button:focus-visible,
.row-select:focus-visible,
.icon-btn:focus-visible,
.modal-input:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(var(--color-primary-rgb), 0.4),
    0 0 0 6px rgba(var(--color-primary-rgb), 0.15);
}

/* ========================================
   REDUCED MOTION PREFERENCE
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
