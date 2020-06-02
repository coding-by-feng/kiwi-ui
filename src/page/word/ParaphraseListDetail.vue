<template>
    <div style="margin-top: 10px">
        <el-collapse v-for="item in listItems" accordion>
            <el-collapse-item :title="item.wordName" :name="item.wordId">
                <div>
                    <p>
                        {{item.paraphraseEnglish}}
                    </p>
                    <div>
                        {{isShowParaphrase ? item.meaningChinese : '释义已隐藏，点击上面图标...显示'}}
                    </div>
                </div>
                <el-button type="text"
                           size="mini"
                           @click="showDetail(item.paraphraseId)"><i class="el-icon-more-outline"></i>
                </el-button>
                <el-button type="text"
                           size="mini"
                           @click="removeParaphraseStarListFun(item.paraphraseId)"><i
                        class="el-icon-remove-outline"></i>
                </el-button>
            </el-collapse-item>
        </el-collapse>
        <el-pagination
                style="margin-top: 10px"
                background
                :page-size.sync="page.size"
                :current-page="page.current"
                :page-count="page.pages"
                :page-sizes="[10,20,50,100]"
                layout="prev, pager, sizes, next"
                @size-change="pageChange"
                @current-change="pageChange"
                :total="page.total">
        </el-pagination>
        <el-dialog
                :title="this.detail.paraphraseVO.meaningChinese"
                :visible.sync="detail.dialogVisible"
                :before-close="handleDetailClose">
            <el-card class="box-card">
                <div slot="header">
                    <el-alert
                            type="info"
                            :description="this.detail.paraphraseVO.meaningChinese"
                            :closable="false"
                            effect="dark"
                            center>
                        <div slot="title">
                            {{this.detail.paraphraseVO.paraphraseEnglish}}
                        </div>
                    </el-alert>
                </div>
                <div v-if="this.detail.paraphraseVO.wordParaphraseExampleVOList && this.detail.paraphraseVO.wordParaphraseExampleVOList.length < 1">
                    <el-alert
                            type="info"
                            title="该释义暂时没有例句"
                            center
                            effect="light"
                            :closable="false">
                    </el-alert>
                </div>
                <div v-for="wordParaphraseExampleVO in this.detail.paraphraseVO.wordParaphraseExampleVOList">
                    <el-alert
                            type="info"
                            center
                            effect="light"
                            :description="wordParaphraseExampleVO.exampleTranslate"
                            :closable="false">
                        <div slot="title">
                            {{wordParaphraseExampleVO.exampleSentence}}
                            <el-button type="text"><i
                                    class="el-icon-circle-plus-outline outline_fix" style="color: #FFFFFF"></i>
                            </el-button>
                        </div>
                    </el-alert>
                </div>
            </el-card>
            <el-button type="primary" @click="handleDetailClose">确 定</el-button>
        </el-dialog>
    </div>
</template>
<script>
import paraphraseStarList from '@/api/paraphraseStarList'

export default {
  name: 'wordStarListDetail',
  props: {
    tableVisibleToggle: {
      type: Function
    },
    listId: Number,
    listName: String,
    isShowParaphrase: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      page: {
        current: 1,
        size: 20,
        total: 0,
        pages: 0
      },
      detail: {
        paraphraseVO: {},
        dialogVisible: false
      },
      listItems: [],
      listRefresh: false
    }
  },
  mounted () {
    this.init()
  },
  watch: {
    'listId' () {
      this.init()
    }
  },
  methods: {
    ...paraphraseStarList,
    async init () {
      // todo 对listId进行非空等判断
      if (this.listId < 1) {
        return
      }
      await this.initList()
    },
    async initList () {
      this.listRefresh = true
      await this.getListItems(this.page, this.listId).then(response => {
        this.listItems = response.data.data.records
        this.page.pages = response.data.data.pages
        this.page.total = response.data.data.total
      }).catch(e => {
        console.error(e)
      })
      this.listRefresh = false
    },
    goBack () {
      this.$emit('tableVisibleToggle')
    },
    async showDetail (paraphraseId) {
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      await this.getItemDetail(paraphraseId)
        .then(response => {
          this.detail.paraphraseVO = response.data.data
        })
        .catch(e => {
          console.error(e)
        })
      this.detail.dialogVisible = true
      loading.close()
    },
    async removeParaphraseStarListFun (paraphraseId) {
      this.removeParaphraseStar({ paraphraseId: paraphraseId, listId: this.listId })
        .then(response => {
          this.doSuccess()
          this.initList()
        })
        .catch(e => {
          console.error(e)
          this.$message.error(e)
        })
    },
    handleDetailClose () {
      this.detail.dialogVisible = false
    },
    pageChange () {
      this.initList()
    },
    doSuccess(){
      this.$message.success({
        duration: 1000,
        message: '操作成功'
      })
    }
  }
}
</script>

<style scoped>
</style>

