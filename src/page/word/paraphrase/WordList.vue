<!-- components/WordList.vue -->
<template>
  <div class="word-list-container">
    <!-- Word List -->
    <div class="word-items">
      <el-collapse
          v-for="(item, index) in listItems"
          :key="item.wordId"
          accordion
          class="word-collapse"
      >
        <el-collapse-item
            :title="item.wordName"
            :name="item.wordId"
            class="word-collapse-item"
        >
          <div class="word-content">
            <div class="word-definition">
              <p class="english-definition">
                {{ item.paraphraseEnglish }}
              </p>
              <div class="chinese-meaning">
                {{ isShowParaphrase ? item.meaningChinese : '释义已隐藏' }}
              </div>
            </div>

            <div class="word-actions">
              <el-button
                  type="text"
                  class="action-button detail-button"
                  size="mini"
                  @click="$emit('show-detail', item.paraphraseId, index)"
              >
                <i class="el-icon-more-outline"></i>
                <span class="action-text">详情</span>
              </el-button>

              <el-button
                  type="text"
                  class="action-button remove-button"
                  size="mini"
                  @click="$emit('remove-paraphrase', item.paraphraseId, item.listId)"
              >
                <i class="el-icon-remove-outline"></i>
                <span class="action-text">移除</span>
              </el-button>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- Pagination -->
    <el-pagination
        v-if="isShowPagination && listItems.length > 0"
        class="word-pagination"
        small
        :page-size.sync="page.size"
        :current-page.sync="page.current"
        :page-count="page.pages"
        :pager-count="5"
        :page-sizes="[10, 20, 50, 100]"
        layout="prev, pager, next, jumper"
        @size-change="$emit('page-change')"
        @current-change="$emit('page-change')"
        :total="page.total"
    />

    <!-- Empty State -->
    <div v-if="listItems.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="el-icon-document"></i>
      </div>
      <p class="empty-text">暂无单词数据</p>
      <p class="empty-subtext">请检查列表或重新加载</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WordList',
  props: {
    listItems: {
      type: Array,
      default: () => []
    },
    isShowParaphrase: {
      type: Boolean,
      default: false
    },
    page: {
      type: Object,
      required: true
    },
    isShowPagination: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
.word-list-container {
  margin: 20px 0;
}

.word-items {
  margin-bottom: 20px;
}

.word-collapse {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.word-collapse:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.word-collapse-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.word-content {
  padding: 16px 20px;
}

.word-definition {
  margin-bottom: 16px;
}

.english-definition {
  font-size: 15px;
  line-height: 1.6;
  color: #2c3e50;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.chinese-meaning {
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.word-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 13px;
}

.detail-button {
  color: #409eff !important;
  background: rgba(64, 158, 255, 0.1);
}

.detail-button:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  transform: translateY(-1px);
}

.remove-button {
  color: #f56c6c !important;
  background: rgba(245, 108, 108, 0.1);
}

.remove-button:hover {
  background: rgba(245, 108, 108, 0.2) !important;
  transform: translateY(-1px);
}

.action-text {
  font-size: 12px;
}

.word-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-subtext {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .word-collapse {
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .word-collapse-item {
    border-radius: 8px;
  }

  .word-content {
    padding: 12px 16px;
  }

  .english-definition {
    font-size: 14px;
  }

  .chinese-meaning {
    font-size: 13px;
    padding: 10px;
  }

  .word-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .action-button {
    justify-content: center;
    width: 100%;
  }

  .word-pagination {
    border-radius: 8px;
    padding: 12px;
  }

  .empty-state {
    border-radius: 8px;
    padding: 40px 16px;
  }

  .empty-icon {
    font-size: 36px;
  }
}

/* Element UI overrides */
.word-collapse :deep(.el-collapse-item__header) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-weight: 600;
  font-size: 15px;
  padding: 0 20px;
  border: none;
  transition: all 0.3s ease;
}

.word-collapse :deep(.el-collapse-item__header:hover) {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
}

.word-collapse :deep(.el-collapse-item__arrow) {
  color: white;
  font-weight: bold;
}

.word-collapse :deep(.el-collapse-item__content) {
  padding: 0;
  border: none;
}

.word-pagination :deep(.el-pagination) {
  color: #606266;
}

.word-pagination :deep(.el-pager li) {
  background: #f8f9fa;
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

.word-pagination :deep(.el-pager li:hover) {
  background: #409eff;
  color: white;
  transform: translateY(-1px);
}

.word-pagination :deep(.el-pager li.active) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
}

.word-pagination :deep(.btn-prev),
.word-pagination :deep(.btn-next) {
  background: #f8f9fa;
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

.word-pagination :deep(.btn-prev:hover),
.word-pagination :deep(.btn-next:hover) {
  background: #409eff;
  color: white;
  transform: translateY(-1px);
}
</style>