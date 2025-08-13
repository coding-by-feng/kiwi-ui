<template>
  <div class="ai-call-history">
    <div class="history-header">
      <h2 class="history-title">
        AI Call History
      </h2>
    </div>

    <!-- Filters -->
    <div class="filters-container" v-if="!loading">
      <el-card class="filter-card">
        <div class="filter-row">
          <el-select
              v-model="filterMode"
              placeholder="Filter by Mode"
              size="small"
              clearable
              @change="applyFilters"
              v-if="historyData && historyData.total > 0">
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
              @change="applyFilters"
              v-if="historyData && historyData.total > 0">
            <el-option label="All Languages" value=""></el-option>
            <el-option
                v-for="lang in uniqueLanguages"
                :key="lang"
                :label="getLanguageLabel(lang)"
                :value="lang">
            </el-option>
          </el-select>

          <el-select
              v-model="filterClassification"
              placeholder="Filter by Status"
              size="small"
              clearable
              @change="applyFilters">
            <el-option label="Normal Items" value="normal"></el-option>
            <el-option label="Archived Items" value="archived"></el-option>
            <el-option label="All Items" value="all"></el-option>
          </el-select>

          <el-button
              type="text"
              size="small"
              icon="el-icon-delete"
              @click="clearFilters"
              v-if="filterMode || filterLanguage || filterClassification">
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
                type="primary"
                size="small"
                icon="el-icon-search"
                @click="searchAgain(record)">
              Review
            </el-button>
            <el-button
                type="primary"
                size="small"
                icon="el-icon-document-copy"
                @click="copyPrompt(record.prompt)">
              Copy
            </el-button>
            <el-button
                type="primary"
                size="small"
                icon="el-icon-view"
                @click="viewDetails(record)">
              Details
            </el-button>
            <el-button
                type="primary"
                size="small"
                icon="el-icon-box"
                @click="archiveItem(record.id)"
                :loading="archivingIds.includes(record.id)">
              Archive
            </el-button>
            <el-button
                type="primary"
                size="small"
                icon="el-icon-delete"
                @click="confirmDelete(record.id)"
                :loading="deletingIds.includes(record.id)">
              Delete
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
import { getAiCallHistory, archiveAiCallHistory, deleteAiCallHistory } from '@/api/ai'; // Import the API functions

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
      filterClassification: 'normal',

      // Detail dialog
      detailDialogVisible: false,
      selectedRecord: null,

      // Language and mode mappings
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      searchModes: Object.values(kiwiConsts.SEARCH_AI_MODES),

      archivingIds: [],
      deletingIds: [],
      lastClassificationFilter: 'normal'
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
      if (!this.historyData || !this.historyData.records) {
        return [];
      }

      let records = this.historyData.records;

      // Apply mode filter
      if (this.filterMode) {
        records = records.filter(record => record.promptMode === this.filterMode);
      }

      // Apply language filter
      if (this.filterLanguage) {
        records = records.filter(record =>
            record.targetLanguage === this.filterLanguage ||
            record.nativeLanguage === this.filterLanguage
        );
      }

      // Classification filtering is now handled server-side, so we don't filter here

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
        console.log(`Loading AI call history - page: ${this.currentPage}, size: ${this.pageSize}, filter: ${this.filterClassification}`);

        // Use the extracted API function with filter parameter
        const response = await getAiCallHistory(this.currentPage, this.pageSize, this.filterClassification);

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
      // For classification filter, we need to reload data from API
      // For mode and language filters, we use client-side filtering
      if (this.filterClassification !== this.lastClassificationFilter) {
        this.currentPage = 1; // Reset to first page when filter changes
        this.loadHistory();
        this.lastClassificationFilter = this.filterClassification;
      }
      console.log('Applying filters:', this.filterMode, this.filterLanguage, this.filterClassification);
    },

    clearFilters() {
      const hadClassificationFilter = this.filterClassification !== '';
      this.filterMode = '';
      this.filterLanguage = '';
      this.filterClassification = '';
      this.lastClassificationFilter = '';
      
      // If we had a classification filter, reload data to get all items
      if (hadClassificationFilter) {
        this.currentPage = 1;
        this.loadHistory();
      }
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
        path: '/index/tools/aiResponseDetail',
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
        path: '/index/tools/detail',
        query: {
          active: 'search',
          ytbMode: this.$route.query.ytbMode || kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      });
    },

    async archiveItem(id) {
      this.archivingIds.push(id);
      try {
        const response = await archiveAiCallHistory(id);
        if (response.data.code === 1) {
          Message.success(response.data.data || 'Item archived successfully');
          // Reload the history to reflect changes
          this.loadHistory();
        } else {
          Message.error(response.data.msg || 'Failed to archive item');
        }
      } catch (error) {
        console.error('Archive failed:', error);
        const errorMessage = error.response?.data?.msg || 'Failed to archive item';
        Message.error(errorMessage);
      } finally {
        this.archivingIds = this.archivingIds.filter(i => i !== id);
      }
    },

    confirmDelete(id) {
      this.$confirm('Are you sure you want to delete this item? This action cannot be undone.', 'Delete Item', {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.deleteItem(id);
      }).catch(() => {
        console.log('Delete cancelled');
      });
    },

    async deleteItem(id) {
      this.deletingIds.push(id);
      try {
        const response = await deleteAiCallHistory(id);
        if (response.data.code === 1) {
          Message.success(response.data.data || 'Item deleted successfully');
          // Reload the history to reflect changes
          this.loadHistory();
        } else {
          Message.error(response.data.msg || 'Failed to delete item');
        }
      } catch (error) {
        console.error('Delete failed:', error);
        const errorMessage = error.response?.data?.msg || 'Failed to delete item';
        Message.error(errorMessage);
      } finally {
        this.deletingIds = this.deletingIds.filter(i => i !== id);
      }
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
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.history-item-actions {
  display: flex;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid #f0f2f5;
  gap: 6px;
  overflow: hidden;
  box-sizing: border-box;
  align-items: center;
}

.history-item-actions .el-button {
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  padding: 8px 16px !important;
  min-width: 80px !important;
}

.history-item-actions .el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  color: white !important;
}

.history-item-actions .el-button--primary:hover:not(.is-loading) {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
  color: white !important;
}

.history-item-actions .el-button--primary:focus {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
  color: white !important;
}

.history-item-actions .el-button--info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
  color: white !important;
}

.history-item-actions .el-button--info:hover:not(.is-loading) {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3) !important;
  color: white !important;
}

.history-item-actions .el-button--info:focus {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.3) !important;
  color: white !important;
}

.history-item-actions .el-button--danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;
  color: white !important;
}

.history-item-actions .el-button--danger:hover:not(.is-loading) {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4) !important;
  color: white !important;
}

.history-item-actions .el-button--danger:focus {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  box-shadow: 0 0 0 2px rgba(245, 101, 101, 0.3) !important;
  color: white !important;
}

.history-item-actions .el-button:not(.el-button--primary):not(.el-button--info):not(.el-button--danger) {
  background: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
  color: #6c757d !important;
}

.history-item-actions .el-button:not(.el-button--primary):not(.el-button--info):not(.el-button--danger):hover:not(.is-loading) {
  background: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.history-item-actions .el-button.is-loading {
  transform: none !important;
  opacity: 0.8;
}

.history-item-actions .el-button:active {
  transform: translateY(0px) !important;
}

.filter-row .el-button {
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  padding: 8px 16px !important;
  background: linear-gradient(135deg, #909399 0%, #606266 100%) !important;
  color: white !important;
}

.filter-row .el-button:hover {
  background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.3) !important;
  color: white !important;
}

.filter-row .el-button:focus {
  background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
  box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.3) !important;
  color: white !important;
}

.filter-row .el-button:active {
  transform: translateY(0px) !important;
}

/* Responsive design for small screens */
@media (max-width: 768px) {
  .ai-call-history {
    padding: 15px;
  }
  
  .history-title {
    font-size: 20px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
  }
  
  .filter-row .el-select {
    min-width: unset;
    width: 100%;
  }
  
  .history-item-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding-top: 15px;
  }
  
}

@media (max-width: 480px) {
  .ai-call-history {
    padding: 10px;
  }
  
  .history-title {
    font-size: 18px;
  }
  
  .filter-row {
    padding: 10px;
  }
  
  .history-item-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding-top: 15px;
  }
  
  .history-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .timestamp {
    align-self: flex-end;
    font-size: 12px;
  }
  
  .prompt-text {
    padding: 12px;
    font-size: 14px;
  }
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