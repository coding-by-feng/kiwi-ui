<template>
  <div class="list-container">
    <el-collapse accordion v-for="item in listItems" :key="item.wordId" class="kiwi-collapse">
      <el-collapse-item :title="item.wordName" :name="item.wordId">
        <div class="collapse-content">
          <div v-for="(parahprase, idx) in item.parahpraseList" :key="idx" class="paraphrase-block">
            <p class="paraphrase-english">
              {{ parahprase.paraphraseEnglish }}
            </p>
            <div class="paraphrase-translation">
              {{ isShowParaphrase ? parahprase.meaningChinese : '释义已隐藏，点击上面灯泡显示' }}
            </div>
          </div>
          <div class="collapse-actions">
            <el-button class="collapse-action-button" type="text" size="mini"
                       @click="isShowParaphrase = !isShowParaphrase"
                       :title="isShowParaphrase ? '隐藏释义' : '显示释义'">
              <i class="el-icon-s-opportunity"></i>
            </el-button>
            <el-button class="collapse-action-button info" type="text" size="mini"
                       @click="showDetail(item.wordName)" title="查看详情">
              <i class="el-icon-more-outline"></i>
            </el-button>
            <el-button class="collapse-action-button danger" type="text" size="mini"
                       @click="removeWordStarListFun(item.wordId)" title="从收藏移除">
              <i class="el-icon-remove-outline"></i>
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    <el-pagination
        class="list-pagination"
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
          .then(() => {
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
.list-container {
  margin: 20px 0 10px;
}

/* Collapse card styling aligned with AiResponseDetail */
::v-deep .kiwi-collapse .el-collapse-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 14px;
}

::v-deep .kiwi-collapse .el-collapse-item__header {
  padding: 14px 18px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

::v-deep .kiwi-collapse .el-collapse-item__header:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
}

::v-deep .kiwi-collapse .el-collapse-item.is-active > .el-collapse-item__header {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

::v-deep .kiwi-collapse .el-collapse-item__wrap {
  background: #fff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

::v-deep .kiwi-collapse .el-collapse-item__content {
  padding: 18px 20px;
  color: #2c3e50;
}

.collapse-content {
  line-height: 1.7;
}

.paraphrase-block + .paraphrase-block {
  margin-top: 10px;
}

.paraphrase-english {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: #2c3e50;
}

.paraphrase-translation {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  color: #495057;
}

.collapse-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
}

.collapse-action-button {
  color: #fff !important;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  transition: all 0.3s ease;
}

.collapse-action-button.info {
  background: linear-gradient(135deg, #909399 0%, #606266 100%) !important;
}

.collapse-action-button.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%) !important;
}

.collapse-action-button:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.list-pagination {
  margin-top: 16px;
}

@media (max-width: 768px) {
  ::v-deep .kiwi-collapse .el-collapse-item__header {
    padding: 12px 14px;
    font-size: 14px;
  }

  ::v-deep .kiwi-collapse .el-collapse-item__content {
    padding: 14px 16px;
  }

  .paraphrase-english {
    font-size: 14px;
  }
}
</style>
