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
      isControlBarFolded: false
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
      this.selectReviewMode({ mode, id })
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
        <li v-for="row in list.starListData" :key="row.id" class="starlist-item">
          <button class="list-name-button" @click="selectOneList(row.id, false)" :disabled="loading">{{ row.listName }}</button>

          <!-- Per-row review mode (paraphrase list only, not in edit mode) -->
          <KiwiDropdown v-if="list.listType === 'paraphrase' && list.status === 'list' && !list.editMode" @command="(mode) => handleRowReviewMode(mode, row.id)" class="row-review-dropdown">
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
.starlist-container {
  padding-top: 8px;
}

/* Control bar - glassmorphic floating panel */
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
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal, 0.3s) ease;
}

/* Control bar folded state */
.control-bar.is-folded {
  padding: 8px 16px;
}

/* Toggle button for fold/expand - pill style */
.ctrl-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 28px;
  height: 28px;
  padding: 0 10px;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-xl, 20px);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
}

.ctrl-toggle:hover {
  background: var(--gradient-primary);
  color: #fff;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
}

.ctrl-toggle:active {
  transform: scale(0.98);
}

.ctrl-toggle i {
  font-size: 12px;
  transition: transform var(--transition-fast);
}

.ctrl-toggle .toggle-label {
  display: none;
}

@media (min-width: 481px) {
  .ctrl-toggle .toggle-label {
    display: inline;
  }
}

/* When folded, make toggle more prominent */
.control-bar.is-folded .ctrl-toggle {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.25);
}

.control-bar.is-folded .ctrl-toggle:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.35);
}

/* Control bar content wrapper */
.control-bar-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
}

/* Folded label shown when collapsed */
.folded-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-left: 8px;
}

/* Make the bar adapt on small screens */
@media (max-width: 768px) {
  .control-bar {
    top: 56px;
    left: 12px;
    right: 12px;
    padding: 10px 12px;
    gap: 8px;
  }

  .control-bar.is-folded {
    padding: 6px 12px;
  }

  .ctrl-toggle {
    height: 26px;
    padding: 0 8px;
    font-size: 11px;
  }

  .control-bar-content {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .control-bar {
    left: 8px;
    right: 8px;
    padding: 8px 10px;
    gap: 6px;
  }

  .control-bar.is-folded {
    padding: 6px 10px;
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
    padding: 6px 10px;
    font-size: 12px;
  }

  .ctrl-select {
    width: auto;
    flex: 0 0 auto;
    padding: 6px 10px;
    font-size: 12px;
  }

  .ctrl-toggle {
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    flex-shrink: 0;
  }

  .ctrl-toggle i {
    font-size: 11px;
  }

  .folded-label {
    font-size: 13px;
  }
}

/* Button group wrapper for action buttons */
.control-bar .btn-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .control-bar .btn-group {
    justify-content: center;
  }
}

/* Control select/trigger buttons */
.ctrl-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.ctrl-select:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
  box-shadow: var(--shadow-sm);
}

.ctrl-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ctrl-select i {
  font-size: 12px;
  transition: transform var(--transition-fast);
}

/* Control buttons */
.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.ctrl-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.4s ease;
}

.ctrl-btn:hover::after {
  left: 100%;
}

.ctrl-btn.primary {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.25);
}

.ctrl-btn.primary:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.35);
  transform: translateY(-1px);
}

.ctrl-btn.info {
  background: var(--gradient-info);
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--color-info-rgb), 0.25);
}

.ctrl-btn.info:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 16px rgba(var(--color-info-rgb), 0.35);
  transform: translateY(-1px);
}

.ctrl-btn.secondary {
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.ctrl-btn.secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
}

.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.ctrl-btn:active:not(:disabled) {
  transform: translateY(1px);
}

/* List styling */
.starlist-table {
  padding: 0 4px;
}

.starlist-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.starlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin: 12px 0;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-fast);
}

.starlist-item:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.list-name-button {
  display: inline-flex;
  align-items: center;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: var(--transition-fast);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2);
  position: relative;
  overflow: hidden;
}

.list-name-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s ease;
}

.list-name-button:hover::before {
  left: 100%;
}

.list-name-button:hover {
  filter: brightness(1.1);
  box-shadow: var(--shadow-glow);
  transform: scale(1.02);
}

.list-name-button:active {
  transform: scale(0.98);
}

/* Row select dropdown trigger */
.row-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  background: var(--bg-container);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.row-select:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
}

.row-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.row-select i {
  font-size: 10px;
  transition: transform var(--transition-fast);
}

@media (max-width: 480px) {
  .row-select {
    padding: 6px 10px;
    font-size: 11px;
  }
}

/* Row actions */
.row-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 8px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-container);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 14px;
}

.icon-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  transform: scale(1.05);
}

.icon-btn.danger {
  color: var(--color-danger);
  border-color: rgba(var(--color-danger-rgb), 0.3);
}

.icon-btn.danger:hover {
  color: #fff;
  background: var(--gradient-danger);
  border-color: var(--color-danger);
  box-shadow: 0 0 12px rgba(var(--color-danger-rgb), 0.4);
}

/* Modal - glassmorphic design */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  width: 90%;
  max-width: 420px;
  background: var(--bg-card);
  backdrop-filter: var(--backdrop-filter);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
  overflow: hidden;
  animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  background: var(--gradient-primary);
  color: #fff;
  padding: 16px 20px;
  font-weight: 600;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.modal-body {
  padding: 20px;
}

.modal-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.modal-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition-fast);
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
}

.modal-input::placeholder {
  color: var(--text-placeholder);
}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color-light);
  background: var(--bg-container);
}

/* Dropdown styling enhancements */
.list-type-dropdown,
.review-mode-dropdown,
.row-review-dropdown {
  flex-shrink: 0;
}

::v-deep .kiwi-dropdown-menu {
  min-width: 160px;
}

/* Animation for list items */
.starlist-item {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
