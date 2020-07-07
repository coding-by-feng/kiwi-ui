<script>
import wordStarList from '@/api/wordStarList'
import paraphraseStarList from '@/api/paraphraseStarList'
import exampleStarList from '@/api/exampleStarList'

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
        listName: '释义本',
        listType: 'paraphrase',
        status: 'list',
        reviewMode: ''
      },
      detail: {
        wordDetailVisible: false,
        paraphraseDetailVisible: false,
        paraphraseIsReview: false,
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
  async mounted () {
    if (!(this.$route.query.lazy === 'y')) {
      await this.init()
    }
  },
  methods: {
    async init () {
      if (this.$route.query.listType) {
        this.list.listType = this.$route.query.listType
      }
      if (this.list.listType === 'word') {
        await wordStarList.getWordStarList().then(response => {
          this.list.starListData = response.data.data
        }).catch(e => {
          console.error(e)
        })
      } else if (this.list.listType === 'paraphrase') {
        await paraphraseStarList.getParaphraseStarList().then(response => {
          this.list.starListData = response.data.data
        }).catch(e => {
          console.error(e)
        })
      } else if (this.list.listType === 'example') {
        await exampleStarList.getExampleStarList().then(response => {
          this.list.starListData = response.data.data
        }).catch(e => {
          console.error(e)
        })
      }
      this.loading = false
    },
    async refresh () {
      if (this.list.status === 'list') {
        await this.init()
      } else {
        if (this.list.listType === 'word') {
          await this.$refs.wordDetail.initList()
        } else if (this.list.listType === 'paraphrase') {
          await this.$refs.paraphraseDetail.initList()
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
      this.edit.title = this.list.listName + '增加'
      this.edit.type = 'add'
      this.edit.form.id = null
      this.edit.form.listName = ''
      this.edit.dialogVisible = true
    },
    handleEdit (index, row) {
      this.edit.title = this.list.listName + '修改'
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
              this.init()
            })
            .catch(e => {
              console.error(e)
              this.$message.error(e)
            })
        } else if (this.list.listType === 'paraphrase') {
          paraphraseStarList.delById(row.id)
            .then(response => {
              this.doSuccess()
              this.init()
            })
            .catch(e => {
              console.error(e)
              this.$message.error(e)
            })
        } else if (this.list.listType === 'example') {
          exampleStarList.delById(row.id)
            .then(response => {
              this.doSuccess()
              this.init()
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
              this.init()
            })
            .catch(e => {
              console.error(e)
              this.$message.error(e)
            })
        } else if (this.list.listType === 'paraphrase') {
          await paraphraseStarList.updateById(this.edit.form)
            .then(response => {
              this.doSuccess()
              this.init()
            })
            .catch(e => {
              console.error(e)
              this.$message.error(e)
            })
        } else if (this.list.listType === 'example') {
          await exampleStarList.updateById(this.edit.form)
            .then(response => {
              this.doSuccess()
              this.init()
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
              this.init()
            })
            .catch(e => {
              console.error(e)
              this.$message.error(e)
            })
        } else if (this.list.listType === 'paraphrase') {
          await paraphraseStarList.save(this.edit.form)
            .then(response => {
              this.doSuccess()
              this.init()
            })
            .catch(e => {
              console.error(e)
              this.$message.error(e)
            })
        } else if (this.list.listType === 'example') {
          await exampleStarList.save(this.edit.form)
            .then(response => {
              this.doSuccess()
              this.init()
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
        this.visibleToggle()
        this.list.status = 'list'
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
    async listTypeClick (command) {
      if (this.list.status === 'detail') {
        this.visibleToggle()
      }
      this.list.status = 'list'
      this.list.listType = command
      if (command === 'word') {
        this.list.listName = '单词本'
      } else if (command === 'paraphrase') {
        this.list.listName = '释义本'
      } else if (command === 'example') {
        this.list.listName = '例句本'
      }
      await this.init()
    },
    doSuccess () {
      this.$message.success({
        duration: 1000,
        message: '操作成功'
      })
    },
    autoReview (listId) {
      let query
      this.list.reviewMode = 'autoReview'
      if ('word' === this.list.listType) {
        query = { active: 'search', mode: 'autoReview', listId: listId, listType: this.list.listType }
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, true)
        query = { active: 'starList', mode: 'autoReview', listId: listId, listType: this.list.listType }
      }
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
    },
    autoAllReview (listId) {
      let query
      this.list.reviewMode = 'autoAllReview'
      if ('word' === this.list.listType) {
        query = { active: 'search', mode: 'autoAllReview', listId: listId, listType: this.list.listType }
      } else if ('paraphrase' === this.list.listType) {
        this.selectOneList(listId, true)
        query = { active: 'starList', mode: 'autoAllReview', listId: listId, listType: this.list.listType }
      }
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
    },
    closeAutoReview () {
      this.detail.paraphraseIsReview = false
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
        <el-page-header @back="goBack" title="">
            <div slot="content">
                <el-dropdown size="mini"
                             split-button type="primary" @command="listTypeClick">
                    {{this.list.listName}}
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="paraphrase">释义本</el-dropdown-item>
                        <el-dropdown-item command="word">单词本</el-dropdown-item>
                        <el-dropdown-item command="example">例句本</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                &nbsp;
                <el-button type="primary"
                           v-show="list.status==='list'"
                           @click="handleOperate"
                           size="mini">
                    <i class="el-icon-folder-add"></i>
                </el-button>
                <el-button type="primary" @click="refresh"
                           size="mini">
                    <i class="el-icon-refresh"></i>
                </el-button>
                <el-button type="primary"
                           v-show="list.status==='detail'"
                           @click="detail.isShowParaphrase = !detail.isShowParaphrase"
                           size="mini">
                    <i class="el-icon-s-opportunity"></i>
                </el-button>
                <el-button
                        v-show="detail.paraphraseIsReview"
                        size="mini"
                        type="primary"
                        @click="closeAutoReview">
                    <i class="el-icon-switch-button"></i>
                </el-button>
            </div>
        </el-page-header>
        <el-table
                v-show="tableVisible"
                :data="list.starListData"
                style="width: 100%">
            <el-table-column>
                <template slot-scope="scope">
                    <div slot="reference" class="name-wrapper">
                        <el-button type="primary"
                                   size="mini"
                                   @click="selectOneList(scope.row.id, false)">
                            {{scope.row.listName}}
                        </el-button>
                    </div>
                </template>
            </el-table-column>
            <el-table-column>
                <template slot-scope="scope">
                    <el-button
                            v-if="list.listType === 'paraphrase'"
                            size="mini"
                            type="text"
                            @click="autoReview(scope.row.id)">复习
                    </el-button>
                    <el-button
                            v-if="list.listType === 'paraphrase'"
                            size="mini"
                            type="text"
                            @click="autoAllReview(scope.row.id)">全量复习
                    </el-button>
                    <el-button
                            type="text"
                            size="mini"
                            @click="handleEdit(scope.$index, scope.row)">
                        <i class="el-icon-edit-outline"></i>
                    </el-button>
                    <el-button
                            size="mini"
                            type="text"
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
                <el-button type="primary"
                           :loading="loading"
                           @click="handleEditSubmit">确定</el-button>
            </span>
        </el-dialog>

    </div>

</template>