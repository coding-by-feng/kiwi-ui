<template>
    <div style="margin-top: 10px">
        <el-collapse accordion v-for="item in listItems">
            <el-collapse-item :title="item.wordName" :name="item.wordId">
                <div v-for="parahprase in item.parahpraseList">
                    <p>
                        {{parahprase.paraphraseEnglish}}
                    </p>
                    <div>
                        {{isShowParaphrase ? parahprase.meaningChinese : '释义已隐藏，点击上面灯泡显示' }}
                    </div>
                </div>
                <el-button type="text"
                           size="mini"
                           @click="isShowParaphrase = !isShowParaphrase"><i class="el-icon-s-opportunity"></i>
                </el-button>
                <el-button type="text"
                           size="mini"
                           @click="showDetail(item.wordName)"><i class="el-icon-more-outline"></i>
                </el-button>
                <el-button type="text"
                           size="mini"
                           @click="removeWordStarListFun(item.wordId)"><i class="el-icon-remove-outline"></i>
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
    </div>
</template>
<script>
import wordStarList from '@/api/wordStarList'

export default {
  name: 'wordStarListDetail',
  props: {
    tableVisibleToggle: {
      type: Function
    },
    listId: Number,
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
    ...wordStarList,
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
    showDetail (wordName) {
      this.$router.push({ path: '/index/vocabulary/detail', query: { active: 'search', word: wordName } })
    },
    async removeWordStarListFun (wordId) {
      this.removeWordStarList({ wordId: wordId, listId: this.listId })
        .then(response => {
          this.doSuccess()
          this.initList()
        })
        .catch(e => {
          console.error(e)
          this.$message.error(e)
        })
    },
    pageChange () {
      this.initList()
    },
    doSuccess () {
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

