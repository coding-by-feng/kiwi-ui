<template>
    <div class="list-container" :style="{ marginTop: listContentTop + 'px' }">
        <el-collapse v-for="item in listItems" :key="item.exampleId" class="kiwi-collapse">
            <el-collapse-item :title="item.wordName" :name="item.wordId">
                <div class="collapse-content">
                    <p class="example-sentence">{{ item.exampleSentence }}</p>
                    <div class="example-translation">
                        {{ isShowParaphrase ? item.exampleTranslate : $t('word.hiddenPrompt') }}
                    </div>
                    <div class="collapse-actions">
                        <el-button
                            class="collapse-action-button"
                            type="text"
                            size="mini"
                            @click="isShowParaphrase = !isShowParaphrase"
                            :title="isShowParaphrase ? $t('word.hideDefinition') : $t('word.showDefinition')">
                            <i class="el-icon-s-opportunity"></i>
                        </el-button>
                        <el-button
                            class="collapse-action-button danger"
                            type="text"
                            size="mini"
                            @click="removeExampleStarListFun(item.exampleId)"
                            :title="$t('word.removeFromCollection')">
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
      listRefresh: false,
      // dynamic top spacing to avoid overlap with fixed control bar
      controlBarHeight: 0,
      controlBarOffsetTop: 0
    }
  },
  mounted () {
    this.init()
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
    'listId' () {
      this.init()
      this.$nextTick(this.updateControlBarMetrics)
    }
  },
  methods: {
    ...msgUtil,
    ...exampleStarList,
    // Measure the fixed control bar and compute offset to push content below it
    updateControlBarMetrics() {
      this.$nextTick(() => {
        const bar = document.querySelector('.control-bar')
        if (!bar) {
          // fallback margin when control bar not found
          this.controlBarHeight = 0
          this.controlBarOffsetTop = 68
          return
        }
        const rect = bar.getBoundingClientRect()
        const height = Math.ceil((rect && rect.height) || 0)
        const computed = window.getComputedStyle(bar)
        let topPx = 0
        if (computed && computed.top && computed.top.endsWith('px')) {
          topPx = parseFloat(computed.top) || 0
        }
        this.controlBarHeight = height
        this.controlBarOffsetTop = topPx
      })
    },
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
    async removeExampleStarListFun (exampleId) {
      this.removeExampleStar({ exampleId: exampleId, listId: this.listId })
        .then(() => {
          this.operateSuccess(this)
          this.initList()
        })
        .catch(e => {
          console.error(e)
          this.$message.error(e)
        })
    },
    pageChange () {
      this.initList()
    }
  },
  computed: {
    // total top margin for the list to clear the fixed control bar
    listContentTop() {
      return Math.max(80, Math.ceil(this.controlBarOffsetTop + this.controlBarHeight + 12))
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

.example-sentence {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: #2c3e50;
}

.example-translation {
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
  margin-top: 10px;
}

.collapse-action-button {
  color: #fff !important;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  transition: all 0.3s ease;
}

.collapse-action-button:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.collapse-action-button.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%) !important;
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

  .example-sentence {
    font-size: 14px;
  }
}
</style>
