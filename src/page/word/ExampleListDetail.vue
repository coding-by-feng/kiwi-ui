<template>
    <div style="margin-top: 10px">
        <el-collapse v-for="item in listItems">
            <el-collapse-item :title="item.wordName" :name="item.wordId">
                <div>
                    <p>{{item.exampleSentence}}</p>
                    <div>
                        {{isShowParaphrase ? item.exampleTranslate : '释义已隐藏，点击上面灯泡显示'}}
                    </div>
                </div>
                <el-button type="text" style="color: #909399"
                           size="mini"
                           @click="isShowParaphrase = !isShowParaphrase"><i class="el-icon-s-opportunity"></i>
                </el-button>
                <el-button type="text" style="color: #909399"
                           size="mini"
                           @click="removeExampleStarListFun(item.exampleId)"><i
                        class="el-icon-remove-outline"></i>
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
import exampleStarList from '@/api/exampleStarList'
import msgUtil from '@/util/msg'

export default {
  name: 'exampleStarListDetail',
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
    ...msgUtil,
    ...exampleStarList,
    async init () {
      if (this.listId < 1) {
        return
      }
      await this.initList()
    },
    async initList () {
      this.listRefresh = true
      await this.getExampleListItems(this.page, this.listId).then(response => {
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
    async removeExampleStarListFun (exampleId) {
      this.removeExampleStar({ exampleId: exampleId, listId: this.listId })
        .then(response => {
          this.operateSuccess(this)
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
    }
  }
}
</script>

<style scoped>
</style>

