<script>
import {getStore, setStore} from '@/util/store'
import wordStarList from '@/api/wordStarList'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'
import kiwiConst from '@/const/kiwiConsts'

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
    ExampleListDetail: () => import('@/page/word/ExampleListDetail')
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
      }
    }
  },
  computed: {
    isSmallWindow() {
      return window.innerWidth <= 400
    }
  },
  async mounted() {
    await this.init(false)
  },
  methods: {
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
    },
    handleOperate() {
      this.edit.title = this.list.listName + '-增加'
      this.edit.type = 'add'
      this.edit.form.id = null
      this.edit.form.listName = ''
      this.edit.dialogVisible = true
    },
    handleEdit(index, row) {
      this.edit.title = this.list.listName + '-修改'
      this.edit.type = 'update'
      this.edit.form.id = row.id
      this.edit.dialogVisible = true
    },
    handleDelete(index, row) {
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      this.$confirm('即将进行删除, 是否继续?', '删除操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
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
        this.$router.push({path: '/index/tools/detail', query: query})
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
      } else if (command.mode === kiwiConst.REVIEW_MODEL.DOWNLOAD_REVIEW_AUDIO) {
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
        message: '操作成功'
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
      this.$router.push({path: '/index/tools/detail', query: query})
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
      this.$router.push({path: '/index/tools/detail', query: query})
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
      this.$router.push({path: '/index/tools/detail', query: query})
    },
    closeAutoReview() {
      this.detail.paraphraseIsReview = false
      this.detail.paraphraseIsRead = false
      this.detail.paraphraseDetailVisible = false
      let query = {active: 'starList'}
      this.$router.push({path: '/index/tools/detail', query: query})
      window.location.reload()
    }
  }
}
</script>

<template>

  <div class="text item starlist-container" v-loading="loading">
    <!-- Native control bar -->
    <div class="control-bar">
      <!-- List type selector -->
      <select class="ctrl-select" v-model="list.listType" @change="listTypeClick(list.listType)" :disabled="loading || list.status !== 'list'">
        <option value="paraphrase">释义本</option>
        <option value="word">单词本</option>
        <option value="example">例句本</option>
      </select>

      <!-- Global review mode selector (paraphrase list only) -->
      <select class="ctrl-select" v-if="list.listType === 'paraphrase' && list.status === 'list'" @change="selectReviewMode({mode: $event.target.value, id: 0})" :disabled="loading">
        <option value="" disabled selected>选择复习/阅读模式</option>
        <option value="stockReviewChToEn">存量复习(汉英)</option>
        <option value="totalReviewChToEn">全量复习(汉英)</option>
        <option value="stockReview">存量复习</option>
        <option value="enhanceReview">强化复习</option>
        <option value="totalReview">全量复习</option>
        <option value="stockRead">存量阅读</option>
        <option value="enhanceRead">强化阅读</option>
        <option value="totalRead">全量阅读</option>
        <option value="downloadReviewAudio">下载资源</option>
      </select>

      <!-- Actions -->
      <button class="ctrl-btn info" @click="goBack" :disabled="loading">返回</button>
      <button class="ctrl-btn primary" @click="refresh" :disabled="loading">刷新</button>
      <button class="ctrl-btn primary" @click="handleOperate" :disabled="loading || list.status !== 'list'">新建</button>
      <button class="ctrl-btn secondary" @click="operationClick('switch')" :disabled="loading || list.status !== 'list'">{{ list.editMode ? '完成' : '编辑' }}</button>
    </div>

    <!-- Simple list instead of el-table -->
    <div v-show="tableVisible" class="starlist-table">
      <ul class="starlist-list">
        <li v-for="row in list.starListData" :key="row.id" class="starlist-item">
          <button class="list-name-button" @click="selectOneList(row.id, false)" :disabled="loading">{{ row.listName }}</button>

          <!-- Per-row review mode (paraphrase list only, not in edit mode) -->
          <select class="row-select" v-if="list.listType === 'paraphrase' && list.status === 'list' && !list.editMode" @change="selectReviewMode({mode: $event.target.value, id: row.id})" :disabled="loading">
            <option value="" disabled selected>选择模式</option>
            <option value="stockReviewChToEn">存量复习(汉英)</option>
            <option value="totalReviewChToEn">全量复习(汉英)</option>
            <option value="stockReview">存量复习</option>
            <option value="enhanceReview">强化复习</option>
            <option value="totalReview">全量复习</option>
            <option value="stockRead">存量阅读</option>
            <option value="enhanceRead">强化阅读</option>
            <option value="totalRead">全量阅读</option>
          </select>

          <!-- Edit actions -->
          <div v-if="list.editMode" class="row-actions">
            <button class="icon-btn" title="修改" @click="handleEdit(null, row)">✎</button>
            <button class="icon-btn danger" title="删除" :disabled="loading" @click="handleDelete(null, row)">🗑️</button>
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
          <label class="modal-label">名字</label>
          <input class="modal-input" v-model="edit.form.listName" :disabled="loading" />
        </div>
        <div class="modal-footer">
          <button class="ctrl-btn secondary" @click="handleEditClose" :disabled="loading">取消</button>
          <button class="ctrl-btn primary" @click="handleEditSubmit" :disabled="loading">确定</button>
        </div>
      </div>
    </div>

  </div>

</template>

<style scoped>
.starlist-container {
  padding-top: 8px;
}

.control-bar {
  position: fixed;
  top: 60px;
  left: 35px;
  z-index: 99;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  color: #fff;
}

.ctrl-select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
}

.ctrl-select:disabled { opacity: 0.6; cursor: not-allowed; }

.ctrl-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #fff;
}
.ctrl-btn.primary { background: linear-gradient(135deg, #409eff 0%, #67c23a 100%); }
.ctrl-btn.info { background: linear-gradient(135deg, #909399 0%, #606266 100%); }
.ctrl-btn.secondary { background: linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%); color: #2c3e50; }
.ctrl-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* List styling */
.starlist-table { margin-top: 100px; }
.starlist-list { list-style: none; padding: 0; margin: 0; }
.starlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.list-name-button {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}

.row-select {
  margin-left: auto;
  appearance: none;
  -webkit-appearance: none;
  background: #fff;
  color: #2c3e50;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 6px 10px;
}

.row-actions { margin-left: auto; display: inline-flex; gap: 8px; }
.icon-btn { background: #fff; color: #606266; border: 1px solid #e4e7ed; border-radius: 6px; padding: 4px 8px; cursor: pointer; }
.icon-btn.danger { color: #f56c6c; border-color: #f56c6c; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal {
  width: 90%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  overflow: hidden;
}
.modal-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  padding: 12px 16px;
  font-weight: 600;
}
.modal-body { padding: 16px; }
.modal-label { display: block; font-size: 14px; margin-bottom: 8px; color: #606266; }
.modal-input { width: 100%; padding: 8px 10px; border: 1px solid #e4e7ed; border-radius: 6px; }
.modal-footer { padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; }

@media (max-width: 768px) {
  .control-bar { top: 56px; left: 12px; padding: 6px 10px; gap: 6px; }
  .starlist-table { margin-top: 90px; }
}
</style>
