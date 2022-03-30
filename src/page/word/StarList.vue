<script>
import { getStore, setStore } from '@/util/store'
import wordStarList from '@/api/wordStarList'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'

function emptyExampleStars () {
  setStore({
    name: 'example_stars',
    content: null,
    type: 'local'
  })
}

function emptyParaphraseStars () {
  setStore({
    name: 'paraphrase_stars',
    content: null,
    type: 'local'
  })
}

function emptyWordStars () {
  setStore({
    name: 'word_stars',
    content: null,
    type: 'local'
  })
}

function cacheWordList (list) {
  if (list && list.length > 0)
    setStore({
      name: 'word_stars',
      content: list,
      type: 'local'
    })
}

function cacheParaphraseList (list) {
  if (list && list.length > 0)
    setStore({
      name: 'paraphrase_stars',
      content: list,
      type: 'local'
    })
}

function cacheExampleList (list) {
  if (list && list.length > 0)
    setStore({
      name: 'example_stars',
      content: list,
      type: 'local'
    })
}

export default {
  components: {
    WordListDetail: $ => import('@/page/word/WordListDetail'),
    ParaphraseListDetail: $ => import('@/page/word/ParaphraseListDetail'),
    ExampleListDetail: $ => import('@/page/word/ExampleListDetail')
  },
  data () {
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
    isSmallWindow () {
      return window.innerWidth <= 400
    }
  },
  async mounted () {
    await this.init(false)
  },
  methods: {
    async init (isUpdateCache) {
      if (this.$route.query.listType) {
        this.list.listType = this.$route.query.listType
      }
      if (this.list.listType === 'word') {
        if (isUpdateCache) emptyWordStars()
        this.list.starListData = getStore({ name: 'word_stars' })
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
        this.list.starListData = getStore({ name: 'paraphrase_stars' })
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
        this.list.starListData = getStore({ name: 'example_stars' })
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
    async refresh () {
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
    selectOneList (id, isReview) {
      this.detail.paraphraseIsReview = isReview
      this.detail.listId = id
      this.visibleToggle()
      this.list.status = 'detail'
    },
    visibleToggle () {
      this.tableVisible = !this.tableVisible
      if (this.list.listType === 'word') {
        this.detail.wordDetailVisible = !this.detail.wordDetailVisible
      } else if (this.list.listType === 'paraphrase') {
        this.detail.paraphraseDetailVisible = !this.detail.paraphraseDetailVisible
      } else if (this.list.listType === 'example') {
        this.detail.exampleDetailVisible = !this.detail.exampleDetailVisible
      }
    },
    handleOperate () {
      this.edit.title = this.list.listName + '-增加'
      this.edit.type = 'add'
      this.edit.form.id = null
      this.edit.form.listName = ''
      this.edit.dialogVisible = true
    },
    handleEdit (index, row) {
      this.edit.title = this.list.listName + '-修改'
      this.edit.type = 'update'
      this.edit.form.id = row.id
      this.edit.dialogVisible = true
    },
    handleDelete (index, row) {
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
      }).then($ => {
        if (this.list.listType === 'word') {
          wordStarList.delById(row.id)
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'paraphrase') {
          paraphraseStarList.delById(row.id)
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'example') {
          exampleStarList.delById(row.id)
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        }
      }).finally($ => {
        loading.close()
      })
    },
    handleEditClose () {
      this.edit.dialogVisible = false
    },
    async handleEditSubmit () {
      this.loading = true
      if (this.edit.type === 'update') {
        if (this.list.listType === 'word') {
          await wordStarList.updateById(this.edit.form)
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'paraphrase') {
          await paraphraseStarList.updateById(this.edit.form)
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'example') {
          await exampleStarList.updateById(this.edit.form)
              .then(response => {
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
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'paraphrase') {
          await paraphraseStarList.save(this.edit.form)
              .then(response => {
                this.doSuccess()
                this.init(true)
              })
              .catch(e => {
                console.error(e)
                this.$message.error(e)
              })
        } else if (this.list.listType === 'example') {
          await exampleStarList.save(this.edit.form)
              .then(response => {
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
    goBack () {
      if (this.list.status === 'detail') {
        if (this.detail.paraphraseIsReview || this.detail.paraphraseIsRead) {
          this.closeAutoReview()
        } else {
          this.visibleToggle()
          this.list.status = 'list'
        }
      } else {
        let queryTmp = { active: 'search' }
        let query
        if (this.$route.query.word) {
          query = {
            ...queryTmp,
            word: this.$route.query.word
          }
        } else {
          query = { ...queryTmp }
        }
        this.$router.push({ path: '/index/vocabulary/detail', query: query })
      }
      this.list.status = 'list'
    },
    async selectReviewMode (command) {
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
        this.totalReview(command.id)
      }
    },
    async listTypeClick (command) {
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
    doSuccess () {
      this.$message.success({
        duration: 1000,
        center: true,
        message: '操作成功'
      })
    },
    multiModeReview (listId, mode) {
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
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
    },
    totalReview (listId) {
      let query
      this.list.reviewMode = 'totalReview'
      if ('word' === this.list.listType) {
        query = {
          active: 'search',
          mode: 'totalReview',
          listId: listId,
          listType: this.list.listType,
          now: new Date().getTime()
        }
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, true)
        query = {
          active: 'starList',
          mode: 'totalReview',
          listId: listId,
          listType: this.list.listType,
          now: new Date().getTime()
        }
      }
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
    },
    multiModeRead (listId, mode) {
      let query
      this.list.reviewMode = mode
      if ('word' === this.list.listType) {
        query = { active: 'search', mode: mode, listId: listId, listType: this.list.listType }
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, false)
        query = { active: 'starList', mode: mode, listId: listId, listType: this.list.listType }
      }
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
    },
    closeAutoReview () {
      this.detail.paraphraseIsReview = false
      this.detail.paraphraseIsRead = false
      this.detail.paraphraseDetailVisible = false
      let query = { active: 'starList' }
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
      window.location.reload()
    }
  }
}
</script>

<template>

  <div class="text item" v-loading="loading">
    <div style="position: fixed; bottom: 5px; right: 30px; z-index: 99;">
      <el-button size="mini" @click="goBack">
        <i class="el-icon-back"
           style="color: #76838f;"></i>
      </el-button>
      <el-button size="mini" @click="refresh">
        <i class="el-icon-refresh"
           style="color: #76838f;"></i>
      </el-button>
      <el-button size="mini" @click="handleOperate">
        <i class="el-icon-folder-add"
           style="color: #76838f;"></i>
      </el-button>
      <el-button size="mini" v-if="list.status==='list'"
                 @click="list.editMode = !list.editMode">
        <i class="el-icon-unlock" v-if="!list.editMode"
           style="color: #76838f;"></i>
        <i class="el-icon-lock" v-if="list.editMode"
           style="color: #76838f;"></i>
      </el-button>
      <el-button size="mini" v-if="list.status==='detail'"
                 @click="detail.isShowParaphrase = !detail.isShowParaphrase">
        <i class="el-icon-lock" v-if="detail.isShowParaphrase"
           style="color: #76838f;"></i>
        <i class="el-icon-unlock" v-if="!detail.isShowParaphrase"
           style="color: #76838f;"></i>
      </el-button>
    </div>
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
          <el-dropdown-item :command="{mode: 'stockReview', id: 0}">存量复习最近收藏</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'enhanceReview', id: 0}">强化复习最近收藏</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'totalReview', id: 0}">全量复习最近收藏</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'stockReviewChToEn', id: 0}">存量复习最近收藏(汉英)
          </el-dropdown-item>
          <el-dropdown-item :command="{mode: 'totalReviewChToEn', id: 0}">全量复习最近收藏(汉英)
          </el-dropdown-item>
          <el-dropdown-item :command="{mode: 'stockRead', id: 0}">存量阅读最近收藏</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'enhanceRead', id: 0}">强化阅读最近收藏</el-dropdown-item>
          <el-dropdown-item :command="{mode: 'totalRead', id: 0}">全量阅读最近收藏</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      &nbsp;
      <span v-if="!isSmallWindow">
        &nbsp;
      </span>
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
              <el-dropdown-item :command="{mode: 'stockReview', id: scope.row.id}">存量复习</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'enhanceReview', id: scope.row.id}">强化复习</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'totalReview', id: scope.row.id}">全量复习</el-dropdown-item>
              <el-dropdown-item :command="{mode: 'stockReviewChToEn', id: scope.row.id}">存量复习(汉英模式)
              </el-dropdown-item>
              <el-dropdown-item :command="{mode: 'totalReviewChToEn', id: scope.row.id}">全量复习(汉英模式)
              </el-dropdown-item>
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