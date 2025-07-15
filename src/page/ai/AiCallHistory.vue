<template>
  <div class="ai-call-history">
    <div class="history-header">
      <h2 class="history-title">
        AI Call History
      </h2>
    </div>

    <!-- Filters -->
    <div class="filters-container" v-if="historyData && historyData.total > 0">
      <el-card class="filter-card">
        <div class="filter-row">
          <el-select
              v-model="filterMode"
              placeholder="Filter by Mode"
              size="small"
              clearable
              @change="applyFilters">
            <el-option label="All Modes" value=""></el-option>
            <el-option
                v-for="mode in uniqueModes"
                :key="mode"
                :label="getModeLabel(mode)"
                :value="mode">
            </el-option>
          </el-select>

          <el-select
              v-model="filterLanguage"
              placeholder="Filter by Language"
              size="small"
              clearable
              @change="applyFilters">
            <el-option label="All Languages" value=""></el-option>
            <el-option
                v-for="lang in uniqueLanguages"
                :key="lang"
                :label="getLanguageLabel(lang)"
                :value="lang">
            </el-option>
          </el-select>

          <el-button
              type="text"
              size="small"
              icon="el-icon-delete"
              @click="clearFilters"
              v-if="filterMode || filterLanguage">
            Clear Filters
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- History List -->
    <div class="history-content" v-loading="loading">
      <div v-if="!historyData || historyData.total === 0" class="empty-state">
        <i class="el-icon-document-remove"></i>
        <h3>No AI Call History Found</h3>
        <p>Your AI conversation history will appear here once you start using the AI features.</p>
      </div>

      <div v-else class="history-list">
        <el-card
            v-for="record in filteredRecords"
            :key="record.id"
            class="history-item"
            shadow="hover">
          <div class="history-item-header">
            <div class="mode-info">
              <el-tag
                  :type="getModeTagType(record.promptMode)"
                  size="small">
                {{ getModeLabel(record.promptMode) }}
              </el-tag>
              <div class="language-info">
                <span class="language-tag">{{ getLanguageLabel(record.targetLanguage) }}</span>
                <span v-if="record.nativeLanguage" class="native-language">
                  → {{ getLanguageLabel(record.nativeLanguage) }}
                </span>
              </div>
            </div>
            <div class="timestamp">
              {{ formatTimestamp(record.timestamp) }}
            </div>
          </div>

          <div class="history-item-content">
            <div class="prompt-preview">
              <strong>Prompt:</strong>
              <p class="prompt-text">{{ truncateText(record.prompt, 200) }}</p>
            </div>
          </div>

          <div class="history-item-actions">
            <el-button
                type="text"
                size="small"
                icon="el-icon-search"
                @click="searchAgain(record)">
              Review
            </el-button>
            <el-button
                type="text"
                size="small"
                icon="el-icon-document-copy"
                @click="copyPrompt(record.prompt)">
              Copy
            </el-button>
            <el-button
                type="text"
                size="small"
                icon="el-icon-view"
                @click="viewDetails(record)">
              Details
            </el-button>
          </div>
        </el-card>

        <!-- Pagination -->
        <div class="pagination-container" v-if="historyData.total > pageSize">
          <el-pagination
              @current-change="handlePageChange"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="historyData.total"
              layout="prev, pager, next, jumper, total"
              background>
          </el-pagination>
        </div>
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog
        title="AI Call Details"
        :visible.sync="detailDialogVisible"
        width="70%"
        class="detail-dialog">
      <div v-if="selectedRecord" class="detail-content">
        <el-form label-position="left" label-width="120px">
          <el-form-item label="Mode:">
            <el-tag :type="getModeTagType(selectedRecord.promptMode)">
              {{ getModeLabel(selectedRecord.promptMode) }}
            </el-tag>
          </el-form-item>

          <el-form-item label="Languages:">
            <span class="language-display">
              {{ getLanguageLabel(selectedRecord.targetLanguage) }}
              <span v-if="selectedRecord.nativeLanguage">
                → {{ getLanguageLabel(selectedRecord.nativeLanguage) }}
              </span>
            </span>
          </el-form-item>

          <el-form-item label="Timestamp:">
            {{ formatFullTimestamp(selectedRecord.timestamp) }}
          </el-form-item>

          <el-form-item label="Prompt:">
            <div class="detail-prompt">{{ selectedRecord.prompt }}</div>
          </el-form-item>
        </el-form>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">Close</el-button>
        <el-button type="primary" @click="searchAgain(selectedRecord)">
          Search Again
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import kiwiConsts from "@/const/kiwiConsts";
import { Message } from 'element-ui';
import { getAiCallHistory } from '@/api/ai'; // Import the API function

export default {
  name: 'AiCallHistory',
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 10,
      historyData: null,

      // Filters
      filterMode: '',
      filterLanguage: '',

      // Detail dialog
      detailDialogVisible: false,
      selectedRecord: null,

      // Language and mode mappings
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      searchModes: Object.values(kiwiConsts.SEARCH_AI_MODES)
    }
  },

  computed: {
    uniqueModes() {
      if (!this.historyData || !this.historyData.records) return [];
      const modes = [...new Set(this.historyData.records.map(record => record.promptMode))];
      return modes.filter(mode => mode);
    },

    uniqueLanguages() {
      if (!this.historyData || !this.historyData.records) return [];
      const languages = new Set();
      this.historyData.records.forEach(record => {
        if (record.targetLanguage) languages.add(record.targetLanguage);
        if (record.nativeLanguage) languages.add(record.nativeLanguage);
      });
      return [...languages];
    },

    filteredRecords() {
      if (!this.historyData || !this.historyData.records) return [];

      let records = this.historyData.records;

      if (this.filterMode) {
        records = records.filter(record => record.promptMode === this.filterMode);
      }

      if (this.filterLanguage) {
        records = records.filter(record =>
            record.targetLanguage === this.filterLanguage ||
            record.nativeLanguage === this.filterLanguage
        );
      }

      return records;
    }
  },

  mounted() {
    this.loadHistory();
  },

  methods: {
    async loadHistory() {
      this.loading = true;
      try {
        console.log(`Loading AI call history - page: ${this.currentPage}, size: ${this.pageSize}`);

        // Use the extracted API function
        const response = await getAiCallHistory(this.currentPage, this.pageSize);

        if (response.data.code === 1) {
          this.historyData = response.data.data;
          console.log('Loaded AI call history successfully:', this.historyData);
        } else {
          console.error('API returned error:', response.data);
          Message.error(response.data.msg || 'Failed to load AI call history');
        }
      } catch (error) {
        console.error('Error loading AI call history:', error);
        Message.error('Failed to load AI call history: ' + (error.message || 'Unknown error'));
      } finally {
        this.loading = false;
      }
    },

    async handlePageChange(page) {
      console.log(`Changing to page: ${page}`);
      this.currentPage = page;
      await this.loadHistory();
    },

    applyFilters() {
      // Filters are applied through computed property
      console.log('Applying filters:', this.filterMode, this.filterLanguage);
    },

    clearFilters() {
      console.log('Clearing filters');
      this.filterMode = '';
      this.filterLanguage = '';
    },

    getModeLabel(modeValue) {
      const mode = this.searchModes.find(mode => mode.value === modeValue);
      return mode ? mode.label : modeValue;
    },

    getModeTagType(modeValue) {
      const tagTypes = {
        'directly-translation': 'primary',
        'translation-and-explanation': 'success',
        'grammar-explanation': 'warning',
        'grammar-correction': 'danger',
        'vocabulary-explanation': 'info',
        'synonym': 'primary',
        'antonym': 'warning',
        'vocabulary-association': 'success',
        'phrases-association': 'info',
        'selection-explanation': 'warning'
      };
      return tagTypes[modeValue] || '';
    },

    getLanguageLabel(languageCode) {
      // Find the language name by code
      for (const [languageName, code] of Object.entries(this.languageCodes)) {
        if (code === languageCode) {
          return languageName.replace(/_/g, ' ');
        }
      }
      return languageCode;
    },

    // Convert array-based timestamp to Date object
    arrayToDate(timestampArray) {
      if (!Array.isArray(timestampArray) || timestampArray.length < 6) {
        return null;
      }

      // Array format: [year, month, day, hour, minute, second]
      // Note: JavaScript months are 0-based, so we need to subtract 1 from month
      const [year, month, day, hour, minute, second] = timestampArray;
      return new Date(year, month - 1, day, hour, minute, second);
    },

    formatTimestamp(timestamp) {
      if (!timestamp) return 'Unknown';

      const date = this.arrayToDate(timestamp);
      if (!date) return 'Invalid Date';

      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays <= 7) {
        return diffDays + ' days ago';
      } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    },

    formatFullTimestamp(timestamp) {
      if (!timestamp) return 'Unknown';

      const date = this.arrayToDate(timestamp);
      if (!date) return 'Invalid Date';

      return date.toLocaleString();
    },

    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },

    searchAgain(record) {
      console.log('Searching again with record:', record);

      // Navigate back to search with the same parameters
      const query = {
        active: 'search',
        selectedMode: record.promptMode,
        language: record.targetLanguage,
        originalText: encodeURIComponent(record.prompt),
        ytbMode: this.$route.query.ytbMode || kiwiConsts.YTB_MODE.CHANNEL,
        now: new Date().getTime()
      };

      // Use router.resolve to generate the URL and open in new tab
      const routeData = this.$router.resolve({
        path: '/index/vocabulary/aiResponseDetail',
        query: query
      });

      // Open in new tab
      window.open(routeData.href, '_blank');
    },

    copyPrompt(prompt) {
      navigator.clipboard.writeText(prompt)
          .then(() => {
            Message.success('Prompt copied to clipboard!');
          })
          .catch(() => {
            Message.error('Failed to copy prompt');
          });
    },

    viewDetails(record) {
      console.log('Viewing details for record:', record);
      this.selectedRecord = record;
      this.detailDialogVisible = true;
    },

    goBack() {
      console.log('Going back to search page');
      // Navigate back to search page
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: {
          active: 'search',
          ytbMode: this.$route.query.ytbMode || kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      });
    }
  }
}
</script>

<style scoped>
.ai-call-history {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f2f5;
}

.history-title {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

/* Filters */
.filters-container {
  margin-bottom: 20px;
}

.filter-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px;
}

.filter-row .el-select {
  min-width: 150px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8492a6;
}

.empty-state i {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #2c3e50;
  margin: 20px 0 10px 0;
}

.empty-state p {
  margin-bottom: 30px;
  line-height: 1.6;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  margin-bottom: 0;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.language-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
}

.language-tag {
  background: linear-gradient(135deg, #f0f2f5 0%, #e9ecef 100%);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid #d4d7dc;
}

.native-language {
  color: #909399;
  font-weight: 500;
}

.timestamp {
  color: #909399;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timestamp i {
  color: #409eff;
}

.history-item-content {
  margin-bottom: 15px;
}

.prompt-preview strong {
  color: #2c3e50;
  font-weight: 600;
}

.prompt-text {
  margin: 8px 0 0 0;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 3px solid #409eff;
  line-height: 1.8;
  color: #2c3e50;
  word-break: break-word;
  border: 1px solid #e4e7ed;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.history-item-actions {
  display: flex;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid #f0f2f5;
}

.history-item-actions .el-button {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  color: white !important;
  transition: all 0.3s ease;
  border-radius: 6px !important;
  font-size: 12px;
  padding: 6px 12px;
}

.history-item-actions .el-button:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

/* Detail Dialog */
.detail-dialog .detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-prompt {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 8px;
  border-left: 3px solid #409eff;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.language-display {
  font-weight: 600;
  color: #2c3e50;
}

.dialog-footer {
  text-align: center;
}

.dialog-footer .el-button {
  margin: 0 8px;
}

/* Element UI tag customization */
.el-tag {
  border-radius: 12px;
  font-weight: 500;
  border: none;
}

.el-tag--primary {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
}

.el-tag--success {
  background: linear-gradient(135deg, #67c23a 0%, #20c997 100%);
  color: white;
}

.el-tag--warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
  color: white;
}

.el-tag--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  color: white;
}

.el-tag--info {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .ai-call-history {
    padding: 15px;
  }

  .history-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .header-actions .el-button {
    margin-left: 0;
    flex: 1;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-row .el-select {
    min-width: auto;
  }

  .history-item-header {
    flex-direction: column;
    gap: 10px;
  }

  .history-item-actions {
    justify-content: space-between;
  }

  .detail-dialog {
    width: 95% !important;
  }
}
</style>