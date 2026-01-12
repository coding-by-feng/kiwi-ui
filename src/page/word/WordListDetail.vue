<template>
  <div class="list-container" :style="{ marginTop: listContentTop + 'px' }">
    <el-collapse accordion v-for="item in listItems" :key="item.wordId" class="kiwi-collapse">
      <el-collapse-item :title="item.wordName" :name="item.wordId">
        <div class="collapse-content">
          <div v-for="(parahprase, idx) in item.parahpraseList" :key="idx" class="paraphrase-block">
            <p class="paraphrase-english">
              {{ parahprase.paraphraseEnglish }}
            </p>
            <div class="paraphrase-translation">
              {{ isShowParaphrase ? parahprase.meaningChinese : $t('word.hiddenPrompt') }}
            </div>
          </div>
          <div class="collapse-actions">
            <KiwiButton class="collapse-action-button" type="text" size="mini"
                       @click="isShowParaphrase = !isShowParaphrase"
                       :title="isShowParaphrase ? $t('word.hideDefinition') : $t('word.showDefinition')">
              <i class="el-icon-s-opportunity"></i>
            </KiwiButton>
            <KiwiButton class="collapse-action-button info" type="text" size="mini"
                       @click="showDetail(item.wordName)" :title="$t('word.showDetails')">
              <i class="el-icon-more-outline"></i>
            </KiwiButton>
            <KiwiButton class="collapse-action-button danger" type="text" size="mini"
                       @click="removeWordStarListFun(item.wordId)" :title="$t('word.removeFromCollection')">
              <i class="el-icon-remove-outline"></i>
            </KiwiButton>
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
import kiwiConsts from '@/const/kiwiConsts'
import KiwiButton from '@/components/ui/KiwiButton.vue'

export default {
  name: 'wordStarListDetail',
  components: { KiwiButton },
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
      listRefresh: false,
      // dynamic top spacing to avoid overlap with fixed control bar
      controlBarHeight: 0,
      controlBarOffsetTop: 0
    }
  },
  mounted() {
    this.init()
    // measure control bar after render
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
    'listId'() {
      this.init()
      this.$nextTick(this.updateControlBarMetrics)
    }
  },
  methods: {
    ...wordStarList,
    ...msgUtil,
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
      this.$router.push({path: kiwiConsts.ROUTES.DETAIL, query: preservedQuery})
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
  },
  computed: {
    // total top margin for the list to clear the fixed control bar
    listContentTop() {
      // add a small gap
      return Math.max(80, Math.ceil(this.controlBarOffsetTop + this.controlBarHeight + 12))
    }
  }
}
</script>

<style scoped>
.list-container {
  margin: 20px 0 10px;
  padding: 0 4px;
}

/* ========== Glassmorphic Collapse Cards ========== */
::v-deep .kiwi-collapse {
  border: none;
}

::v-deep .kiwi-collapse .el-collapse-item {
  position: relative;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: 14px;
  backdrop-filter: var(--backdrop-filter);
  transition: all var(--transition-normal, 0.3s) ease;
}

::v-deep .kiwi-collapse .el-collapse-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-fast, 0.15s) ease;
}

::v-deep .kiwi-collapse .el-collapse-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: rgba(var(--color-primary-rgb, 99, 102, 241), 0.3);
}

::v-deep .kiwi-collapse .el-collapse-item:hover::before,
::v-deep .kiwi-collapse .el-collapse-item.is-active::before {
  opacity: 1;
}

::v-deep .kiwi-collapse .el-collapse-item__header {
  padding: 14px 18px 14px 22px;
  background: var(--bg-header);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid var(--border-color-light);
  transition: all var(--transition-normal, 0.3s) ease;
  height: auto;
  line-height: 1.5;
}

::v-deep .kiwi-collapse .el-collapse-item__header:hover {
  background: var(--bg-container);
  color: var(--color-primary);
}

::v-deep .kiwi-collapse .el-collapse-item.is-active > .el-collapse-item__header {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  color: var(--color-primary);
  background: var(--bg-container);
}

::v-deep .kiwi-collapse .el-collapse-item__arrow {
  color: var(--text-secondary);
  font-weight: 600;
  transition: transform var(--transition-normal, 0.3s) ease;
}

::v-deep .kiwi-collapse .el-collapse-item__wrap {
  background: var(--bg-card);
  border-bottom-left-radius: var(--radius-lg, 12px);
  border-bottom-right-radius: var(--radius-lg, 12px);
  border-bottom: none;
}

::v-deep .kiwi-collapse .el-collapse-item__content {
  padding: 18px 20px 18px 22px;
  color: var(--text-primary);
}

/* ========== Content Styling ========== */
.collapse-content {
  line-height: 1.7;
}

.paraphrase-block {
  position: relative;
  padding: 12px 14px;
  background: var(--bg-body);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-color-light);
  transition: all var(--transition-normal, 0.3s) ease;
}

.paraphrase-block + .paraphrase-block {
  margin-top: 12px;
}

.paraphrase-block:hover {
  border-color: rgba(var(--color-primary-rgb, 99, 102, 241), 0.25);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb, 99, 102, 241), 0.08);
}

.paraphrase-english {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.6;
  font-weight: 500;
}

.paraphrase-translation {
  position: relative;
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md, 8px);
  padding: 12px 14px 12px 18px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.paraphrase-translation::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--gradient-info);
  border-radius: 0 2px 2px 0;
  opacity: 0.6;
}

/* ========== Action Buttons ========== */
.collapse-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color-light);
}

.collapse-action-button {
  position: relative;
  color: white !important;
  background: var(--gradient-primary) !important;
  border: none !important;
  border-radius: var(--radius-md, 8px) !important;
  padding: 6px 12px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  transition: all var(--transition-normal, 0.3s) ease;
  overflow: hidden;
}

.collapse-action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.collapse-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 99, 102, 241), 0.35);
}

.collapse-action-button:hover::before {
  left: 100%;
}

.collapse-action-button.info {
  background: var(--gradient-info) !important;
}

.collapse-action-button.info:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.collapse-action-button.danger {
  background: var(--gradient-danger) !important;
}

.collapse-action-button.danger:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.collapse-action-button i {
  font-size: 14px;
}

/* ========== Pagination Styling ========== */
.list-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

::v-deep .list-pagination .el-pagination {
  padding: 8px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
}

::v-deep .list-pagination .btn-prev,
::v-deep .list-pagination .btn-next {
  background: var(--bg-container) !important;
  border-radius: var(--radius-md, 8px) !important;
  color: var(--text-secondary) !important;
  transition: all var(--transition-fast, 0.15s) ease;
}

::v-deep .list-pagination .btn-prev:hover,
::v-deep .list-pagination .btn-next:hover {
  color: var(--color-primary) !important;
  background: var(--bg-body) !important;
}

::v-deep .list-pagination .el-pager li {
  background: var(--bg-container) !important;
  border-radius: var(--radius-md, 8px) !important;
  color: var(--text-secondary) !important;
  margin: 0 2px;
  transition: all var(--transition-fast, 0.15s) ease;
}

::v-deep .list-pagination .el-pager li:hover {
  color: var(--color-primary) !important;
}

::v-deep .list-pagination .el-pager li.active {
  background: var(--gradient-primary) !important;
  color: white !important;
}

/* ========== Mobile Responsive ========== */
@media (max-width: 768px) {
  .list-container {
    padding: 0;
  }

  ::v-deep .kiwi-collapse .el-collapse-item__header {
    padding: 12px 14px 12px 18px;
    font-size: 14px;
  }

  ::v-deep .kiwi-collapse .el-collapse-item__content {
    padding: 14px 16px 14px 18px;
  }

  .paraphrase-block {
    padding: 10px 12px;
  }

  .paraphrase-english {
    font-size: 14px;
  }

  .paraphrase-translation {
    padding: 10px 12px 10px 16px;
    font-size: 13px;
  }

  .collapse-actions {
    gap: 6px;
    flex-wrap: wrap;
  }

  .collapse-action-button {
    padding: 5px 10px !important;
    font-size: 12px !important;
  }

  ::v-deep .list-pagination .el-pagination {
    padding: 6px 10px;
  }
}
</style>
