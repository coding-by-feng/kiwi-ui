<template>
  <div class="ai-call-history">
    <div class="history-header">
      <h2 class="history-title">
        {{ $t('ai.aiCallHistory') }}
      </h2>
    </div>

    <!-- Filters -->
    <div class="filters-container" v-if="!loading">
      <div class="filter-card">
        <div class="filter-row">
          <KiwiDropdown @command="handleModeFilter">
            <KiwiButton size="small">
              {{ filterMode ? getModeLabel(filterMode) : $t('ai.allModes') }}
              <i class="el-icon-arrow-down"></i>
            </KiwiButton>
            <template slot="dropdown">
              <KiwiDropdownItem :command="''">
                {{ $t('ai.allModes') }}
              </KiwiDropdownItem>
              <KiwiDropdownItem
                  v-for="mode in searchModes"
                  :key="mode.value"
                  :command="mode.value">
                <span :class="'mode-option-' + getModeTagType(mode.value)">
                  {{ mode.label }}
                </span>
              </KiwiDropdownItem>
            </template>
          </KiwiDropdown>

          <KiwiDropdown v-if="historyData && historyData.total > 0" @command="handleLanguageFilter">
            <KiwiButton size="small">
              {{ filterLanguage ? getLanguageLabel(filterLanguage) : $t('ai.allLanguages') }}
              <i class="el-icon-arrow-down"></i>
            </KiwiButton>
            <template slot="dropdown">
              <KiwiDropdownItem :command="''">
                {{ $t('ai.allLanguages') }}
              </KiwiDropdownItem>
              <KiwiDropdownItem
                  v-for="lang in uniqueLanguages"
                  :key="lang"
                  :command="lang">
                {{ getLanguageLabel(lang) }}
              </KiwiDropdownItem>
            </template>
          </KiwiDropdown>

          <KiwiDropdown @command="handleClassificationFilter">
            <KiwiButton size="small">
              {{ getClassificationLabel(filterClassification) }}
              <i class="el-icon-arrow-down"></i>
            </KiwiButton>
            <template slot="dropdown">
              <KiwiDropdownItem command="normal">{{ $t('ai.normalItems') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="archived">{{ $t('ai.archivedItems') }}</KiwiDropdownItem>
              <KiwiDropdownItem command="all">{{ $t('ai.allItems') }}</KiwiDropdownItem>
            </template>
          </KiwiDropdown>

          <KiwiButton
              type="text"
              size="small"
              icon="el-icon-delete"
              @click="clearFilters"
              v-if="filterMode || filterLanguage || filterClassification">
            {{ $t('ai.clearFilters') }}
          </KiwiButton>
        </div>
      </div>
    </div>

    <!-- History List -->
    <div class="history-content" v-if="!loading">
      <div v-if="!historyData || historyData.total === 0" class="empty-state">
        <i class="el-icon-document-remove"></i>
        <h3>{{ $t('ai.noHistoryFound') }}</h3>
        <p>{{ $t('ai.historyDescription') }}</p>
      </div>

      <div v-else class="history-list">
        <div
            v-for="record in filteredRecords"
            :key="record.id"
            class="history-item">
          <div class="history-item-header">
            <div class="mode-info">
              <div class="mode-tags">
                <KiwiTag
                    :type="getModeTagType(record.promptMode)"
                    :class="getModeClass()"
                    size="small">
                  {{ getModeLabel(record.promptMode) }}
                </KiwiTag>
                <KiwiTag
                    v-if="record.archived"
                    type="info"
                    size="small"
                    class="archived-tag">
                  {{ $t('ai.archived') }}
                </KiwiTag>
              </div>
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
              <strong>{{ $t('ai.prompt') }}:</strong>
              <p class="prompt-text">{{ truncateText(record.prompt, 200) }}</p>
            </div>
          </div>

          <div class="history-item-actions">
            <!-- Icon-only compact action buttons with tooltips -->
            <KiwiButton
              class="action-btn"
              size="mini"
              circle
              icon="el-icon-view"
              :aria-label="$t('ai.review')"
              :title="$t('ai.review')"
              @click="viewDetails(record)"
            />

            <KiwiButton
              class="action-btn"
              size="mini"
              circle
              icon="el-icon-document-copy"
              :aria-label="$t('ai.copyPrompt')"
              :title="$t('ai.copyPrompt')"
              @click="copyPrompt(record.prompt)"
            />

            <KiwiButton
              class="action-btn"
              size="mini"
              circle
              icon="el-icon-box"
              :aria-label="$t('ai.archive')"
              :title="$t('ai.archive')"
              @click="archiveItem(record.id)"
              :loading="archivingIds.includes(record.id)"
            />

            <KiwiButton
              class="action-btn"
              size="mini"
              circle
              icon="el-icon-delete"
              :aria-label="$t('common.delete')"
              :title="$t('common.delete')"
              @click="confirmDelete(record.id)"
              :loading="deletingIds.includes(record.id)"
            />
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-container" v-if="historyData.total > pageSize">
          <KiwiPagination
              @current-change="handlePageChange"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="historyData.total">
          </KiwiPagination>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">
      <i class="el-icon-loading"></i> {{ $t('ai.loadingHistory') }}
    </div>

    <!-- Detail Dialog -->
    <KiwiDialog
        :title="$t('ai.aiCallDetails')"
        :visible.sync="detailDialogVisible"
        width="80%"
        class="detail-dialog">
      <div v-if="selectedRecord" class="detail-content">
        <!-- Loading state -->
        <div v-if="detailLoading" class="detail-loading">
          <i class="el-icon-loading"></i>
          <span>{{ $t('ai.loadingDetail') || 'Loading...' }}</span>
        </div>

        <div v-else class="detail-form">
          <!-- Metadata row -->
          <div class="detail-meta-row">
            <div class="detail-meta-item">
              <label>{{ $t('ai.mode') }}:</label>
              <KiwiTag :type="getModeTagType(selectedRecord.promptMode)" :class="getModeClass()">
                {{ getModeLabel(selectedRecord.promptMode) }}
              </KiwiTag>
            </div>

            <div class="detail-meta-item">
              <label>{{ $t('ai.languages') }}:</label>
              <span class="language-display">
                {{ getLanguageLabel(selectedRecord.targetLanguage) }}
                <span v-if="selectedRecord.nativeLanguage">
                  → {{ getLanguageLabel(selectedRecord.nativeLanguage) }}
                </span>
              </span>
            </div>

            <div class="detail-meta-item">
              <label>{{ $t('ai.timestamp') }}:</label>
              <span>{{ formatFullTimestamp(selectedRecord.timestamp) }}</span>
            </div>
          </div>

          <!-- Prompt section -->
          <div class="detail-section">
            <label class="section-label">{{ $t('ai.prompt') }}:</label>
            <div class="detail-prompt">{{ selectedRecord.prompt }}</div>
          </div>

          <!-- AI Response section -->
          <div class="detail-section">
            <label class="section-label">{{ $t('ai.aiResponse') || 'AI Response' }}:</label>
            <div v-if="selectedRecord.aiResponse" class="detail-response">
              {{ selectedRecord.aiResponse }}
            </div>
            <div v-else class="detail-response detail-response--empty">
              <i class="el-icon-warning-outline"></i>
              <span>{{ $t('ai.noResponseAvailable') || 'Response not available - click Search Again to regenerate' }}</span>
            </div>
          </div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <KiwiButton @click="detailDialogVisible = false">{{ $t('common.close') }}</KiwiButton>
        <KiwiButton
            v-if="selectedRecord && selectedRecord.aiResponse"
            type="info"
            icon="el-icon-document-copy"
            @click="copyResponse(selectedRecord.aiResponse)">
          {{ $t('ai.copyResponse') || 'Copy Response' }}
        </KiwiButton>
        <KiwiButton type="primary" icon="el-icon-search" @click="searchAgain(selectedRecord)">
          {{ $t('ai.searchAgain') }}
        </KiwiButton>
      </span>
    </KiwiDialog>
  </div>
</template>

<script>
import kiwiConsts from "@/const/kiwiConsts";
import messageCenter from '@/util/msg';
import { getAiCallHistory, getAiCallHistoryDetail, archiveAiCallHistory, deleteAiCallHistory } from '@/api/ai';
import KiwiButton from '@/components/ui/KiwiButton.vue';
import KiwiTag from '@/components/ui/KiwiTag.vue';
import KiwiPagination from '@/components/ui/KiwiPagination.vue';
import KiwiDialog from '@/components/ui/KiwiDialog.vue';
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue';
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue';

export default {
  name: 'AiCallHistory',
  components: {
    KiwiButton,
    KiwiTag,
    KiwiPagination,
    KiwiDialog,
    KiwiDropdown,
    KiwiDropdownItem
  },
  props: {
    // When true, the component is the active tab and should load data
    isActive: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 10,
      historyData: { total: 0, records: [] },

      // Filters
      filterMode: '',
      filterLanguage: '',
      filterClassification: 'all',

      // Detail dialog
      detailDialogVisible: false,
      detailLoading: false,
      selectedRecord: null,

      // Language and mode mappings
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      searchModes: Object.values(kiwiConsts.SEARCH_AI_MODES),

      archivingIds: [],
      deletingIds: [],
      lastClassificationFilter: 'all'
    }
  },

  watch: {
    // Load data when tab becomes active (and data hasn't been loaded yet)
    isActive: {
      handler(newVal) {
        if (newVal && this.historyData.total === 0 && this.historyData.records.length === 0 && !this.loading) {
          this.loadHistory();
        }
      },
      immediate: false
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
    // Only load history if the tab is currently active
    // This prevents API calls when switching to other tabs (PDF, Todo, etc.)
    if (this.isActive) {
      this.loadHistory();
    }
  },

  methods: {
    async loadHistory() {
      this.loading = true;
      try {
        console.log(`Loading AI call history - page: ${this.currentPage}, size: ${this.pageSize}, filter: ${this.filterClassification}`);

        // Use the extracted API function with filter parameter
        const response = await getAiCallHistory(this.currentPage, this.pageSize, this.filterClassification);

        if (response.data.success) {
          this.historyData = response.data.data;
          console.log('Loaded AI call history successfully:', this.historyData);
        } else {
          console.error('API returned error:', response.data);
          messageCenter.error(response.data.msg || this.$t('ai.loadHistoryFailed'));
        }
      } catch (error) {
        console.error('Error loading AI call history:', error);
        messageCenter.error(this.$t('ai.loadHistoryFailed') + ': ' + (error.message || this.$t('ai.unknown')));
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

    handleModeFilter(command) {
      this.filterMode = command;
      this.applyFilters();
    },

    handleLanguageFilter(command) {
      this.filterLanguage = command;
      this.applyFilters();
    },

    handleClassificationFilter(command) {
      this.filterClassification = command;
      this.applyFilters();
    },

    getClassificationLabel(value) {
      const labels = {
        'normal': this.$t('ai.normalItems'),
        'archived': this.$t('ai.archivedItems'),
        'all': this.$t('ai.allItems')
      };
      return labels[value] || this.$t('ai.allItems');
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
        [kiwiConsts.SEARCH_AI_MODES.VOCABULARY_CHARACTER_EXPANSION.value]: 'warning',
        [kiwiConsts.SEARCH_AI_MODES.AMBIGUOUS_ASSOCIATION_CORRECTION.value]: 'danger',
        [kiwiConsts.SEARCH_AI_MODES.NATURAL_IDIOMATIC_RETOUCH.value]: 'primary'
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

    // Convert timestamp to Date object (supports both ISO string and array formats)
    parseTimestamp(timestamp) {
      if (!timestamp) {
        return null;
      }

      // Handle ISO 8601 string format: "2025-11-18T16:54:06"
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }

      // Handle array format: [year, month, day, hour, minute, second]
      if (Array.isArray(timestamp) && timestamp.length >= 6) {
        const [year, month, day, hour, minute, second] = timestamp;
        return new Date(year, month - 1, day, hour, minute, second);
      }

      return null;
    },

    formatTimestamp(timestamp) {
      if (!timestamp) return this.$t('ai.unknown');

      const date = this.parseTimestamp(timestamp);
      if (!date) return this.$t('ai.invalidDate');

      return date.toLocaleString();
    },

    formatFullTimestamp(timestamp) {
      if (!timestamp) return this.$t('ai.unknown');

      const date = this.parseTimestamp(timestamp);
      if (!date) return this.$t('ai.invalidDate');

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
            messageCenter.success(this.$t('ai.promptCopied'));
          })
          .catch(() => {
            messageCenter.error(this.$t('ai.failedToCopy'));
          });
    },

    copyResponse(response) {
      navigator.clipboard.writeText(response)
          .then(() => {
            messageCenter.success(this.$t('ai.responseCopied') || 'Response copied!');
          })
          .catch(() => {
            messageCenter.error(this.$t('ai.failedToCopy'));
          });
    },


    async viewDetails(record) {
      console.log('Viewing details for record:', record);
      this.selectedRecord = { ...record, aiResponse: null };
      this.detailDialogVisible = true;
      this.detailLoading = true;

      try {
        const response = await getAiCallHistoryDetail(record.id);
        if (response.data.success && response.data.data) {
          const detail = response.data.data;
          this.selectedRecord = {
            ...this.selectedRecord,
            prompt: detail.prompt,
            promptMode: detail.promptMode,
            targetLanguage: detail.targetLanguage,
            nativeLanguage: detail.nativeLanguage,
            timestamp: detail.createTime,
            aiResponse: detail.aiResponse
          };
          console.log('Loaded detail with aiResponse:', this.selectedRecord);
        }
      } catch (error) {
        console.error('Error loading history detail:', error);
        messageCenter.error(this.$t('ai.loadDetailFailed') || 'Failed to load details');
      } finally {
        this.detailLoading = false;
      }
    },

    async archiveItem(id) {
      this.archivingIds.push(id);
      try {
        const response = await archiveAiCallHistory(id);
        if (response.data.success) {
          messageCenter.success(response.data.data || this.$t('ai.itemArchived'));
          // Reload the history to reflect changes
          this.loadHistory();
        } else {
          messageCenter.error(response.data.msg || this.$t('ai.archiveFailed'));
        }
      } catch (error) {
        console.error('Archive failed:', error);
        const errorMessage = error.response?.data?.msg || this.$t('ai.archiveFailed');
        messageCenter.error(errorMessage);
      } finally {
        this.archivingIds = this.archivingIds.filter(i => i !== id);
      }
    },

    confirmDelete(id) {
      this.$confirm(this.$t('ai.deleteItemConfirm'), this.$t('ai.deleteItemTitle'), {
        confirmButtonText: this.$t('common.delete'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning',
        customClass: 'kiwi-delete-confirm-dialog'
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
        if (response.data.success) {
          messageCenter.success(response.data.data || this.$t('ai.itemDeleted'));
          // Reload the history to reflect changes
          this.loadHistory();
        } else {
          messageCenter.error(response.data.msg || this.$t('ai.deleteFailed'));
        }
      } catch (error) {
        console.error('Delete failed:', error);
        const errorMessage = error.response?.data?.msg || this.$t('ai.deleteFailed');
        messageCenter.error(errorMessage);
      } finally {
        this.deletingIds = this.deletingIds.filter(i => i !== id);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ai-call-history {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-body);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  min-height: 600px;
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
  padding: 16px;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  position: relative;

  // Elevate dropdown when active so menu appears above sibling elements
  ::v-deep .kiwi-dropdown {
    position: relative;
    z-index: 1;

    &.is-active {
      z-index: 100;
    }
  }
}

/* Custom Select Styles */
.kiwi-select-wrapper {
  position: relative;
  z-index: 1;
  display: inline-block;
  min-width: 150px;
}

.kiwi-select {
  width: 100%;
  height: 36px;
  padding: 0 30px 0 15px;
  border-radius: 8px;
  border: 1px solid var(--border-color-light);
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
}

.kiwi-select:hover {
  border-color: var(--text-secondary);
}

.kiwi-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-placeholder);
  pointer-events: none;
  font-size: 12px;
}

/* Mode option colors in dropdown */
.mode-option-primary {
  color: var(--color-primary);
  font-weight: 500;
}

.mode-option-info {
  color: var(--color-info);
  font-weight: 500;
}

.mode-option-warning {
  color: var(--color-warning);
  font-weight: 500;
}

.mode-option-danger {
  color: var(--color-danger);
  font-weight: 500;
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
  padding: 20px;
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
  flex: 1;
  min-width: 0;
}

.mode-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.archived-tag {
  opacity: 0.85;
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
  flex-shrink: 0;
  margin-left: 12px;
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
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--border-color-light);
  background: var(--bg-card);
  color: var(--color-primary);
  box-shadow: none;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.history-item-actions .action-btn:hover:not(.is-loading) {
  background: var(--bg-container);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.history-item-actions .action-btn:active {
  transform: none;
}

.history-item-actions .action-btn [class^="el-icon-"],
.history-item-actions .action-btn [class*=" el-icon-"] {
  font-size: 16px;
}
</style>

<style lang="scss">
/* Global styles for the delete confirmation dialog - uses !important to override Element UI defaults */
.kiwi-delete-confirm-dialog {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color-light) !important;
  border-radius: var(--card-border-radius, 16px) !important;
  box-shadow: var(--shadow-card) !important;
  backdrop-filter: var(--backdrop-filter);
  -webkit-backdrop-filter: var(--backdrop-filter);
  padding-bottom: 20px !important;

  .el-message-box__title {
    color: var(--text-primary) !important;
    font-weight: 600;
  }

  .el-message-box__content {
    color: var(--text-secondary) !important;
  }

  .el-message-box__status {
    color: var(--color-warning) !important;
  }

  .el-message-box__close {
    color: var(--text-secondary);

    &:hover {
      color: var(--color-primary);
    }
  }

  // Buttons in the dialog
  .el-button {
    border-radius: var(--radius-md);
    font-weight: 500;
    transition: var(--transition-normal);
  }

  // Cancel button
  .el-button--default {
    background: transparent !important;
    border: 1px solid var(--border-color-light) !important;
    color: var(--text-primary) !important;

    &:hover {
      background: var(--bg-container) !important;
      border-color: var(--color-primary) !important;
      color: var(--color-primary) !important;
    }
  }

  // Delete/Confirm button
  .el-button--primary {
    background: var(--color-danger) !important;
    border-color: var(--color-danger) !important;
    color: #fff !important;

    &:hover {
      opacity: 0.9;
      box-shadow: 0 0 15px rgba(var(--color-danger-rgb), 0.4);
      transform: translateY(-1px);
    }
  }
}
</style>

<style lang="scss" scoped>
// Filter row button styles
.filter-row ::v-deep .el-button {
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-card);
  border: none;
  padding: 8px 18px;
  background: var(--gradient-primary);
  color: #fff;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--border-color-light);
  }

  &:active {
    transform: translateY(0);
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
  max-height: 70vh;
  overflow-y: auto;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
  gap: 12px;

  i {
    font-size: 32px;
    color: var(--color-primary);
  }
}

.detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.detail-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 13px;
  }
}

.detail-section {
  margin-bottom: 20px;

  .section-label {
    display: block;
    color: var(--text-primary);
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 10px;
  }
}

.detail-prompt {
  background: var(--bg-container);
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color-light);
  border-left: 4px solid var(--color-primary);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
  font-size: 14px;
}

.detail-response {
  background: var(--bg-container);
  padding: 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color-light);
  border-left: 4px solid var(--color-success, #67c23a);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
  font-size: 14px;
}

.detail-response--empty {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  background: var(--bg-body);
  border-left-color: var(--color-warning, #e6a23c);

  i {
    font-size: 18px;
    color: var(--color-warning, #e6a23c);
  }
}

.language-display {
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-footer {
  text-align: center;

  .el-button {
    margin: 0 8px;
  }
}

// AI mode tag - force white text for gradient backgrounds
.ai-mode-tag {
  color: #ffffff;
}

/* Responsive Design */
@media (max-width: 992px) {
  .ai-call-history {
    max-width: 100%;
    margin: 0 12px;
  }
}

@media (max-width: 768px) {
  .ai-call-history {
    padding: 16px;
    border-radius: 14px;
    margin: 0 8px;
    min-height: auto;
  }

  .history-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    margin-bottom: 16px;
    padding-bottom: 14px;
  }

  .history-title {
    font-size: 20px;
  }

  .header-actions {
    display: flex;
    gap: 10px;

    .el-button {
      margin-left: 0;
      flex: 1;
    }
  }

  .filters-container {
    margin-bottom: 16px;
  }

  .filter-card {
    padding: 12px;
    border-radius: 12px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;

    .el-select,
    .kiwi-select-wrapper {
      min-width: auto;
      width: 100%;
    }

    ::v-deep .el-button,
    ::v-deep .kiwi-button {
      width: 100%;
      justify-content: center;
    }
  }

  .history-list {
    gap: 12px;
  }

  .history-item {
    padding: 14px;
    border-radius: 12px;
  }

  .history-item-header {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }

  .mode-info {
    gap: 6px;
  }

  .language-info {
    font-size: 12px;
    flex-wrap: wrap;
  }

  .language-tag {
    font-size: 11px;
    padding: 3px 8px;
  }

  .timestamp {
    font-size: 12px;
  }

  .history-item-content {
    margin-bottom: 12px;
  }

  .prompt-preview strong {
    font-size: 13px;
  }

  .prompt-text {
    padding: 12px;
    font-size: 14px;
    line-height: 1.7;
    border-radius: 10px;
  }

  .history-item-actions {
    justify-content: flex-start;
    gap: 8px;
    padding-top: 10px;
  }

  .history-item-actions .action-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .history-item-actions .action-btn [class^="el-icon-"],
  .history-item-actions .action-btn [class*=" el-icon-"] {
    font-size: 14px;
  }

  .pagination-container {
    margin-top: 20px;
    padding-top: 16px;
  }

  .detail-dialog {
    width: 95% !important;
  }

  .detail-content {
    max-height: 60vh;
  }

  .detail-meta-row {
    flex-direction: column;
    gap: 12px;
  }

  .detail-meta-item {
    label {
      font-size: 12px;
    }
  }

  .detail-section {
    margin-bottom: 16px;

    .section-label {
      font-size: 13px;
    }
  }

  .detail-prompt {
    padding: 14px;
    font-size: 13px;
    max-height: 120px;
  }

  .detail-response {
    padding: 14px;
    font-size: 13px;
    max-height: 250px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;

    .el-button,
    .kiwi-button {
      width: 100%;
      margin: 0;
    }
  }

  .empty-state {
    padding: 40px 16px;
  }

  .empty-state i {
    font-size: 48px;
  }

  .empty-state h3 {
    font-size: 18px;
    margin: 16px 0 8px 0;
  }

  .empty-state p {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

@media (max-width: 640px) {
  .ai-call-history {
    padding: 14px;
    margin: 0 6px;
  }

  .history-header {
    margin-bottom: 14px;
    padding-bottom: 12px;
  }

  .history-title {
    font-size: 18px;
  }

  .filter-card {
    padding: 10px;
  }

  .history-item {
    padding: 12px;
    border-radius: 10px;
  }

  .history-item-header {
    gap: 8px;
    margin-bottom: 10px;
  }

  .prompt-text {
    padding: 10px;
    font-size: 13px;
    border-radius: 8px;
  }

  .history-item-actions .action-btn {
    width: 34px;
    height: 34px;
    min-width: 34px;
  }
}

@media (max-width: 480px) {
  .ai-call-history {
    padding: 12px;
    border-radius: 12px;
    margin: 0 4px;
  }

  .history-header {
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .history-title {
    font-size: 17px;
  }

  .filter-card {
    padding: 8px;
    border-radius: 10px;
  }

  .filter-row {
    gap: 8px;

    ::v-deep .el-button,
    ::v-deep .kiwi-button {
      font-size: 13px;
      padding: 6px 12px;
    }
  }

  .history-list {
    gap: 10px;
  }

  .history-item {
    padding: 10px;
  }

  .mode-info {
    gap: 5px;
  }

  .language-tag {
    font-size: 10px;
    padding: 2px 6px;
  }

  .native-language {
    font-size: 11px;
  }

  .timestamp {
    font-size: 11px;
  }

  .prompt-preview strong {
    font-size: 12px;
  }

  .prompt-text {
    padding: 8px;
    font-size: 12px;
    line-height: 1.6;
  }

  .history-item-actions {
    gap: 6px;
    padding-top: 8px;
  }

  .history-item-actions .action-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .history-item-actions .action-btn [class^="el-icon-"],
  .history-item-actions .action-btn [class*=" el-icon-"] {
    font-size: 13px;
  }

  .pagination-container {
    margin-top: 16px;
    padding-top: 14px;
  }

  .detail-prompt {
    padding: 10px;
    font-size: 12px;
    max-height: 100px;
  }

  .detail-response {
    padding: 10px;
    font-size: 12px;
    max-height: 200px;
  }

  .empty-state {
    padding: 30px 12px;
  }

  .empty-state i {
    font-size: 40px;
  }

  .empty-state h3 {
    font-size: 16px;
    margin: 12px 0 6px 0;
  }

  .empty-state p {
    font-size: 13px;
  }
}
</style>
