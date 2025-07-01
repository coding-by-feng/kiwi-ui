<template>
  <div class="ai-call-history">
    <div class="history-header">
      <h2 class="history-title">
        <i class="el-icon-time"></i>
        AI Call History
      </h2>
      <div class="header-actions">
        <el-button
            type="primary"
            size="small"
            icon="el-icon-refresh"
            @click="refreshHistory"
            :loading="loading">
          Refresh
        </el-button>
        <el-button
            type="info"
            size="small"
            icon="el-icon-back"
            @click="goBack">
          Back to Search
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-container" v-if="historyData && historyData.total > 0">
      <el-card class="stats-card">
        <div class="stat-item">
          <i class="el-icon-document"></i>
          <div class="stat-content">
            <div class="stat-number">{{ historyData.total }}</div>
            <div class="stat-label">Total Requests</div>
          </div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stat-item">
          <i class="el-icon-chat-dot-square"></i>
          <div class="stat-content">
            <div class="stat-number">{{ getTodayCount() }}</div>
            <div class="stat-label">Today</div>
          </div>
        </div>
      </el-card>
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
        <el-button type="primary" @click="goBack">Start Searching</el-button>
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
              <i class="el-icon-time"></i>
              {{ formatTimestamp(record.timestamp) }}
            </div>
          </div>

          <div class="history-item-content">
            <div class="prompt-preview">
              <strong>Prompt:</strong>
              <p class="prompt-text">{{ truncateText(record.prompt, 200) }}</p>
            </div>

            <div class="ai-url-info" v-if="record.aiUrl">
              <span class="ai-url-label">AI URL:</span>
              <code class="ai-url">{{ record.aiUrl }}</code>
            </div>
          </div>

          <div class="history-item-actions">
            <el-button
                type="text"
                size="small"
                icon="el-icon-search"
                @click="searchAgain(record)">
              Search Again
            </el-button>
            <el-button
                type="text"
                size="small"
                icon="el-icon-document-copy"
                @click="copyPrompt(record.prompt)">
              Copy Prompt
            </el-button>
            <el-button
                type="text"
                size="small"
                icon="el-icon-view"
                @click="viewDetails(record)">
              View Details
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

          <el-form-item label="AI URL:" v-if="selectedRecord.aiUrl">
            <code class="detail-ai-url">{{ selectedRecord.aiUrl }}</code>
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
import {Message} from 'element-ui';

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
        const response = await this.$http.get(`/ai-biz/ai/history?current=${this.currentPage}&size=${this.pageSize}`);

        if (response.data.code === 0) {
          this.historyData = response.data.data;
          console.log('Loaded AI call history:', this.historyData);
        } else {
          Message.error(response.data.msg || 'Failed to load AI call history');
        }
      } catch (error) {
        console.error('Error loading AI call history:', error);
        Message.error('Failed to load AI call history');
      } finally {
        this.loading = false;
      }
    },

    async refreshHistory() {
      this.currentPage = 1;
      await this.loadHistory();
    },

    async handlePageChange(page) {
      this.currentPage = page;
      await this.loadHistory();
    },

    applyFilters() {
      // Filters are applied through computed property
      console.log('Applying filters:', this.filterMode, this.filterLanguage);
    },

    clearFilters() {
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

    formatTimestamp(timestamp) {
      if (!timestamp) return 'Unknown';
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return 'Today ' + date.toLocaleTimeString();
      } else if (diffDays === 2) {
        return 'Yesterday ' + date.toLocaleTimeString();
      } else if (diffDays <= 7) {
        return diffDays + ' days ago';
      } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      }
    },

    formatFullTimestamp(timestamp) {
      if (!timestamp) return 'Unknown';
      const date = new Date(timestamp);
      return date.toLocaleString();
    },

    getTodayCount() {
      if (!this.historyData || !this.historyData.records) return 0;
      const today = new Date().toDateString();
      return this.historyData.records.filter(record => {
        if (!record.timestamp) return false;
        const recordDate = new Date(record.timestamp).toDateString();
        return recordDate === today;
      }).length;
    },

    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },

    searchAgain(record) {
      // Navigate back to search with the same parameters
      const query = {
        active: 'search',
        selectedMode: record.promptMode,
        language: record.targetLanguage,
        originalText: encodeURIComponent(record.prompt),
        ytbMode: this.$route.query.ytbMode || kiwiConsts.YTB_MODE.CHANNEL,
        now: new Date().getTime()
      };

      this.$router.push({
        path: '/index/vocabulary/aiResponseDetail',
        query: query
      });
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
      this.selectedRecord = record;
      this.detailDialogVisible = true;
    },

    goBack() {
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

.history-title i {
  margin-right: 10px;
  color: #409eff;
}

.header-actions .el-button {
  margin-left: 10px;
}

/* Statistics */
.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stats-card {
  flex: 1;
  min-width: 200px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-item i {
  font-size: 32px;
  color: #409eff;
  margin-right: 15px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  color: #8492a6;
  font-size: 14px;
  margin-top: 4px;
}

/* Filters */
.filters-container {
  margin-bottom: 20px;
}

.filter-card {
  background: #fafbfc;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
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
  space-y: 15px;
}

.history-item {
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.native-language {
  color: #909399;
}

.timestamp {
  color: #909399;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-item-content {
  margin-bottom: 15px;
}

.prompt-preview {
  margin-bottom: 10px;
}

.prompt-text {
  margin: 8px 0 0 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  line-height: 1.6;
  color: #2c3e50;
  word-break: break-word;
}

.ai-url-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.ai-url-label {
  color: #909399;
  font-weight: 500;
}

.ai-url {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  color: #606266;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.history-item-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.detail-ai-url {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  color: #606266;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
}

.language-display {
  font-weight: 500;
  color: #2c3e50;
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

  .stats-container {
    flex-direction: column;
    gap: 10px;
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