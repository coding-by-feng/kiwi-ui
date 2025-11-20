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
                  :class="getModeClass()"
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
            <!-- Icon-only compact action buttons with tooltips -->
            <el-tooltip content="Review" placement="top">
              <el-button
                class="action-btn"
                size="mini"
                circle
                icon="el-icon-search"
                :aria-label="'Review'"
                @click="searchAgain(record)"
              />
            </el-tooltip>

            <el-tooltip content="Copy" placement="top">
              <el-button
                class="action-btn"
                size="mini"
                circle
                icon="el-icon-document-copy"
                :aria-label="'Copy prompt'"
                @click="copyPrompt(record.prompt)"
              />
            </el-tooltip>

            <el-tooltip content="Details" placement="top">
              <el-button
                class="action-btn"
                size="mini"
                circle
                icon="el-icon-view"
                :aria-label="'Details'"
                @click="viewDetails(record)"
              />
            </el-tooltip>

            <el-tooltip content="Archive" placement="top">
              <el-button
                class="action-btn"
                size="mini"
                circle
                icon="el-icon-box"
                :aria-label="'Archive'"
                @click="archiveItem(record.id)"
                :loading="archivingIds.includes(record.id)"
              />
            </el-tooltip>

            <el-tooltip content="Delete" placement="top">
              <el-button
                class="action-btn"
                size="mini"
                circle
                icon="el-icon-delete"
                :aria-label="'Delete'"
                @click="confirmDelete(record.id)"
                :loading="deletingIds.includes(record.id)"
              />
            </el-tooltip>
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
            <el-tag :type="getModeTagType(selectedRecord.promptMode)" :class="getModeClass()">
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
import messageCenter from '@/util/msg';
import { getAiCallHistory, archiveAiCallHistory, deleteAiCallHistory } from '@/api/ai'; // Removed callAiChatCompletion

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
          messageCenter.error(response.data.msg || 'Failed to load AI call history');
        }
      } catch (error) {
        console.error('Error loading AI call history:', error);
        messageCenter.error('Failed to load AI call history: ' + (error.message || 'Unknown error'));
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
      // Map each AI mode to a distinct, readable tag color (avoid green/success)
      const map = {
        [kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value]: 'primary',
        [kiwiConsts.SEARCH_AI_MODES.TRANSLATION_AND_EXPLANATION.value]: 'info',
        [kiwiConsts.SEARCH_AI_MODES.GRAMMAR_EXPLANATION.value]: 'warning',
        [kiwiConsts.SEARCH_AI_MODES.GRAMMAR_CORRECTION.value]: 'danger',
        [kiwiConsts.SEARCH_AI_MODES.VOCABULARY_EXPLANATION.value]: 'primary',
        [kiwiConsts.SEARCH_AI_MODES.SYNONYM.value]: 'info',
        [kiwiConsts.SEARCH_AI_MODES.ANTONYM.value]: 'warning',
        [kiwiConsts.SEARCH_AI_MODES.VOCABULARY_ASSOCIATION.value]: 'primary',
        [kiwiConsts.SEARCH_AI_MODES.PHRASES_ASSOCIATION.value]: 'info',
        // New modes
        [kiwiConsts.SEARCH_AI_MODES.VOCABULARY_CHARACTER_EXPANSION.value]: 'warning',
        [kiwiConsts.SEARCH_AI_MODES.AMBIGUOUS_ASSOCIATION_CORRECTION.value]: 'danger'
      };
      return map[modeValue] || 'primary';
    },

    getModeClass() {
      // All AI modes share the same class to enforce white font color
      return 'ai-mode-tag';
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
      const query = {
        active: 'search',
        selectedMode: record.promptMode,
        language: record.targetLanguage,
        originalText: encodeURIComponent(record.prompt),
        ytbMode: this.$route.query.ytbMode || kiwiConsts.YTB_MODE.CHANNEL,
        now: new Date().getTime()
      };
      const routeData = this.$router.resolve({ path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL, query });
      window.open(routeData.href, '_blank');
    },

    copyPrompt(prompt) {
      navigator.clipboard.writeText(prompt)
          .then(() => {
            messageCenter.success('Prompt copied to clipboard!');
          })
          .catch(() => {
            messageCenter.error('Failed to copy prompt');
          });
    },


    viewDetails(record) {
      console.log('Viewing details for record:', record);
      this.selectedRecord = record;
      this.detailDialogVisible = true;
    },

    async archiveItem(id) {
      this.archivingIds.push(id);
      try {
        const response = await archiveAiCallHistory(id);
        if (response.data.code === 1) {
          messageCenter.success(response.data.data || 'Item archived successfully');
          // Reload the history to reflect changes
          this.loadHistory();
        } else {
          messageCenter.error(response.data.msg || 'Failed to archive item');
        }
      } catch (error) {
        console.error('Archive failed:', error);
        const errorMessage = error.response?.data?.msg || 'Failed to archive item';
        messageCenter.error(errorMessage);
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
          messageCenter.success(response.data.data || 'Item deleted successfully');
          // Reload the history to reflect changes
          this.loadHistory();
        } else {
          messageCenter.error(response.data.msg || 'Failed to delete item');
        }
      } catch (error) {
        console.error('Delete failed:', error);
        const errorMessage = error.response?.data?.msg || 'Failed to delete item';
        messageCenter.error(errorMessage);
      } finally {
        this.deletingIds = this.deletingIds.filter(i => i !== id);
      }
    }
  }
}
</script>

<style scoped>
.ai-call-history {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-body);
  border-radius: 18px;
  box-shadow: var(--shadow-card);
}

/* Header */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-color-light);
}

.history-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Filters */
.filters-container {
  margin-bottom: 20px;
}

.filter-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--backdrop-filter);
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
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 64px;
  color: var(--color-primary);
  margin-bottom: 20px;
  opacity: 0.35;
}

.empty-state h3 {
  color: var(--text-primary);
  margin: 20px 0 10px 0;
}

.empty-state p {
  margin-bottom: 30px;
  line-height: 1.6;
  color: var(--text-regular);
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  margin-bottom: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.history-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--color-primary);
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
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.language-tag {
  background: var(--bg-container);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color-light);
  color: var(--color-primary);
  font-weight: 600;
}

.native-language {
  color: var(--text-regular);
  font-weight: 500;
}

.timestamp {
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timestamp i {
  color: var(--color-primary);
}

.history-item-content {
  margin-bottom: 15px;
}

.prompt-preview strong {
  color: var(--text-primary);
  font-weight: 600;
}

.prompt-text {
  margin: 8px 0 0 0;
  padding: 18px;
  background: var(--bg-container);
  border-radius: 12px;
  border: 1px solid var(--border-color-light);
  line-height: 1.8;
  color: var(--text-primary);
  word-break: break-word;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
}

.history-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color-light);
  /* Keep on a single line with horizontal scroll if needed */
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

/* Compact icon-only action button */
.history-item-actions .action-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  border: 1px solid var(--border-color-light) !important;
  background: var(--bg-card) !important;
  color: var(--color-primary) !important;
  box-shadow: none !important;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease !important;
}

.history-item-actions .action-btn:hover:not(.is-loading) {
  background: var(--bg-container) !important;
  color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}

.history-item-actions .action-btn:active {
  transform: none !important;
}

.history-item-actions .action-btn [class^="el-icon-"],
.history-item-actions .action-btn [class*=" el-icon-"] {
  font-size: 16px;
}

/* Override previous large/button styles within actions for these icon buttons */
.history-item-actions .action-btn.el-button--primary,
.history-item-actions .action-btn.el-button--info,
.history-item-actions .action-btn.el-button--danger {
  background: var(--bg-card) !important;
  color: var(--color-primary) !important;
}

/* Remove previous button sizing overrides inside actions */
.history-item-actions .el-button {
  border-radius: 8px;
  /* Keep other buttons (if any) reasonable, but our .action-btn overrides apply with !important */
}


.filter-row .el-button {
  border-radius: 999px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  transition: all 0.25s ease !important;
  box-shadow: var(--shadow-card) !important;
  border: none !important;
  padding: 8px 18px !important;
  background: var(--gradient-primary) !important;
  color: #fff !important;
}

.filter-row .el-button:hover {
  background: var(--gradient-primary) !important;
  filter: brightness(1.1);
  transform: translateY(-1px) !important;
  box-shadow: var(--shadow-hover) !important;
  color: #fff !important;
}

.filter-row .el-button:focus {
  background: var(--gradient-primary) !important;
  box-shadow: 0 0 0 3px var(--border-color-light) !important;
  color: #fff !important;
}

.filter-row .el-button:active {
  transform: translateY(0px) !important;
}

/* Responsive design for small screens */
@media (max-width: 768px) {
  .ai-call-history {
    padding: 18px;
    border-radius: 16px;
    box-shadow: var(--shadow-card);
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
  
  /* Keep actions on a single line; allow horizontal scroll on mobile */
  .history-item-actions {
    gap: 10px;
    padding-top: 12px;
  }
  
}

@media (max-width: 480px) {
  .ai-call-history {
    padding: 14px;
    border-radius: 14px;
  }
  
  .history-title {
    font-size: 18px;
  }
  
  .filter-row {
    padding: 10px;
  }
  
  /* Ensure action buttons remain single-line with scroll */
  .history-item-actions {
    gap: 10px;
    padding-top: 12px;
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
  padding-top: 24px;
  border-top: 1px solid var(--border-color-light);
}

/* Detail Dialog */
.detail-dialog .detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-prompt {
  background: var(--bg-container);
  padding: 22px;
  border-radius: 12px;
  border: 1px solid var(--border-color-light); /* place base border first */
  border-left: 4px solid var(--color-primary); /* then accent left border so it's not overwritten */
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
}

.language-display {
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-footer {
  text-align: center;
}

.dialog-footer .el-button {
  margin: 0 8px;
}

/* Element UI tag customization */
.el-tag {
  border-radius: 999px;
  font-weight: 600;
  border: none;
  padding: 4px 12px;
  box-shadow: var(--shadow-card);
}

.el-tag--primary {
  background: var(--gradient-primary);
  color: #fff;
}

.el-tag--success {
  background: var(--gradient-success);
  color: #fff;
}

.el-tag--warning {
  background: var(--gradient-warning);
  color: #fff;
}

.el-tag--danger {
  background: var(--gradient-danger);
  color: #fff;
}

.el-tag--info {
  background: var(--gradient-info);
  color: #fff;
}


/* Responsive Design */
@media (max-width: 768px) {
  .ai-call-history {
    padding: 18px;
    border-radius: 16px;
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
    justify-content: flex-start;
  }

  .detail-dialog {
    width: 95% !important;
  }
}

.ai-mode-tag { /* force white font for all AI mode tags */
  color: #ffffff !important;
}
.ai-mode-tag ::v-deep(*) {
  color: #ffffff !important;
}
</style>
