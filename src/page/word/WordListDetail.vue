<template>
  <div style="margin-top: 10px">
    <el-collapse accordion v-for="item in listItems">
      <el-collapse-item :title="item.wordName" :name="item.wordId">
        <div v-for="parahprase in item.parahpraseList">
          <p>
            {{ parahprase.paraphraseEnglish }}
          </p>
          <div>
            {{ isShowParaphrase ? parahprase.meaningChinese : '释义已隐藏，点击上面灯泡显示' }}
          </div>
        </div>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="isShowParaphrase = !isShowParaphrase"><i class="el-icon-s-opportunity"></i>
        </el-button>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="showDetail(item.wordName)"><i class="el-icon-more-outline"></i>
        </el-button>
        <el-button type="text" style="color: #909399"
                   size="mini"
                   @click="removeWordStarListFun(item.wordId)"><i class="el-icon-remove-outline"></i>
        </el-button>
      </el-collapse-item>
    </el-collapse>
    <el-pagination
        style="margin-top: 10px"
        small
        :page-size.sync="page.size"
        :current-page.sync="page.current"
        :page-count="page.pages"
        :pager-count="5"
        :page-sizes="[10,20,50,100]"
        layout="prev,pager,next,jumper"
        @size-change="pageChange"
        @current-change="pageChange"
        :total="page.total">
    </el-pagination>
  </div>
</template>
<script>
import wordStarList from '@/api/wordStarList'
import msgUtil from '@/util/msg'

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
  data() {
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
  mounted() {
    this.init()
  },
  watch: {
    'listId'() {
      this.init()
    }
  },
  methods: {
    ...wordStarList,
    ...msgUtil,
    async init() {
      // todo 对listId进行非空等判断
      if (this.listId < 1) {
        return
      }
      await this.initList()
    },
    async initList() {
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
    goBack() {
      this.$emit('tableVisibleToggle')
    },
    showDetail(wordName) {
      // Preserve all existing URL parameters when navigating to detail page
      const preservedQuery = {
        ...this.$route.query, // Preserve all existing parameters
        active: 'search',
        word: wordName,
        now: new Date().getTime()
      };
      this.$router.push({path: '/index/tools/detail', query: preservedQuery})
    },
    async removeWordStarListFun(wordId) {
      this.removeWordStarList({wordId: wordId, listId: this.listId})
          .then(response => {
            this.operateSuccess(this)
            this.initList()
          })
          .catch(e => {
            console.error(e)
            this.$message.error(e)
          })
    },
    pageChange() {
      this.initList()
    }
  }
}
</script>

<style scoped>
</style>
