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

  <div class="text item" v-loading="loading">
    <div style="position: fixed; top: 60px; left: 35px; z-index: 99;">
      <el-dropdown size="mini" plain
                   split-button @command="listTypeClick">
        {{ this.list.listName }}
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="paraphrase">释义本</el-dropdown-item>
          <el-dropdown-item command="word">单词本</el-dropdown-item>
          <el-dropdown-item command="example">例句本</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      &nbsp;
      <el-dropdown
          v-if="list.listType === 'paraphrase' && list.status === 'list'"
          size="mini"
          plain
          split-button @command="selectReviewMode">
        <i class="el-icon-video-camera"></i>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item :command="{mode: 'stockReviewChToEn', id: 0}">存量复习(汉英)
          </el-dropdown-item>
          <el-dropdown-item :command="{mode: 'totalReviewChToEn', id: 0}">全量复习(汉英)
          </el-dropdown-item>
          <el-dropdown-item :command="{mode: 'stockReview', id: 0}">存量复习</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'enhanceReview', id: 0}">强化复习</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'totalReview', id: 0}">全量复习</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'stockRead', id: 0}">存量阅读</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'enhanceRead', id: 0}">强化阅读</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'totalRead', id: 0}">全量阅读</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'downloadReviewAudio', id: 0}">下载资源</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      &nbsp;
      <el-dropdown size="mini" plain
                   :split-button="true" @command="operationClick"
                   @click="goBack">
        <i class="el-icon-back"></i>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="refresh">刷新</el-dropdown-item>
          <el-dropdown-item command="add">新建</el-dropdown-item>
          <el-dropdown-item command="switch">切换</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <el-table
        v-show="tableVisible"
        :data="list.starListData"
        style="width: 100%">
      <el-table-column>
        <template slot-scope="scope">
          <div slot="reference" class="name-wrapper">
            <el-button type="info"
                       size="mini"
                       @click="selectOneList(scope.row.id, false)">
              {{ scope.row.listName }}
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column>
        <template slot-scope="scope">
          <span v-if="!isSmallWindow">
            &nbsp;
          </span>
          <el-dropdown
              v-if="list.listType === 'paraphrase' && list.status === 'list' && !list.editMode"
              size="mini"
              split-button type="info" @command="selectReviewMode">
            <i class="el-icon-headset"></i>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command="{mode: 'stockReviewChToEn', id: scope.row.id}">存量复习(汉英模式)
              </el-dropdown-item>
              <el-dropdown-item :command="{mode: 'totalReviewChToEn', id: scope.row.id}">全量复习(汉英模式)
              </el-dropdown-item>
              <el-dropdown-item :command="{mode: 'stockReview', id: scope.row.id}">存量复习</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'enhanceReview', id: scope.row.id}">强化复习</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'totalReview', id: scope.row.id}">全量复习</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'stockRead', id: scope.row.id}">存量阅读</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'enhanceRead', id: scope.row.id}">强化阅读</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'totalRead', id: scope.row.id}">全量阅读</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          &nbsp;
          <el-button
              v-if="list.editMode"
              type="text" style="color: #909399"
              size="mini"
              @click="handleEdit(scope.$index, scope.row)">
            <i class="el-icon-edit-outline"></i>
          </el-button>
          <el-button
              v-if="list.editMode"
              size="mini"
              type="text" style="color: #909399"
              :loading="loading"
              @click="handleDelete(scope.$index, scope.row)">
            <i class="el-icon-delete"></i>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
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
    <el-dialog
        :title="edit.title"
        :visible.sync="edit.dialogVisible"
        width="30%"
        :before-close="handleEditClose">
      <el-form ref="form" :model="edit.form" label-width="80px">
        <el-form-item label="名字">
          <el-input v-model="edit.form.listName"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
                <el-button type="info"
                           :loading="loading"
                           @click="handleEditSubmit">确定</el-button>
            </span>
    </el-dialog>

  </div>

</template>

<style scoped>
/* Button Styling - Consistent with AiResponseDetail.vue */
::v-deep .el-button {
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* Info Button Styling */
::v-deep .el-button--info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
  color: white !important;
  border: none !important;
}

::v-deep .el-button--info:hover:not(.is-loading) {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  color: white !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3) !important;
}

::v-deep .el-button--info:focus {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  color: white !important;
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.3) !important;
}

/* Text Button Styling */
::v-deep .el-button--text {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%) !important;
  color: #409eff !important;
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  padding: 8px 12px !important;
}

::v-deep .el-button--text:hover:not(.is-loading) {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(103, 194, 58, 0.2) 100%) !important;
  color: #3a8ee6 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
}

::v-deep .el-button--text:focus {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(103, 194, 58, 0.2) 100%) !important;
  color: #3a8ee6 !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
}

/* Common button states */
::v-deep .el-button:active {
  transform: translateY(0px) !important;
}

::v-deep .el-button.is-loading {
  opacity: 0.7 !important;
  transform: none !important;
}

/* Mini button size adjustments */
::v-deep .el-button--mini {
  padding: 6px 10px !important;
  font-size: 12px !important;
}

/* Dropdown split button styling */
::v-deep .el-dropdown-split-button .el-button {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
}

::v-deep .el-dropdown-split-button .el-button:hover {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
}

/* Icon styling within buttons */
::v-deep .el-button i {
  margin-right: 4px;
}

/* Dialog footer button styling */
.dialog-footer .el-button--info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
  padding: 10px 20px !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  ::v-deep .el-button {
    padding: 8px 12px !important;
    font-size: 14px !important;
  }
  
  ::v-deep .el-button--mini {
    padding: 6px 8px !important;
    font-size: 12px !important;
  }
  
  .dialog-footer .el-button {
    width: 100% !important;
    margin-top: 10px !important;
  }
}
</style>