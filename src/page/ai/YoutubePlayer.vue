<template>
  <div class="youtube-player">

    <!-- Collapse/expand toggle button for controls -->
    <div class="controls-collapse-toggle">
      <div class="collapse-toggle-wrapper" @click="toggleControlsCollapsed">
        <i :class="controlsCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" class="collapse-toggle-icon"></i>
        <span class="collapse-toggle-text">{{ controlsCollapsed ? 'Show Controls' : 'Hide Controls' }}</span>
      </div>
    </div>

    <!-- Enhanced Input Container with gradient styling -->
    <div class="input-container" v-show="!controlsCollapsed">
      <div class="url-input-group">
        <!-- Language dropdown that shows only when translation is enabled -->
        <KiwiDropdown v-show="ifTranslation" @command="selectedLanguageChange" class="language-select">
          <KiwiButton size="small">
            {{ getSelectedLanguageLabel() || 'Select Language' }}
            <i class="el-icon-arrow-down"></i>
          </KiwiButton>
          <template slot="dropdown">
            <KiwiDropdownItem
                v-for="(code, language) in languageCodes"
                :key="code"
                :command="code">
              {{ language.replaceAll('_', ' ') }}
            </KiwiDropdownItem>
          </template>
        </KiwiDropdown>

        <div class="input-with-buttons">
          <KiwiInput
              v-model="videoUrl"
              type="text"
              placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
              @keyup.enter.native="loadContent"
              class="url-input"
              :disabled="isLoading"
          />
          <div class="action-buttons">
            <button @click="loadContent" :disabled="!videoUrl || isLoading" class="load-button">
              <i v-if="isLoading" class="el-icon-loading spinning"></i>
              <i v-else class="el-icon-video-play"></i>
              {{ isLoading ? 'Loading...' : 'Load' }}
            </button>
            <KiwiButton type="info" icon="el-icon-delete" size="small" circle @click="cleanSubtitles" class="action-btn"></KiwiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Controls Container -->
    <div id="responsiveContainer" class="responsive-container" v-show="!controlsCollapsed">
      <div class="controls-wrapper">
        <div class="switch-group">
          <el-switch
              v-model="ifTranslation"
              :active-text="isSmallScreen ? '' : 'Include translation'"
              @change="ifTranslationOnChange"
              class="enhanced-switch">
            <template v-if="isSmallScreen" #inactive-icon>
              <i class="el-icon-chat-line-round"></i>
            </template>
            <template v-if="isSmallScreen" #active-icon>
              <i class="el-icon-chat-dot-round"></i>
            </template>
          </el-switch>
          <span v-if="isSmallScreen" class="mobile-switch-label">
            <i class="el-icon-chat-dot-round"></i>
          </span>
        </div>
        <div class="divider" v-if="!isSmallScreen"></div>
        <div class="switch-group">
          <el-switch
              v-model="middleControlEnabled"
              :active-text="isSmallScreen ? '' : 'Middle Control'"
              class="enhanced-switch">
            <template v-if="isSmallScreen" #inactive-icon>
              <i class="el-icon-minus"></i>
            </template>
            <template v-if="isSmallScreen" #active-icon>
              <i class="el-icon-plus"></i>
            </template>
          </el-switch>
          <span v-if="isSmallScreen" class="mobile-switch-label">
            <i class="el-icon-plus"></i>
          </span>
        </div>
        <div class="divider" v-if="!isSmallScreen"></div>
        <div class="switch-group">
          <el-switch
              v-model="autoCenterEnabled"
              :active-text="isSmallScreen ? '' : 'Auto-center Timeline'"
              @change="onAutoCenterChange"
              class="enhanced-switch">
            <template v-if="isSmallScreen" #inactive-icon>
              <i class="el-icon-location-outline"></i>
            </template>
            <template v-if="isSmallScreen" #active-icon>
              <i class="el-icon-location-information"></i>
            </template>
          </el-switch>
          <span v-if="isSmallScreen" class="mobile-switch-label">
            <i class="el-icon-location-information"></i>
          </span>
        </div>
        <div class="divider" v-if="!isSmallScreen"></div>
        <div class="switch-group">
          <el-switch
              v-model="loopEnabled"
              :active-text="isSmallScreen ? '' : 'Loop Video'"
              @change="onLoopChange"
              class="enhanced-switch">
            <template v-if="isSmallScreen" #inactive-icon>
              <i class="el-icon-refresh-right"></i>
            </template>
            <template v-if="isSmallScreen" #active-icon>
              <i class="el-icon-refresh"></i>
            </template>
          </el-switch>
          <span v-if="isSmallScreen" class="mobile-switch-label">
            <i class="el-icon-refresh"></i>
          </span>
        </div>
        <!-- Favorite button moved to top controls bar -->
        <div class="switch-group favorite-top-group">
          <el-tooltip :content="canFavorite ? (isFavorited ? 'Unfavorite this video' : 'Favorite this video') : 'Load a video to favorite'" placement="top">
            <KiwiButton
                :icon="isFavorited ? 'el-icon-star-on' : 'el-icon-star-off'"
                :class="['favorite-btn', isFavorited ? 'favorited' : '']"
                circle
                size="small"
                :loading="pendingFavorite"
                :disabled="pendingFavorite || !canFavorite"
                @click.stop="toggleFavoriteOnPlayer"
                aria-label="Favorite toggle"
            />
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- Enhanced Status Message with Loading Animation -->
    <div class="status-container" v-show="!isPlaying && statusMessage !== ''">
      <!-- Compact inline loading chip instead of large panel -->
      <div v-if="isLoading" class="compact-status">
        <i class="el-icon-loading spinning"></i>
        <span class="compact-status-text">{{ statusMessage || 'Loading video...' }}</span>
        <div class="compact-progress" aria-hidden="true">
          <div class="compact-progress-fill" :style="{ width: (miniLoaderPercent || 5) + '%' }"></div>
        </div>
      </div>
      <p v-else class="status-message compact">{{ statusMessage }}</p>
    </div>

    <!-- Enhanced Content Container -->
    <div class="content-container" :class="{ resizing: isResizing }" v-if="(videoUrl && videoUrl !== '')">
      <!-- Left Panel (video and controls) -->
      <div class="left-panel" :style="!isSmallScreen ? { width: leftPanelPercent + '%' } : null">
        <!-- Video Player Section -->
        <div class="video-section">
          <div class="video-container">
            <div id="youtube-player-container"></div>
            <!-- Mini unobtrusive initialization/buffering indicator -->
            <div v-if="showMiniLoader" class="video-mini-loader">
              <i class="el-icon-video-play mini-loader-icon" v-if="!videoReady"></i>
              <i class="el-icon-loading mini-loader-icon" v-else></i>
              <div class="mini-loader-text">
                {{ miniLoaderText }}
                <span v-if="miniLoaderPercent > 0">{{ Math.round(miniLoaderPercent) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Subtitle Display -->
        <div class="subtitles-context-display"
             v-if="showContextDisplay"
             v-show="middleControlEnabled"
             @mouseup="handleTextSelectionWithPausing"
             @touchend="handleTextSelectionWithPausing">
          <div v-if="hasPreviousSubtitle" class="subtitle-line previous-subtitle">
            <span class="subtitle-text">{{ subtitles[currentSubtitleIndex - 1]?.text }}</span>
            <KiwiButton
              class="subtitle-action-btn"
              type="text"
              icon="el-icon-search"
              size="mini"
              circle
              @click.stop="openAiPopupWithSubtitle(subtitles[currentSubtitleIndex - 1]?.text)"
              title="Search with AI"
            />
          </div>
          <div v-if="subtitles.length" class="subtitle-line current-subtitle-display">
            <span class="subtitle-text">{{ subtitles[currentSubtitleIndex]?.text }}</span>
            <KiwiButton
              class="subtitle-action-btn current"
              type="primary"
              icon="el-icon-search"
              size="mini"
              circle
              @click.stop="openAiPopupWithSubtitle(subtitles[currentSubtitleIndex]?.text)"
              title="Search with AI"
            />
          </div>
          <div v-if="hasNextSubtitle" class="subtitle-line next-subtitle">
            <span class="subtitle-text">{{ subtitles[currentSubtitleIndex + 1]?.text }}</span>
            <KiwiButton
              class="subtitle-action-btn"
              type="text"
              icon="el-icon-search"
              size="mini"
              circle
              @click.stop="openAiPopupWithSubtitle(subtitles[currentSubtitleIndex + 1]?.text)"
              title="Search with AI"
            />
          </div>
        </div>
      </div>

      <!-- Draggable splitter: desktop only -->
      <div
          v-if="!isSmallScreen"
          class="splitter"
          role="separator"
          aria-orientation="vertical"
          :aria-valuenow="leftPanelPercent"
          aria-valuemin="20"
          aria-valuemax="80"
          tabindex="0"
          @mousedown.prevent="startResize"
          @dblclick="resetPanelSizes"
      ></div>

      <!-- Right Panel (subtitles) -->
      <div class="right-panel" :style="!isSmallScreen ? { width: (100 - leftPanelPercent) + '%' } : null">
        <!-- Enhanced Subtitles List -->
        <div class="subtitles-header clickable-header" @click="toggleScrollingSubtitles">
          <i class="el-icon-document"></i>
          <span>Subtitles Timeline</span>
          <span class="subtitle-count">({{ subtitles.length }})</span>
          <div class="header-toggle-hint">
            <i :class="scrollingSubtitlesCollapsed ? 'el-icon-arrow-right' : 'el-icon-arrow-down'" class="toggle-arrow"></i>
          </div>
        </div>
        <div v-if="isSubtitlesLoading && !subtitles.length && !scrollingSubtitlesCollapsed" class="subtitles-loading-placeholder">
          <i class="el-icon-loading"></i>
          <span>Loading subtitles...</span>
        </div>
        <div class="subtitles-container" v-if="subtitles.length && !scrollingSubtitlesCollapsed" ref="subtitlesContainer">
          <div class="subtitles-wrapper"
               v-show="!scrollingSubtitlesCollapsed"
               @mouseup="handleTextSelection"
               @touchend="handleTextSelection">
            <p v-for="(subtitle, index) in subtitles"
               :key="index"
               :class="getSubtitleClass(index)"
               :id="`subtitle-${index}`"
               @click="jumpToSubtitle(index)"
            >
              {{ subtitle.text }}
            </p>
            <div class="scroll-filler" v-if="subtitles.length > 0"></div>
          </div>
        </div>

        <!-- Enhanced Translated Subtitles Section -->
        <div class="translated-subtitles-header clickable-header" @click="toggleTranslatedSubtitles">
          <i class="el-icon-chat-dot-round"></i>
          <span>Translated Subtitles</span>
          <span v-if="isTranslationLoading" class="translation-status">
              <i class="el-icon-loading spinning"></i>
              <span class="streaming-text">Streaming...</span>
            </span>
          <div class="header-toggle-hint">
            <!-- Modified: Download subtitles as TXT in header - only show after translation completes -->
            <KiwiButton
                v-if="!isTranslationLoading && translatedSubtitles && !translatedSubtitlesCollapsed"
                type="success"
                :loading="isDownloading"
                icon="el-icon-download"
                size="mini"
                circle
                @click.stop="downloadTranslatedSubtitlesFromUI"
                class="header-action-btn"
                title="Download translated subtitles"
            />
            <i :class="translatedSubtitlesCollapsed ? 'el-icon-arrow-right' : 'el-icon-arrow-down'" class="toggle-arrow"></i>
          </div>
        </div>
        <div class="translated-subtitles-container" v-if="ifTranslation && (translatedSubtitles || isTranslationLoading || shouldShowTranslationContainer)">
          <div class="translated-subtitles-wrapper"
               v-show="!translatedSubtitlesCollapsed"
               ref="translatedSubtitlesWrapper"
               @mouseup="handleTextSelection"
               @touchend="handleTextSelection">
            <!-- Restore streaming indicator while translation is loading -->
            <div v-if="isTranslationLoading" class="translation-streaming-indicator">
              <div class="streaming-message">
                <i class="el-icon-loading spinning"></i>
                <span>Streaming translation...</span>
              </div>
              <div class="streaming-progress">
                <div class="streaming-bar">
                  <div class="streaming-fill" :style="{ width: translationProgress + '%' }"></div>
                </div>
                <span class="streaming-percentage">{{ Math.round(translationProgress) }}%</span>
              </div>
            </div>
            <div class="translation-content" v-html="parsedResponseText"></div>
          </div>
        </div>
      </div>

      <!-- Inline AI Search Dialog for selected text -->
      <ai-selection-popup
          :visible.sync="showSelectionPopup"
          :selected-text.sync="selectedText"
          :context-text="selectionContextText"
          title="AI Search"
          :auto-request="true"
          @open-ai-tab="onOpenAiTabFromPopup"
      />

      <!-- Gemini API Key Configuration Hint -->
      <GeminiApiKeyHint
        :visible.sync="showGeminiApiKeyHint"
        @switched-to-backend="onSwitchedToBackend"
      />

    </div>
  </div>
</template>

<script>
// Removed defineComponent import for Vue 2 options API
// import {defineComponent} from 'vue';
import {favoriteVideoByUrl, unfavoriteVideoByUrl, checkVideoFavoriteById, checkVideoFavoriteByUrl, fetchSubtitlesWithFallback} from '@/api/ai';
import msgUtil from '@/util/msg';
import kiwiConsts from '@/const/kiwiConsts'
import {getStore, setStore} from "@/util/store";
import MarkdownIt from 'markdown-it';
import NoSleep from 'nosleep.js';
import AiSelectionPopup from '@/page/ai/AiSelectionPopup.vue'
import { buildAiTabQuery } from '@/util/aiNavigation'
import { navigateIfChanged } from '@/util/routerUtil'
import { createAIStream, createYouTubeSubtitleStream } from '@/util/sseClient'
import { isGeminiEnabled } from '@/util/geminiClient'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiInput from '@/components/ui/KiwiInput.vue'
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'
import GeminiApiKeyHint from '@/components/common/GeminiApiKeyHint.vue'
import StatusService from '@/util/status-overlay-service'

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true
});

export default {
  name: 'YoutubeSubtitleDownloader',
  components: { AiSelectionPopup, KiwiButton, KiwiInput, KiwiDropdown, KiwiDropdownItem, GeminiApiKeyHint },
  data() {
    const persistedAutoCenter = getStore({ name: kiwiConsts.CONFIG_KEY.SUBTITLES_AUTO_CENTER });
    // Normalize stored translation toggle to an actual boolean; default OFF.
    const storedIfTranslationRaw = getStore({ name: kiwiConsts.CONFIG_KEY.IF_SUBTITLES_TRANSLATION });
    const normalizedIfTranslation = (() => {
      if (typeof storedIfTranslationRaw === 'boolean') return storedIfTranslationRaw;
      if (typeof storedIfTranslationRaw === 'string') {
        const v = storedIfTranslationRaw.toLowerCase();
        if (v === 'true') return true;
        if (v === 'false') return false;
      }
      return false; // default OFF
    })();
    return {
      loopEnabled: false,
      videoUrl: null,
      ifTranslation: normalizedIfTranslation,
      autoCenterEnabled: persistedAutoCenter !== false, // Default to true if not set
      selectedLanguage: getStore({name: kiwiConsts.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE}) || null,
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      // Split IDs: backend internal DB id vs YouTube 11-char id
      backendVideoId: null,
      // New: single favorite state for player view
      isFavorited: false,
      pendingFavorite: false,

      subtitles: [],
      translatedSubtitles: '',
      scrollingSubtitles: '',
      subtitlesType: null,
      statusMessage: '',
      isLoading: false,
      isSubtitlesLoading: false,
      subtitlesLoadingProgress: 0,
      subtitlesLoadingComplete: false,
      scrollingSubtitlesCollapsed: false,
      translatedSubtitlesCollapsed: false,
      player: null,
      currentSubtitleIndex: 0,
      subtitleInterval: null,
      middleControlEnabled: true,
      controlsCollapsed: false,
      isSmallScreen: false,
      selectedText: '',
      selectionContextText: '',
      // Use dialog instead of small bubble for selection actions and AI streaming
      showSelectionPopup: false,
      // AI search streaming state
      aiStreamAbort: null,
      aiResponseText: '',
      aiSearchLoading: false,
      aiIsStreaming: false,
      aiRequestId: '',
      aiLastError: '',
      // Gemini API key configuration hint
      showGeminiApiKeyHint: false,
      isPlaying: false,
      videoReady: false,
      // New: flag for YouTube IFrame API readiness
      youtubeApiReady: false,

      // SSE streaming (subtitles translation)
      subtitleEventSource: null, // EventSource for subtitle translation
      subtitleAbortFn: null, // Abort function for SSE stream
      sseUrl: '/api/ai/sse/ytb/subtitle',
      isTranslationLoading: false,
      translationProgress: 0,
      translationChunks: [],
      sseConnectionStatus: 'disconnected',
      streamingStartTime: null,
      streamingBuffer: '',
      shouldShowTranslationContainer: false,

      // SSE stability state
      sseReconnectTimer: null,
      sseReconnectAttempts: 0,
      sseShouldReconnect: false,
      sseSessionId: '',
      lastTranslationRequest: null,
      pageHidden: false,
      // New: strong dedupe key for in-flight translation
      currentTranslationKey: null,

      // Panel resize state
      isResizing: false,
      leftPanelPercent: 50,
      splitterMin: 25,
      splitterMax: 75,
    };
  },
  computed: {
    parsedResponseText() {
      return md.render(this.translatedSubtitles);
    },
    hasPreviousSubtitle() {
      return this.currentSubtitleIndex > 0;
    },
    hasNextSubtitle() {
      return this.currentSubtitleIndex < this.subtitles.length - 1;
    },
    ifProfessionalSubtitles() {
      return kiwiConsts.SUBTITLES_TYPE.LARGE_PROFESSIONAL_SRT_RETURN_LIST === this.subtitlesType
          || kiwiConsts.SUBTITLES_TYPE.SMALL_PROFESSIONAL_SRT_RETURN_STRING === this.subtitlesType;
    },
    showContextDisplay() {
      return this.subtitles.length &&
          (this.ifTranslation || (!this.ifTranslation && !this.ifProfessionalSubtitles));
    },
    hasSubtitles() {
      return this.subtitles.length > 0 || (this.ifTranslation && this.translatedSubtitles);
    },
    currentProgress() {
      return this.isTranslationLoading ? this.translationProgress : this.subtitlesLoadingProgress;
    },
    // Whether a video can be favorited: requires a valid URL or a player video id we can convert to URL
    canFavorite() {
      return !!(this.videoUrl && this.extractVideoId(this.videoUrl));
    },
    showMiniLoader() {
      return this.isLoading || !this.videoReady || this.isBuffering;
    },
    miniLoaderText() {
      if (this.isLoading && !this.videoReady) return 'Initializing...';
      if (this.isBuffering) return 'Buffering...';
      if (!this.videoReady) return 'Preparing...';
      return 'Loading...';
    },
    // Parsed AI response rendered as Markdown
    aiParsedResponseText() {
      const text = this.unescapeContent(this.aiResponseText || '');
      return md.render(text);
    },
  },
  watch: {

    '$route.query.videoUrl': {
      handler(newVideoUrl) {
        if (!newVideoUrl) return;
        const normalized = this.normalizeVideoUrl(newVideoUrl);
        if (normalized && normalized !== this.videoUrl) {
          this.videoUrl = normalized;
          this.loadContent();
        }
      }
    },
    // Accept internal DB id and optional raw YT id via query
    '$route.query.videoId': {
      handler(val) {
        if (val === undefined || val === null) return;
        const s = String(val);
        if (this.isLikelyYoutubeId(s)) {
          // In case deep-link sends a raw YouTube id
          this.videoUrl = `https://www.youtube.com/watch?v=${s}`;
          this.loadContent();
        } else {
          this.backendVideoId = s;
        }
      },
      immediate: true
    },
    '$route.query.dbId': {
      handler(val) {
        if (val === undefined || val === null) return;
        this.backendVideoId = String(val);
      },
      immediate: true
    },
    '$route.query.favorited': {
      handler(val) {
        if (val === undefined || val === null) return;
        const v = String(val).toLowerCase();
        this.isFavorited = v === 'true' || v === '1';
      },
      immediate: true
    },
    // When backend id becomes available later (e.g., from subtitles payload), re-check via ID
    backendVideoId(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.checkFavoriteStatus();
      }
    },
    currentSubtitleIndex(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$nextTick(() => {
          this.ensureActiveSubtitleVisibility();
          this.restartCurrentSubtitleAutoScroll();
        });
      }
    },
    leftPanelPercent: {
      handler(newVal) {
        // Update route query param on panel resize only when YouTube tab is active
        this.$nextTick(() => {
          const isYoutubeActive = (this.$route && this.$route.query && this.$route.query.active === 'youtube')
          if (!isYoutubeActive) return
          const q = { ...(this.$route.query || {}) };
          const newPercentStr = String(newVal);
          if (String(q.leftPanelPercent) !== newPercentStr) {
            this.$router.replace({ path: this.$route.path, query: { ...q, leftPanelPercent: newPercentStr } });
          }
        });
      },
      immediate: true
    }
  },
  mounted() {
    this.initializeComponent();

    const q = this.$route.query || {};
    const normalized = this.normalizeVideoUrl(q.videoUrl);
    if (normalized) {
      this.videoUrl = normalized;
      this.loadContent();
    } else if (q.videoId && this.isLikelyYoutubeId(String(q.videoId))) {
      // Fallback only if a raw YouTube id is provided
      const vid = String(q.videoId);
      this.videoUrl = `https://www.youtube.com/watch?v=${vid}`;
      this.loadContent();
    }

    // Initialize backend id and favorited from route once on mount
    if (q.videoId && !this.isLikelyYoutubeId(String(q.videoId))) {
      this.backendVideoId = String(q.videoId);
    }
    if (q.dbId) this.backendVideoId = String(q.dbId);
    if (q.favorited !== undefined) {
      const v = String(q.favorited).toLowerCase();
      this.isFavorited = v === 'true' || v === '1';
    }
  },
  // Reset overlay states when component is deactivated (keep-alive)
  deactivated() {
    this.subtitlesLoadingComplete = false;
    this.isSubtitlesLoading = false;
    this.isTranslationLoading = false;
  },
  beforeDestroy() {
    this.cleanup();
    // Ensure resize listeners are removed if user leaves mid-drag
    this.stopResize();
  },
  methods: {
    // Favorite toggle for player - always use video URL
    async toggleFavoriteOnPlayer() {
      if (!this.canFavorite || this.pendingFavorite) return;

      const prev = !!this.isFavorited;
      this.pendingFavorite = true;
      this.isFavorited = !prev; // optimistic update

      // Always construct URL from current state
      const fallbackUrl = this.videoUrl;

      try {
        if (!fallbackUrl || !this.extractVideoId(fallbackUrl)) {
          throw new Error('No valid video URL available');
        }

        const apiUrl = this.isFavorited ? favoriteVideoByUrl : unfavoriteVideoByUrl;
        const res = await apiUrl(fallbackUrl);
        const ok = !!(res && res.data && res.data.code === 1);
        if (!ok) {
          throw new Error((res && res.data && (res.data.msg || res.data.message)) || 'Favorite toggle failed');
        }

        // Success toast
        msgUtil.msgSuccess(this, this.isFavorited ? 'Added to favorites' : 'Removed from favorites', 1500);

        // Reflect back to route for consistency
        const q = { ...(this.$route.query || {}) };
        const newFavoritedStr = String(this.isFavorited);
        if (String(q.favorited) !== newFavoritedStr) {
          this.$router.replace({ path: this.$route.path, query: { ...q, favorited: newFavoritedStr } });
        }
      } catch (e) {
        // rollback
        this.isFavorited = prev;
        this.$message && this.$message.error ? this.$message.error(e.message || 'Failed to toggle favorite') : console.error(e);
      } finally {
        this.pendingFavorite = false;
      }
    },

    // Check favorite status using either backend ID or video URL
    async checkFavoriteStatus() {
      if (this.pendingFavorite) return; // don't override optimistic state

      let favorited = false;
      try {
        // Prefer backend ID when valid numeric ID is available
        const id = this.backendVideoId;
        const hasNumericId = id && /^\d+$/.test(String(id));
        if (hasNumericId) {
          const res = await checkVideoFavoriteById(id);
          if (res && res.data) {
            favorited = res.data.code === 1 ? !!res.data.data : false;
          }
        } else {
          const url = this.videoUrl;
          if (url && this.extractVideoId(url)) {
            const res = await checkVideoFavoriteByUrl(url);
            if (res && res.data) {
              favorited = res.data.code === 1 ? !!res.data.data : false;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to check favorite status:', e);
      }
      this.isFavorited = favorited;
    },

    // Initialization
    initializeComponent() {
      this.loadYouTubeAPI();
      this.setupEventListeners();
      this.checkScreenSize();
      this.applyTouchPreventions();
      this.updateDisplayStyle();
      // Prepare NoSleep instance for iOS
      try { this.noSleep = new NoSleep(); } catch (_) { this.noSleep = null; }
    },

    setupEventListeners() {
      document.addEventListener('click', this.handleClickOutside);
      window.addEventListener('resize', this.debounce(this.checkScreenSize, 250));
      window.addEventListener('resize', this.debounce(this.updateDisplayStyle, 250));
      // Background/visibility and network stability handlers
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      window.addEventListener('pagehide', this.onPageHide);
      window.addEventListener('pageshow', this.onPageShow);
      window.addEventListener('online', this.onOnline);
      window.addEventListener('offline', this.onOffline);
    },

    cleanup() {
      // Global cleanup (component destroy)
      this.stopSubtitleSync();
      this.disconnectSSE();
      this.clearPlayerInitTimeout && this.clearPlayerInitTimeout();
      if (this.player) {
        try { this.player.destroy(); } catch(_) {}
        this.player = null;
      }
      if (this.miniLoaderInterval) {
        clearInterval(this.miniLoaderInterval);
        this.miniLoaderInterval = null;
      }
      document.removeEventListener('click', this.handleClickOutside);
      window.removeEventListener('resize', this.checkScreenSize);
      window.removeEventListener('resize', this.updateDisplayStyle);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      window.removeEventListener('pagehide', this.onPageHide);
      window.removeEventListener('pageshow', this.onPageShow);
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
      this.disableNoSleep();
      this.closeAiStream();
    },

    // Player-only cleanup used per video load
    cleanupPlayer() {
      this.stopSubtitleSync();
      this.clearPlayerInitTimeout && this.clearPlayerInitTimeout();
      if (this.player) {
        try { this.player.destroy(); } catch(_) {}
        this.player = null;
      }
      if (this.miniLoaderInterval) {
        clearInterval(this.miniLoaderInterval);
        this.miniLoaderInterval = null;
      }
      this.stopMiniLoaderPoll && this.stopMiniLoaderPoll();
    },

    clearPlayerInitTimeout() {
      if (this.playerInitTimeout) {
        clearTimeout(this.playerInitTimeout);
        this.playerInitTimeout = null;
      }
    },

    setPlayerInitTimeout() {
      this.clearPlayerInitTimeout();
      this.playerInitTimeout = setTimeout(() => {
        if (!this.videoReady) {
          console.warn('[YoutubePlayer] Player init timeout');
          this.statusMessage = 'Player init timeout';
          this.isLoading = false;
          this.stopMiniLoaderPoll && this.stopMiniLoaderPoll();
        }
      }, 10000);
    },

    // Simple debounce helper
    debounce(fn, wait = 200) {
      let t = null;
      return (...args) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    checkScreenSize() {
      try {
        this.isSmallScreen = window.innerWidth <= 767;
      } catch (_) { /* no-op */ }
    },

    updateDisplayStyle() {
      // Hook to adjust responsive styles; kept as no-op for now
    },

    applyTouchPreventions() {
      // Hook to adjust touch behaviors on iOS/Safari; kept lightweight
    },

    // Visibility and network handlers
    onVisibilityChange() {
      this.pageHidden = document.hidden;
      if (!this.pageHidden) {
        // On becoming visible, if translation was in progress and SSE is down, try to resume
        if (this.isTranslationLoading && !this.subtitleEventSource) {
          this.scheduleReconnect(200);
        }
      }
    },
    onPageHide() {
      // Browsers may suspend timers; keep minimal state; we'll resume on pageshow
    },
    onPageShow() {
      if (this.isTranslationLoading && !this.subtitleEventSource) {
        this.scheduleReconnect(200);
      }
    },
    onOnline() {
      if (this.isTranslationLoading) {
        this.scheduleReconnect(100);
      }
    },
    onOffline() {
      // Optional: surface a compact notice
      try { msgUtil.msgError(this, 'You are offline. Translation will resume when back online.', 2000); } catch (_) {}
    },

    isSafariOrIOS() {
      if (typeof navigator === 'undefined') return false;
      const ua = navigator.userAgent || '';
      return /Safari\//.test(ua) && !/Chrome\//.test(ua) || /iPhone|iPad|iPod/i.test(ua);
    },

    isMobileDevice() {
      if (typeof navigator === 'undefined') return false;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    },

    // SSE streaming for subtitle translation
    disconnectSSE() {
      if (this.subtitleEventSource) {
        try { this.subtitleEventSource.close(); } catch (_) {}
        this.subtitleEventSource = null;
        this.sseConnectionStatus = 'disconnected';
      }
      if (this.subtitleAbortFn) {
        try { this.subtitleAbortFn(); } catch (_) {}
        this.subtitleAbortFn = null;
      }
      if (this._translationAbort) {
        try { this._translationAbort(); } catch (_) {}
        this._translationAbort = null;
      }
      if (this.sseReconnectTimer) {
        clearTimeout(this.sseReconnectTimer);
        this.sseReconnectTimer = null;
      }
    },

    handleSSEError(error, message) {
      console.error('SSE error:', error);
      // Avoid noisy toasts if we already have translated content or not actively loading
      if (this.isTranslationLoading || !this.translatedSubtitles) {
        msgUtil.msgError(this, message, 3000);
      } else {
        console.warn('Suppressing SSE error toast because content is already present.');
      }
    },

    handleTranslationStarted() {
      this.isTranslationLoading = true;
      this.translationProgress = 0;
      this.translationChunks = [];
      this.translatedSubtitles = '';
      this.streamingStartTime = Date.now();
      this.streamingBuffer = '';
      this.shouldShowTranslationContainer = true;
      this.translatedSubtitlesCollapsed = false; // Keep expanded during streaming
      this.sseShouldReconnect = true;
      if (this.noSleep && this.isSafariOrIOS()) {
        // Best-effort: enable wake lock-like behavior on mobile Safari
        try { this.noSleep.enable(); } catch (_) {}
      }

      this.startProgressAnimation();
    },

    handleTranslationChunk(chunk) {
      if (!chunk) return;

      // Process chunk to handle newlines before adding to array
      const processedChunk = chunk.replace(/\\n|\n/g, '<br>');
      // Basic de-duplication to mitigate reconnect overlap
      const tail = this.translatedSubtitles.slice(-500);
      if (tail && processedChunk && tail.includes(processedChunk)) {
        return;
      }
      this.translationChunks.push(processedChunk);
      this.translatedSubtitles = this.translationChunks.join('');

      // Smooth progress updates
      this.translationProgress = Math.min(
          (this.translationChunks.length / Math.max(this.translationChunks.length * 1.2, 20)) * 95,
          95
      );

      // Optimized auto-scroll to show streaming content
      this.debouncedScrollToBottom();
    },

    handleTranslationCompleted(response) {
      this.isTranslationLoading = false;
      this.translationProgress = 100;
      this.subtitlesLoadingComplete = true;
      this.sseShouldReconnect = false;
      this.currentTranslationKey = null;
      this.subtitleEventSource = null;

      if (response.fullResponse) {
        this.translatedSubtitles = response.fullResponse;
      }

      this.stopProgressAnimation();
      msgUtil.msgSuccess(this, 'Translation completed successfully!', 2000);

      this.$nextTick(() => {
        this.applyTouchPreventions();
      });

      this.disableNoSleep();
    },

    handleTranslationError(response) {
      // Guard against stale errors after a successful session
      if (!this.isTranslationLoading && this.translatedSubtitles) {
        console.warn('Ignoring stale translation error after completion:', response);
        return;
      }

      this.isTranslationLoading = false;
      this.translationProgress = 0;
      this.subtitlesLoadingComplete = true;
      this.shouldShowTranslationContainer = false; // Hide container on error
      this.sseShouldReconnect = false;
      this.currentTranslationKey = null;
      this.subtitleEventSource = null;

      this.stopProgressAnimation();

      let errorMessage = response.message || 'Translation failed';
      if (response.errorCode === 'AUTHENTICATION_ERROR' || response.errorCode === 'UNAUTHORIZED') {
        errorMessage = 'Authentication failed. Please login again.';
        try {
          const kiwiConsts = require('@/const/kiwiConsts').default
          const target = `${kiwiConsts.ROUTES.DETAIL}?active=login`
          this.$router.replace(target).catch(()=>{})
        } catch (e) { /* ignore */ }
      } else if (response.errorCode === 'RATE_LIMIT_EXCEEDED') {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }

      msgUtil.msgError(this, errorMessage, 3000);
      this.disableNoSleep();
    },

    async requestTranslation(videoUrl, language) {
      if (!videoUrl || !language) return;

      // Build a stable key for this translation request
      const buildKey = (url, lang) => {
        const id = this.extractVideoId(url) || url;
        return `${id}::${lang}`;
      };
      const key = buildKey(videoUrl, language);

      // Strong dedupe: if same request is already in-flight, skip
      if (this.isTranslationLoading && this.currentTranslationKey === key) {
        console.log('[YoutubePlayer] Skipping duplicate translation request for key', key);
        return;
      }

      this.currentTranslationKey = key;

      // Set loading state immediately to block concurrent requests
      this.isTranslationLoading = true;
      this.shouldShowTranslationContainer = true;
      this.translatedSubtitlesCollapsed = false;

      // If direct Gemini is enabled and subtitles are loaded, stream translation directly
      if (isGeminiEnabled() && this.subtitles.length > 0) {
        this.requestTranslationDirect(language);
        return;
      }

      // Fallback: backend SSE
      this.requestTranslationBackend(videoUrl, language);
    },

    // Direct Gemini streaming translation — chunks appear in real time
    requestTranslationDirect(language) {
      this.disconnectSSE();
      this.handleTranslationStarted();

      // Build subtitle text lines from parsed subtitles
      const subtitleLines = this.subtitles.map(s => s.text).join('\n');

      const targetLanguage = getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || 'EN';
      const nativeLanguage = language;

      const { abort } = createAIStream({
        body: {
          prompt: subtitleLines,
          promptMode: 'subtitle-translator',
          targetLanguage,
          nativeLanguage,
          timestamp: Date.now()
        },
        callbacks: {
          onStarted: () => {},
          onChunk: (chunk) => {
            this.handleTranslationChunk(chunk);
          },
          onCompleted: (data) => {
            this.handleTranslationCompleted(data);
          },
          onError: (error) => {
            this.handleTranslationError(error);
          }
        }
      });

      // Store abort function so disconnectSSE can cancel it
      this._translationAbort = abort;
    },

    // Backend SSE translation (original path)
    requestTranslationBackend(videoUrl, language) {
      // Generate session ID early
      this.sseSessionId = 'sse_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      this.sseShouldReconnect = true;

      // Update last request immediately to prevent race conditions
      this.lastTranslationRequest = { videoUrl, language, requestType: 'translated', sessionId: this.sseSessionId };

      // Close any existing SSE connection
      this.disconnectSSE();

      // Create SSE stream using EventSource
      const { eventSource, close } = createYouTubeSubtitleStream({
        videoUrl,
        language,
        requestType: 'translated',
        callbacks: {
          onStarted: (data) => {
            console.log('SSE started:', data.message);
            this.handleTranslationStarted();
          },
          onProgress: (data) => {
            console.log(`Progress: ${data.currentStep}/${data.totalSteps} - ${data.currentStepDescription}`);
          },
          onChunk: (chunk) => {
            this.handleTranslationChunk(chunk);
          },
          onCompleted: (data) => {
            this.handleTranslationCompleted(data);
          },
          onError: (error) => {
            this.handleTranslationError(error);
          },
          onConnectionError: (message) => {
            // Connection error - may auto-reconnect
            console.warn('SSE connection error:', message);
            if (this.isTranslationLoading && this.sseShouldReconnect) {
              this.scheduleReconnect();
            }
          }
        }
      });

      this.subtitleEventSource = eventSource;

      if (!eventSource) {
        this.handleSSEError(new Error('Failed to create SSE stream'), 'Failed to start translation');
        this.isTranslationLoading = false;
        this.subtitlesLoadingComplete = true;
        this.shouldShowTranslationContainer = false;
        this.sseShouldReconnect = false;
        this.currentTranslationKey = null;
        this.disableNoSleep();
      }
    },

    // Reconnect with incremental backoff and resume request
    scheduleReconnect(initialDelay) {
      if (!this.sseShouldReconnect) return;
      if (this.sseReconnectTimer) return;
      const attempt = ++this.sseReconnectAttempts;
      const delay = typeof initialDelay === 'number' ? initialDelay : Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      this.sseReconnectTimer = setTimeout(() => {
        this.sseReconnectTimer = null;
        if (this.lastTranslationRequest && this.isTranslationLoading) {
          // Re-initiate the request
          this.requestTranslation(
            this.lastTranslationRequest.videoUrl,
            this.lastTranslationRequest.language
          );
        }
      }, delay);
    },

    // Optimized progress animation
    startProgressAnimation() {
      if (this.progressUpdateInterval) return;

      this.progressUpdateInterval = setInterval(() => {
        if (this.isTranslationLoading && this.translationProgress < 90) {
          this.translationProgress += Math.random() * 2;
        }
      }, 100);
    },

    stopProgressAnimation() {
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    },

    // Optimized player management
    async reinitializePlayer() {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
      await this.initializePlayer();
    },

    // Load the YouTube IFrame API and mark readiness
    loadYouTubeAPI() {
      // If API already present, mark ready immediately
      if (window.YT && window.YT.Player) {
        this.youtubeApiReady = true;
        return;
      }

      if (!document.getElementById('youtube-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      // Assign or wrap the global callback to update readiness state
      const self = this;
      const prevCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function() {
        self.youtubeApiReady = true;
        if (typeof prevCb === 'function') {
          try { prevCb(); } catch (e) { /* no-op */ }
        }
      };
    },

    // Wait until the YouTube API is ready (or timeout)
    ensureYouTubeAPIReady(timeout = 15000) {
      if (this.youtubeApiReady || (window.YT && window.YT.Player)) {
        this.youtubeApiReady = true;
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          if (this.youtubeApiReady || (window.YT && window.YT.Player)) {
            this.youtubeApiReady = true;
            resolve();
          } else if (Date.now() - start >= timeout) {
            reject(new Error('YouTube API failed to load in time'));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    },

    async initializePlayer(videoId) {
      return new Promise((resolve) => {
        console.log('[YoutubePlayer] initializePlayer videoId=', videoId);
        this.player = new YT.Player('youtube-player-container', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: { playsinline: 1, rel: 0, autoplay: 0 },
          events: {
            onReady: (event) => { this.onPlayerReady(event); resolve(); },
            onStateChange: this.onPlayerStateChange
          }
        });
        this.setPlayerInitTimeout();
      });
    },

    onPlayerReady(event) {
      console.log('[YoutubePlayer] onPlayerReady');
      this.videoReady = true;
      this.isBuffering = false;
      this.stopMiniLoaderPoll && this.stopMiniLoaderPoll();
      this.clearPlayerInitTimeout && this.clearPlayerInitTimeout();
      this.statusMessage = '';
      this.isLoading = false;
      msgUtil.msgSuccess(this, 'Video ready to play!', 2000);
      // Start continuous subtitle sync so index updates during play, pause, and seeks.
      this.startSubtitleSync();
    },

    onPlayerStateChange(event) {
      const isPlaying = event.data === YT.PlayerState.PLAYING;
      this.isPlaying = isPlaying;

      if (event.data === YT.PlayerState.BUFFERING) {
        this.isBuffering = true;
        this.startMiniLoaderPoll();
      } else if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        this.isBuffering = false;
        if (this.getLoadedFraction() >= 1) this.stopMiniLoaderPoll();
      }

      // Handle video loop when video ends
      if (event.data === YT.PlayerState.ENDED && this.loopEnabled) {
        this.$nextTick(() => {
          if (this.player && typeof this.player.seekTo === 'function') {
            this.player.seekTo(0, true);
            this.player.playVideo();
          }
        });
      }

      if (isPlaying) {
        // Re-run auto scroll logic for active subtitle on resume.
        // Auto-collapse controls on small screens when playback starts
        if (this.isSmallScreen) {
          this.controlsCollapsed = true;
        }
        this.$nextTick(() => this.restartCurrentSubtitleAutoScroll());
      } else {
        // Keep sync interval running so seeking while paused updates currentSubtitleIndex.
        this.stopCurrentSubtitleAutoScroll();
      }
    },

    // Optimized content loading
    async loadContent() {
      if (this.isInitializing) {
        console.log('[YoutubePlayer] loadContent skipped: already initializing');
        return;
      }
      this.isInitializing = true;
      this._suppressVideoIdWatcher = true;
      this.resetStates();
      try {
        console.log('[YoutubePlayer] loadContent start videoUrl=', this.videoUrl);
        const normalizedUrl = this.normalizeVideoUrl(this.videoUrl) || null;
        if (normalizedUrl) this.videoUrl = normalizedUrl;
        
        const videoId = this.videoUrl ? this.extractVideoId(this.videoUrl) : (this.isLikelyYoutubeId(this.videoUrl) ? this.videoUrl : null);
        
        if (!videoId) {
          this.statusMessage = 'Invalid YouTube URL';
          this.isLoading = false;
          return;
        }

        try {
          const isYoutubeActive = (this.$route && this.$route.query && this.$route.query.active === 'youtube');
          if (isYoutubeActive) {
            const q = { ...(this.$route.query || {}) };
            const encoded = encodeURIComponent(this.videoUrl);
            if (q.videoUrl !== encoded) {
              this.$router.replace({ path: this.$route.path, query: { ...q, videoUrl: encoded } });
            }
          }
        } catch (_) {}
        this.checkFavoriteStatus();
        this.statusMessage = 'Initializing player...';
        this.startMiniLoaderPoll && this.startMiniLoaderPoll();

        // Start subtitle loading in parallel with player initialization
        // (subtitle API only needs videoUrl, not the player)
        this.loadSubtitlesInBackground();

        await this.ensureYouTubeAPIReady();

        if (this.player) {
          console.log('[YoutubePlayer] Reuse existing player loadVideoById', videoId);
          try {
            this.player.loadVideoById(videoId);
            this.setPlayerInitTimeout();
          } catch(e) {
            console.warn('[YoutubePlayer] loadVideoById failed, fallback initializePlayer', e);
            await this.initializePlayer(videoId);
          }
        } else {
          await this.initializePlayer(videoId);
        }

        this.isLoading = false; // may already be false after onReady
        if (!this.videoReady) {
          // onReady not fired yet; keep status if still initializing
          console.log('[YoutubePlayer] waiting for onReady...');
        } else {
          this.statusMessage = ''; // ensure cleared
        }
        console.log('[YoutubePlayer] loadContent success');
      } catch (error) {
        console.error('Error loading content:', error);
        this.statusMessage = error && error.message ? error.message : 'Failed to load content';
        this.isLoading = false;
      } finally {
        this.isInitializing = false;
        this._suppressVideoIdWatcher = false;
      }
    },

    resetStates() {
      StatusService.closeAll();
      this.cleanupPlayer && this.cleanupPlayer();
      this.sseShouldReconnect = false; // Prevent reconnects during reset
      this.disconnectSSE(); // Ensure previous connection is closed
      this.isLoading = true;
      this.videoReady = false;
      this.subtitles = [];
      this.translatedSubtitles = '';
      this.scrollingSubtitles = '';
      this.currentSubtitleIndex = -1;
      this.isSubtitlesLoading = false;
      this.isTranslationLoading = false;
      this.subtitlesLoadingComplete = false;
      this.subtitlesLoadingProgress = 0;
      this.translationProgress = 0;
      this.translationChunks = [];
      this.shouldShowTranslationContainer = false;
      this.statusMessage = 'Loading video...';
      this.miniLoaderPercent = 0;
      this.isBuffering = false;
      this.currentTranslationKey = null;

      // Reset inline AI search state
      this.closeAiStream(true);
      this.aiResponseText = '';
      this.aiLastError = '';
      this.stopCurrentSubtitleAutoScroll();
    },

    async loadSubtitlesInBackground() {
      if (!this.videoUrl) return;

      this.isSubtitlesLoading = true;
      this.subtitlesLoadingComplete = false;
      this.subtitlesLoadingProgress = 0;

      // Show StatusOverlay progress hint
      const statusHandle = StatusService.loading({ title: 'Loading subtitles...' });

      // Start progress animation
      const progressInterval = setInterval(() => {
        if (this.subtitlesLoadingProgress < 90) {
          this.subtitlesLoadingProgress += Math.random() * 15;
        }
      }, 200);

      try {
        const apiCall = () => fetchSubtitlesWithFallback(this.videoUrl);
        const response = await this.retryApiCall(apiCall);

        if (response.status === 'fulfilled' && response.value?.status === 200) {
          // Support both legacy string and new object payloads.
          const payload = response.value?.data?.data;
          let subtitlesStr = '';

          if (payload && typeof payload === 'object') {
            // Try common fields for subtitles string
            subtitlesStr = payload.scrollingSubtitles || payload.subtitles || payload.content || '';

            // Extract backend/internal video id for favorite feature
            const maybeId = payload.id || payload.videoId || payload.dbId;
            if (maybeId && !this.backendVideoId) {
              this.backendVideoId = String(maybeId);
            }

            // Extract raw YouTube video id if provided
            const maybeYtId = payload.youtubeVideoId || payload.ytId || payload.ytbId;
            if (maybeYtId && this.isLikelyYoutubeId(String(maybeYtId))) {
              // We already have videoUrl, so we don't need to set playerVideoId
            }

            // Initialize favorited status if returned from server
            if (typeof payload.favorited !== 'undefined') {
              this.isFavorited = !!payload.favorited;
            }
          } else {
            // Backward-compatible: payload is the raw subtitles string
            subtitlesStr = typeof payload === 'string' ? payload : '';
          }

          this.scrollingSubtitles = subtitlesStr;
          this.parseSubtitles(this.scrollingSubtitles || '');

          clearInterval(progressInterval);
          this.subtitlesLoadingProgress = 100;
          this.isSubtitlesLoading = false;
          this.middleControlEnabled = true;

          // Close loading overlay and show success
          statusHandle.close();
          StatusService.success({ title: 'Subtitles loaded' });

          this.$nextTick(() => {
            this.applyTouchPreventions();
          });

          // Start translation if enabled
          if (this.ifTranslation && this.selectedLanguage) {
            await this.requestTranslation(this.videoUrl, this.selectedLanguage);
          } else {
            this.subtitlesLoadingComplete = true;
          }
        } else {
          this.handleSubtitlesError(progressInterval, statusHandle, response.reason);
        }
      } catch (error) {
        this.handleSubtitlesError(progressInterval, statusHandle, error);
      }
    },

    handleSubtitlesError(progressInterval, statusHandle, error) {
      clearInterval(progressInterval);
      this.isSubtitlesLoading = false;
      this.subtitlesLoadingComplete = true;
      this.subtitlesLoadingProgress = 0;

      // Close loading overlay and show error
      if (statusHandle) statusHandle.close();
      StatusService.error({ title: 'Failed to load subtitles', message: error?.message || '' });

      console.error('Error loading subtitles:', error);
    },

    async retryApiCall(apiCall, maxRetries = 3) {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await apiCall();
          return { status: 'fulfilled', value: result };
        } catch (error) {
          lastError = error;
          console.warn(`API call attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      return { status: 'rejected', reason: lastError };
    },

    // Optimized subtitle management
    parseSubtitles(scrollingSubtitles) {
      const lines = scrollingSubtitles.split('\n').filter(line => line.trim());
      const rawSubtitles = [];
      let currentSubtitle = null;
      let parsingCue = false;

      // Relaxed regex to match both VTT (dot) and SRT (comma) formats, and varying digits
      const timeRegex = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s+-->\s+(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/;

      for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
          if (currentSubtitle && currentSubtitle.text) rawSubtitles.push(currentSubtitle);

          currentSubtitle = {
            start: this.parseTime(match[1]),
            end: this.parseTime(match[2]),
            text: ''
          };
          parsingCue = true;
        } else if (parsingCue && line.trim()) {
          // Skip index numbers often found in SRT files (lines that are just digits)
          if (/^\d+$/.test(line.trim())) continue;

          const cleaned = this.cleanSubtitleText(line.trim());
          if (cleaned) {
            currentSubtitle.text += (currentSubtitle.text ? '\n' : '') + cleaned;
          }
        } else if (line.trim() === '' && parsingCue) {
          parsingCue = false;
        }
      }

      if (currentSubtitle && currentSubtitle.text) rawSubtitles.push(currentSubtitle);

      // Post-process to fix short durations and gaps
      const processedSubtitles = [];
      for (let i = 0; i < rawSubtitles.length; i++) {
        const sub = rawSubtitles[i];
        const next = rawSubtitles[i + 1];
        const duration = sub.end - sub.start;

        // If subtitle is extremely short (likely a marker), try to merge or extend
        if (duration < 0.2) {
          if (next && (next.start - sub.start) < 0.5) {
            // Merge with next if it starts very soon
            next.text = sub.text + (next.text ? '\n' + next.text : '');
            next.start = sub.start; // Adopt start time
            // Skip adding this subtitle, effectively merging it into next
            continue;
          } else if (next) {
            // Otherwise extend to next subtitle's start
            sub.end = next.start;
          } else {
            // Last subtitle, give it a default duration
            sub.end = sub.start + 3.0;
          }
        }

        // Ensure strict non-overlapping with the next subtitle
        // This fixes the issue where the index gets stuck on the previous subtitle
        if (next && sub.end > next.start) {
          sub.end = next.start;
        }

        // Only add valid subtitles with positive duration
        if (sub.end > sub.start) {
          processedSubtitles.push(sub);
        }
      }

      this.subtitles = processedSubtitles;
    },

    cleanSubtitleText(text) {
      if (!text) return '';
      // Decode HTML entities and remove common artifacts
      let cleaned = text
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

      // Remove leading speaker indicators like ">> "
      cleaned = cleaned.replace(/^>>\s*/, '');

      return cleaned.trim();
    },

    parseTime(timeStr) {
      if (!timeStr) return 0;
      // Normalize comma to dot for standard parsing
      const normalized = timeStr.replace(',', '.');
      const parts = normalized.split(':');
      
      if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
      } else if (parts.length === 2) {
        // Handle MM:SS.mmm format if present
        const [minutes, seconds] = parts;
        return parseFloat(minutes) * 60 + parseFloat(seconds);
      }
      return 0;
    },

    // Optimized subtitle sync
    startSubtitleSync() {
      this.stopSubtitleSync();
      this.subtitleInterval = setInterval(() => {
        this.updateCurrentSubtitle();
      }, 100);
      this.$nextTick(() => {
        this.ensureActiveSubtitleVisibility();
        this.restartCurrentSubtitleAutoScroll();
      });
    },

    stopSubtitleSync() {
      if (this.subtitleInterval) {
        clearInterval(this.subtitleInterval);
        this.subtitleInterval = null;
      }
      this.stopCurrentSubtitleAutoScroll();
    },

    updateCurrentSubtitle() {
      if (!this.player || !this.subtitles.length) return;

      const currentTime = this.player.getCurrentTime();
      const newIndex = this.subtitles.findIndex(subtitle =>
          currentTime >= subtitle.start && currentTime < subtitle.end
      );

      // When newIndex is -1 (gap between subtitles / speaker pause),
      // keep the last active subtitle to prevent jumping to the first line
      if (newIndex !== -1 && newIndex !== this.currentSubtitleIndex) {
        this.currentSubtitleIndex = newIndex;
      }
    },

    // Optimized scrolling
    debouncedScrollToBottom() {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      this.scrollTimeout = setTimeout(() => {
        const translationWrapper = this.$refs.translatedSubtitlesWrapper;
        if (translationWrapper && !this.translatedSubtitlesCollapsed) {
          translationWrapper.scrollTop = translationWrapper.scrollHeight;
        }
      }, 50); // Reduced delay for more responsive streaming
    },

    // UI event handlers
    jumpToSubtitle(index) {
      if (!this.player || !this.subtitles[index]) return;
      this.player.seekTo(this.subtitles[index].start, true);
      if (this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
        this.player.playVideo();
      }
      this.currentSubtitleIndex = index; // triggers watcher
      this.$nextTick(() => {
        this.ensureActiveSubtitleVisibility();
        this.restartCurrentSubtitleAutoScroll();
      });
    },

    // Handle Open in AI Tab from shared popup
    onOpenAiTabFromPopup(payload) {
      const text = (payload && payload.text) ? String(payload.text).trim() : (this.selectedText || '').trim();
      if (!text) return;
      try { this.closeAiStream(true); } catch (_) {}
      const overrides = {
        ...(payload?.query || {}),
        active: 'search',
        selectedMode: kiwiConsts.SEARCH_AI_MODES.TRANSLATION_AND_EXPLANATION.value,
        ytbMode: (this.$route && this.$route.query && this.$route.query.ytbMode)
            ? this.$route.query.ytbMode
            : kiwiConsts.YTB_MODE.CHANNEL
      };
      if (this.selectedLanguage) {
        overrides.language = this.selectedLanguage;
      }
      const query = buildAiTabQuery({ text, route: this.$route, overrides, preserveKeys: ['source', 'ytbMode'] });
      const target = { path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL, query };
      navigateIfChanged(this.$router, this.$route, target).finally(() => { this.showSelectionPopup = false; });
    },

    pauseVideo() {
      if (this.player && typeof this.player.pauseVideo === 'function') {
        this.player.pauseVideo();
      }
    },

    // Clear subtitles and translation content
    cleanSubtitles() {
      this.subtitles = [];
      this.translatedSubtitles = '';
      this.scrollingSubtitles = '';
      this.currentSubtitleIndex = -1;
      this.subtitlesLoadingComplete = false;
      this.isSubtitlesLoading = false;
      this.isTranslationLoading = false;
      this.translationProgress = 0;
      this.translationChunks = [];
      this.currentTranslationKey = null;
      msgUtil.msgSuccess(this, 'Cleared subtitles', 1200);
    },

    // Text selection and AI dialog
    handleTextSelection(event) {
      this.pauseVideo();
      this.showQueryingWords(event);
    },

    handleTextSelectionWithPausing(event) {
      // Kept for explicit call sites; ensure pause happens first
      this.pauseVideo();
      this.handleTextSelection(event);
    },

    showQueryingWords(event) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        // Capture context from the container where the selection happened
        this.selectionContextText = this.getSubtitleContext(selection);
        // Ensure video is paused before showing popup
        this.pauseVideo();
        // Open inline AI dialog directly instead of navigating
        this.showSelectionPopup = true;
      } else {
        this.closePopup();
      }
    },

    // Build context string from the container that holds the selection
    getSubtitleContext(selection) {
      if (!selection || !selection.rangeCount) return '';
      const range = selection.getRangeAt(0);
      const ancestor = range.commonAncestorContainer;
      // Check translated subtitles wrapper
      const translatedEl = this.$refs.translatedSubtitlesWrapper;
      if (translatedEl && translatedEl.contains(ancestor)) {
        return (translatedEl.innerText || '').trim();
      }
      // Check scrolling subtitles container
      const subtitlesEl = this.$refs.subtitlesContainer;
      if (subtitlesEl && subtitlesEl.contains(ancestor)) {
        return this.subtitles.map(s => s.text).join(' ');
      }
      // Fallback: use nearby subtitle lines for context display area
      return this.getSurroundingSubtitleText();
    },

    // Get surrounding subtitle text as context
    getSurroundingSubtitleText() {
      if (!this.subtitles.length || this.currentSubtitleIndex < 0) return '';
      const idx = this.currentSubtitleIndex;
      const lines = [];
      if (idx > 0) lines.push(this.subtitles[idx - 1].text);
      lines.push(this.subtitles[idx].text);
      if (idx < this.subtitles.length - 1) lines.push(this.subtitles[idx + 1].text);
      return lines.join(' ');
    },

    // Open AI popup with specific subtitle text
    openAiPopupWithSubtitle(text) {
      const trimmedText = (text || '').trim();
      if (!trimmedText) {
        msgUtil.msgWarning(this, 'No subtitle text available');
        return;
      }

      // Pause video before opening popup
      this.pauseVideo();

      // Set selected text and surrounding subtitles as context
      this.selectedText = trimmedText;
      this.selectionContextText = this.getSurroundingSubtitleText();
      this.showSelectionPopup = true;
    },

    // Inline AI search
    aiSearchSelectedText() {
      const text = (this.selectedText || '').trim();
      if (!text) {
        this.aiLastError = 'No text selected';
        return;
      }
      // Determine mode based on single-word detection
      const isSingle = this.isSingleWord(text);
      const promptMode = isSingle
          ? kiwiConsts.SEARCH_AI_MODES.VOCABULARY_EXPLANATION.value
          : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value;
      const targetLanguage = getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese;
      const nativeLanguage = getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese;
      this.startAiStreaming({ prompt: text, promptMode, targetLanguage, nativeLanguage });
    },

    startAiStreaming({ prompt, promptMode, targetLanguage, nativeLanguage }) {
      // Reset state
      this.aiLastError = '';
      this.aiResponseText = '';
      this.aiSearchLoading = true;
      this.aiIsStreaming = true;
      this.aiRequestId = this.generateRequestId();

      // Close any existing AI stream
      this.closeAiStream(true);

      // Create SSE stream for AI
      const { abort } = createAIStream({
        body: {
          prompt,
          promptMode,
          targetLanguage,
          nativeLanguage,
          timestamp: Date.now(),
          requestId: this.aiRequestId
        },
        callbacks: {
          onStarted: () => {
            this.aiIsStreaming = true;
          },
          onChunk: (chunk) => {
            if (chunk) {
              this.aiResponseText += chunk;
            }
          },
          onCompleted: (response) => {
            this.aiIsStreaming = false;
            this.aiSearchLoading = false;
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0)
                  ? response.fullResponse
                  : this.aiResponseText;
              const extracted = this.extractResponseTextFromPayload(finalPayload);
              this.aiResponseText = (typeof extracted === 'string' && extracted.length > 0)
                  ? extracted
                  : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload));
            } catch (_) {
              if (response.fullResponse) {
                this.aiResponseText = response.fullResponse;
              }
            }
            this.aiStreamAbort = null;
          },
          onError: (error) => {
            this.handleAiStreamError((error.message || 'AI streaming failed') + (error.errorCode ? ` (Code: ${error.errorCode})` : ''), error.errorCode);
          }
        }
      });

      this.aiStreamAbort = abort;
    },

    handleAiStreamError(message, errorCode) {
      this.aiSearchLoading = false;
      this.aiIsStreaming = false;
      try { if (this.aiStreamAbort) { this.aiStreamAbort(); } } catch (_) {}
      this.aiStreamAbort = null;

      // Check if this is a Gemini API key configuration error
      if (errorCode === 'NO_API_KEY') {
        this.showGeminiApiKeyHint = true;
        return;
      }

      this.aiLastError = message || 'AI streaming error';
      msgUtil.msgError(this, this.aiLastError);
    },

    // Called when user switches to backend API from the GeminiApiKeyHint dialog
    onSwitchedToBackend() {
      // Retry the AI request with the current selected text
      if (this.selectedText && this.selectedText.trim()) {
        this.$nextTick(() => {
          this.aiSearchSelectedText();
        });
      }
    },

    closeAiStream(silent) {
      try { if (this.aiStreamAbort) { this.aiStreamAbort(); } } catch (_) {}
      this.aiStreamAbort = null;
      this.aiSearchLoading = false;
      this.aiIsStreaming = false;
      if (!silent) {
        this.aiLastError = '';
      }
    },

    // Dialog controls
    closePopup() {
      // Stop streaming and reset transient state; keep selectedText for convenience
      this.closeAiStream(true);
      this.showSelectionPopup = false;
      // Do not clear selectedText so user can re-open and search again quickly
    },

    handleClickOutside(event) {
      // No-op: dialog controls visibility; outside clicks are handled by Element UI overlay
    },

    // UI state management
    getSubtitleClass(index) {
      return {
        'active-subtitle': this.currentSubtitleIndex === index,
        'past-subtitle': index < this.currentSubtitleIndex,
        'future-subtitle': index > this.currentSubtitleIndex
      };
    },

    // Helper: find the appropriate scrollable container for subtitles
    getScrollableSubtitlesContainer(activeEl) {
      // Prefer the explicit ref if present
      if (this.$refs.subtitlesContainer) return this.$refs.subtitlesContainer;
      // Fallback: closest matching container
      const closest = activeEl?.closest?.('.subtitles-container');
      if (closest) return closest;
      // Last resort: scroll the element's parent
      return activeEl?.parentElement || null;
    },

    // Helper: compute element's offsetTop relative to a given ancestor
    getOffsetTopRelativeTo(el, ancestor) {
      let top = 0;
      let node = el;
      while (node && node !== ancestor) {
        top += node.offsetTop || 0;
        node = node.offsetParent;
      }
      return top;
    },

    scrollActiveSubtitleIntoView(center) {
      if (this.currentSubtitleIndex == null || this.currentSubtitleIndex < 0) return;
      if (this.scrollingSubtitlesCollapsed) return;
      const activeEl = document.getElementById(`subtitle-${this.currentSubtitleIndex}`);
      const container = this.$refs.subtitlesContainer;
      if (!activeEl || !container) return;

      if (center) {
        // Center the active subtitle within the container
        const targetTop = Math.max(activeEl.offsetTop - (container.clientHeight / 2 - activeEl.offsetHeight / 2), 0);
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        // Only scroll if the active subtitle is outside the visible area
        const elTop = activeEl.offsetTop;
        const elBottom = elTop + activeEl.offsetHeight;
        const scrollTop = container.scrollTop;
        const scrollBottom = scrollTop + container.clientHeight;
        if (elTop < scrollTop || elBottom > scrollBottom) {
          const targetTop = Math.max(elTop - (container.clientHeight / 2 - activeEl.offsetHeight / 2), 0);
          container.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }
    },

    ensureActiveSubtitleVisibility() {
      this.scrollActiveSubtitleIntoView(this.autoCenterEnabled);
    },

    // Auto-scroll the current subtitle text inside context display if it overflows
    restartCurrentSubtitleAutoScroll() {
      this.stopCurrentSubtitleAutoScroll();
      if (!this.isPlaying) return;
      if (this.currentSubtitleIndex == null || this.currentSubtitleIndex < 0) return;
      const displayEl = this.$el.querySelector('.current-subtitle-display');
      if (!displayEl) return;
      // Reset scroll position
      displayEl.scrollTop = 0;
      const overflow = displayEl.scrollHeight - displayEl.clientHeight;
      if (overflow <= 4) return; // no meaningful overflow
      const cue = this.subtitles[this.currentSubtitleIndex];
      if (!cue) return;
      const now = this.player ? this.player.getCurrentTime() : cue.start;
      const remainingSec = Math.max(cue.end - now, 0.25); // avoid zero duration
      const totalMs = remainingSec * 1000;
      const startTime = performance.now();
      const distance = overflow;
      const step = () => {
        if (!this.isPlaying) return; // stop when paused
        // Abort if subtitle changed
        if (this.subtitles[this.currentSubtitleIndex] !== cue) return;
        const t = performance.now() - startTime;
        const progress = Math.min(t / totalMs, 1);
        displayEl.scrollTop = distance * progress;
        if (progress < 1) {
          this.currentSubtitleScrollInterval = requestAnimationFrame(step);
        } else {
          this.currentSubtitleScrollInterval = null;
        }
      };
      this.currentSubtitleScrollInterval = requestAnimationFrame(step);
    },

    stopCurrentSubtitleAutoScroll() {
      if (this.currentSubtitleScrollInterval) {
        cancelAnimationFrame(this.currentSubtitleScrollInterval);
        this.currentSubtitleScrollInterval = null;
      }
    },

    toggleControlsCollapsed() {
      this.controlsCollapsed = !this.controlsCollapsed;
    },

    toggleScrollingSubtitles() {
      this.scrollingSubtitlesCollapsed = !this.scrollingSubtitlesCollapsed;
      if (!this.scrollingSubtitlesCollapsed) {
        this.$nextTick(() => this.ensureActiveSubtitleVisibility());
      }
    },

    toggleTranslatedSubtitles() {
      this.translatedSubtitlesCollapsed = !this.translatedSubtitlesCollapsed;
      // Suppress popup on expand/collapse of translated subtitles
      // const action = this.translatedSubtitlesCollapsed ? 'collapsed' : 'expanded';
      // msgUtil.msgSuccess(this, `Translated subtitles ${action}`, 1000);
    },

    cancelSubtitlesLoading() {
      this.isSubtitlesLoading = false;
      this.subtitlesLoadingProgress = 0;
      this.subtitlesLoadingComplete = false;

      if (this.isTranslationLoading) {
        this.isTranslationLoading = false;
        this.translationProgress = 0;
        this.currentTranslationKey = null;
        this.disconnectSSE();
      }

      msgUtil.msgSuccess(this, 'Loading cancelled', 2000);
    },

    handleOverlayClose() {
      if (this.isSubtitlesLoading || this.isTranslationLoading) {
        this.cancelSubtitlesLoading();
      } else {
        // Reset the completion state so overlay hides
        this.subtitlesLoadingComplete = false;
      }
    },

    // Configuration handlers
    ifTranslationOnChange(enabled) {
      setStore({
        name: kiwiConsts.CONFIG_KEY.IF_SUBTITLES_TRANSLATION,
        content: enabled,
        type: 'local'
      });

      if (enabled && this.selectedLanguage && this.videoUrl && !this.translatedSubtitles) {
        this.shouldShowTranslationContainer = true;
        // Only start translation if subtitles are already loaded; otherwise rely on background loader
        if (!this.isSubtitlesLoading && this.subtitles.length > 0) {
          this.requestTranslation(this.videoUrl, this.selectedLanguage);
        }
      } else if (!enabled) {
        this.shouldShowTranslationContainer = false;
        this.sseShouldReconnect = false;
        this.currentTranslationKey = null;
        this.disconnectSSE();
      }
    },

    selectedLanguageChange(language) {
      this.selectedLanguage = language;
      setStore({
        name: kiwiConsts.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE,
        content: language,
        type: 'local'
      });

      setStore({
        name: kiwiConsts.CONFIG_KEY.IF_SUBTITLES_TRANSLATION,
        content: true,
        type: 'local'
      });
    },

    getSelectedLanguageLabel() {
      if (!this.selectedLanguage) return null;
      for (const [language, code] of Object.entries(this.languageCodes)) {
        if (code === this.selectedLanguage) {
          return language.replaceAll('_', ' ');
        }
      }
      return this.selectedLanguage;
    },

    onAutoCenterChange(enabled) {
      setStore({ name: kiwiConsts.CONFIG_KEY.SUBTITLES_AUTO_CENTER, content: enabled, type: 'local' });
      if (enabled) {
        this.$nextTick(() => this.ensureActiveSubtitleVisibility());
      }
    },

    onLoopChange(enabled) {
      // Update the player's loop setting if player is ready
      if (this.player && typeof this.player.setLoop === 'function') {
        this.player.setLoop(enabled);
      }
    },

    // Modified: Download translated subtitles directly from UI content
    async downloadTranslatedSubtitlesFromUI() {
      if (!this.translatedSubtitles) {
        msgUtil.msgError(this, 'No translated subtitles to download');
        return;
      }

      try {
        this.isDownloading = true;

        // Extract text content from the translated subtitles
        // Remove HTML tags and convert HTML entities back to text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.translatedSubtitles;

        // Get plain text content
        let textContent = tempDiv.textContent || tempDiv.innerText || '';

        // Clean up the content: replace multiple spaces/newlines with proper formatting
        textContent = textContent
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n\n')  // Normalize paragraph breaks
            .trim();

        // Create blob with the text content
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });

        // Generate filename based on video info
        const videoIdFromUrl = this.extractVideoId(this.videoUrl);
        const languageCode = this.selectedLanguage || 'translated';
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const filename = `youtube_${videoIdFromUrl || this.playerVideoId || 'video'}_${languageCode}_subtitles_${timestamp}.txt`;

        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up the URL object
        URL.revokeObjectURL(url);

        msgUtil.msgSuccess(this, `Downloaded: ${filename}`, 2000);
      } catch (error) {
        console.error('Failed to download translated subtitles:', error);
        msgUtil.msgError(this, 'Failed to download translated subtitles', 2500);
      } finally {
        this.isDownloading = false;
      }
    },

    // Utilities
    extractVideoId(url) {
      try {
        if (!url) return null;
        // Accept raw 11-char video IDs
        if (this.isLikelyYoutubeId(url)) return url;
        const urlObj = new URL(url);
        let videoId;
        if (urlObj.hostname.includes('youtube.com')) {
          if (urlObj.pathname === '/watch') {
            videoId = urlObj.searchParams.get('v');
          } else if (urlObj.pathname.includes('/shorts/')) {
            videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0];
          } else if (urlObj.pathname.includes('/embed/')) {
            videoId = urlObj.pathname.split('/embed/')[1]?.split('/')[0];
          }
        } else if (urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.split('/')[1];
        }
        return videoId ? videoId.split('?')[0].split('&')[0] : null;
      } catch (e) {
        console.error('Invalid URL:', e);
        return null;
      }
    },

    // Robustly normalize incoming videoUrl from route (handles double-encoding and raw IDs)
    normalizeVideoUrl(raw) {
      if (!raw) return null;
      let s = String(raw);
      // If it's a plain video ID, convert to a full watch URL
      if (this.isLikelyYoutubeId(s)) return `https://www.youtube.com/watch?v=${s}`;
      const tryDecode = (v) => { try { return decodeURIComponent(v); } catch { return v; } };
      // Attempt to decode up to 2 times to handle double-encoding
      for (let i = 0; i < 2; i++) {
        if (/^https?:\/\//i.test(s)) break;
        const dec = tryDecode(s);
        if (dec === s) break;
        s = dec;
      }
      // Validate URL
      try {
        const u = new URL(s);
        if (!/^https?:$/i.test(u.protocol)) return null;
        return u.toString();
      } catch {
        return null;
      }
    },
    isLikelyYoutubeId(str) {
      return typeof str === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(str);
    },

    // Mini loader helpers
    startMiniLoaderPoll() {
      if (this.miniLoaderInterval) return;
      this.miniLoaderInterval = setInterval(() => {
        const frac = this.getLoadedFraction();
        if (frac != null) this.miniLoaderPercent = Math.max(this.miniLoaderPercent, frac * 100);
        // Stop when fully loaded and ready
        if (this.videoReady && frac >= 1) {
          this.stopMiniLoaderPoll();
        }
      }, 300);
    },
    stopMiniLoaderPoll() {
      if (this.miniLoaderInterval) {
        clearInterval(this.miniLoaderInterval);
        this.miniLoaderInterval = null;
      }
    },
    getLoadedFraction() {
      try {
        if (this.player && typeof this.player.getVideoLoadedFraction === 'function') {
          return this.player.getVideoLoadedFraction();
        }
      } catch (_) {}
      return null;
    },

    // New helper: detect if selection is a single word (keeps apostrophes and hyphens)
    isSingleWord(text) {
      if (!text) return false;
      const s = String(text).trim();
      // Extract word-like tokens (letters incl. accents, numbers, apostrophes, hyphens)
      const tokens = s.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9'’-]+/g);
      return Array.isArray(tokens) && tokens.length === 1;
    },

    // NoSleep helpers
    disableNoSleep() {
      if (this.noSleep) {
        try { this.noSleep.disable(); } catch (_) {}
      }
    },

    // Splitter handlers
    startResize(e) {
      if (this.isSmallScreen) return;
      this.isResizing = true;
      try {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      } catch (_) {}
      this._onMouseMove = (evt) => this.onResizing(evt);
      this._onMouseUp = () => this.stopResize();
      window.addEventListener('mousemove', this._onMouseMove);
      window.addEventListener('mouseup', this._onMouseUp, { once: true });
    },
    onResizing(evt) {
      if (!this.isResizing) return;
      const container = this.$el.querySelector('.content-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = evt.clientX - rect.left; // position within container
      const percent = (x / rect.width) * 100;
      const clamped = Math.max(this.splitterMin, Math.min(this.splitterMax, percent));
      this.leftPanelPercent = Math.round(clamped * 10) / 10; // one decimal
    },
    stopResize() {
      if (!this.isResizing) return;
      this.isResizing = false;
      try {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      } catch (_) {}
      if (this._onMouseMove) {
        window.removeEventListener('mousemove', this._onMouseMove);
        this._onMouseMove = null;
      }
      this.persistSplit();
    },
    resetPanelSizes() {
      this.leftPanelPercent = 50;
      this.persistSplit();
    },
    persistSplit() {
      try {
        setStore({ name: 'ytb_left_panel_percent', content: this.leftPanelPercent, type: 'local' });
      } catch (_) {}
    },

    // Helpers reused from AI detail component
    generateRequestId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    sanitizePotentialJsonString(str) {
      if (typeof str !== 'string') return '';
      let s = (str || '').trim();
      // Remove fenced code blocks markers like ```json and ```
      s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      // Replace curly quotes with straight quotes
      s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
      // Trim again
      if (!s.startsWith('{')) {
        const firstBrace = s.indexOf('{');
        const lastBrace = s.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          s = s.substring(firstBrace, lastBrace + 1).trim();
        }
      }
      return s;
    },
    tryParseJsonLoose(str) {
      if (typeof str !== 'string') return null;
      const cleaned = this.sanitizePotentialJsonString(str);
      try {
        return JSON.parse(cleaned);
      } catch (_) {
        return null;
      }
    },
    extractResponseTextFromPayload(payload) {
      try {
        if (payload && typeof payload === 'object') {
          if (typeof payload.responseText === 'string') return payload.responseText;
          if (payload.data && typeof payload.data.responseText === 'string') return payload.data.responseText;
          return null;
        }
        if (typeof payload === 'string') {
          const obj = this.tryParseJsonLoose(payload);
          if (obj) {
            if (typeof obj.responseText === 'string') return obj.responseText;
            if (obj.data && typeof obj.data.responseText === 'string') return obj.data.responseText;
          }
          // Attempt direct regex extraction after normalizing quotes
          const normalized = payload.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
          const match = normalized.match(/"responseText"\s*:\s*"([\s\S]*?)"/);
          if (match) {
            // Unescape common sequences inside the captured string
            return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
          }
        }
        return null;
      } catch (_) {
        return null;
      }
    },
    unescapeContent(content) {
      if (!content) return '';
      return content
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
    }
  }
};
</script>

<style scoped>
:root {
  --text-placeholder: #c0c4cc;
  --color-primary-light-5: rgba(64, 158, 255, 0.25);
}

/* Base styles */
.youtube-player {
  position: relative;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: var(--bg-body);
}

/* Controls collapse toggle button */
.controls-collapse-toggle {
  display: flex;
  justify-content: center;
  padding: 6px 0;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color-light);
}

.collapse-toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.collapse-toggle-wrapper:hover,
.collapse-toggle-wrapper:active {
  background: var(--color-primary-light-5);
  border-color: var(--color-primary);
}

.collapse-toggle-icon {
  font-size: 14px;
  color: var(--color-primary);
  transition: transform 0.2s ease;
}

.collapse-toggle-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.subtitles-loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.subtitles-loading-placeholder i {
  font-size: 24px;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}





/* Input Container */
.input-container {
  padding: 0 20px 10px;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.url-input-group {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  gap: 10px;
}

.language-select {
  width: 100%;
  max-width: 300px;
  align-self: center;
}

.input-with-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.url-input {
  flex: 1;
  min-width: 0;
}

.url-input >>> .el-input__inner,
.language-select >>> .el-input__inner {
  border-radius: 8px;
  border: 1px solid var(--border-color-light);
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: var(--bg-card);
  color: var(--text-primary);
}

.url-input >>> .el-input__inner:focus,
.language-select >>> .el-input__inner:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light-5);
}

.url-input >>> .el-input__inner:disabled,
.language-select >>> .el-input__inner:disabled {
  background: var(--bg-container);
  cursor: not-allowed;
}

.language-select >>> .el-input__icon {
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.load-button {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-card);
  min-width: 100px;
  justify-content: center;
}

.load-button:hover:not(:disabled) {
  background: var(--gradient-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.load-button:disabled {
  background: var(--text-placeholder);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.load-button .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.action-btn {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-card);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
  color: var(--color-primary);
}

/* Controls Container */
.responsive-container {
  padding: 0 20px 10px;
  margin: 0;
}

.controls-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bg-card);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
}

.switch-group {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.mobile-switch-label {
  position: absolute;
  right: -25px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--color-primary);
  pointer-events: none;
  opacity: 0.7;
}

.enhanced-switch {
  margin: 0;
}

.enhanced-switch .el-switch__label {
  font-size: 14px;
  color: var(--text-regular);
  font-weight: 500;
}

.enhanced-switch .el-switch__core {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.enhanced-switch.is-checked .el-switch__core {
  background: var(--gradient-primary);
  border-color: transparent;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border-color-light);
  margin: 0 8px;
}

/* Status Container */
.status-container {
  padding: 8px 20px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

/* Compact status chip */
.compact-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
  color: var(--text-regular);
  border-radius: 999px;
  padding: 6px 10px;
}
.compact-status .spinning { animation: spin 1s linear infinite; }
.compact-status-text { font-size: 12px; font-weight: 500; }
.compact-progress {
  width: 90px;
  height: 4px;
  background: var(--bg-container);
  border-radius: 999px;
  overflow: hidden;
}
.compact-progress-fill {
  height: 100%;
  width: 0;
  background: var(--gradient-primary);
  transition: width 0.25s ease;
}

.status-message {
  padding: 10px 12px;
  margin: 0;
  color: var(--color-danger);
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
.status-message.compact { border-radius: 999px; }



/* Content Container */
.content-container {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  width: 95%;
  height: calc(100vh - 220px);
  overflow: hidden;
  padding: 0 20px;
  gap: 20px;
}
.content-container.resizing { cursor: col-resize; user-select: none; }

.left-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  flex-shrink: 0;
}

/* Draggable splitter */
.splitter {
  width: 8px;
  cursor: col-resize;
  background: var(--bg-container);
  border-radius: 4px;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splitter::before {
  content: '';
  width: 4px;
  height: 40px;
  background: var(--border-color-light);
  border-radius: 2px;
  transition: all 0.2s ease;
}

.splitter:hover {
  background: var(--color-primary-light-5);
}

.splitter:hover::before {
  background: var(--color-primary);
  height: 60px;
}

.splitter:active {
  background: var(--color-primary-light-5);
}

.splitter:active::before {
  background: var(--color-primary);
}

.right-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  flex: 1;
}

.video-section {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  position: relative;
  min-height: 200px;
}

.video-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  background: #000;
  aspect-ratio: 16 / 9;
  max-height: 60vh;
}

.video-container iframe,
.video-container #youtube-player-container {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

/* Mini loader overlay inside video */
.video-mini-loader {
  position: absolute;
  right: 10px;
  top: 10px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  line-height: 1;
  z-index: 20;
}
.mini-loader-icon { font-size: 12px; }
.mini-loader-text { white-space: nowrap; opacity: 0.9; }

/* Subtitle Context Display */
.youtube-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: transparent; /* Transparent for cyberpunk theme */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .youtube-player {
    background: rgba(30, 30, 30, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Ensure subtitle action buttons have proper contrast in dark mode */
  .subtitle-line.previous-subtitle .subtitle-action-btn,
  .subtitle-line.next-subtitle .subtitle-action-btn {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .subtitle-line.previous-subtitle .subtitle-action-btn:hover,
  .subtitle-line.next-subtitle .subtitle-action-btn:hover {
    background: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb, 64, 158, 255), 0.4);
  }
}
/* Subtitle Context Display - Current subtitle viewer */
.subtitles-context-display {
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
  margin-top: 8px;
  flex-shrink: 0;
}

.previous-subtitle {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-body);
  border-bottom: 1px solid var(--border-color-light);
  white-space: pre-wrap;
  line-height: 1.4;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
  opacity: 0.7;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-subtitle-display {
  background: var(--gradient-primary);
  color: white;
  padding: 12px 16px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
  position: relative;
  -webkit-touch-callout: none;
  line-height: 1.5;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.current-subtitle-display:hover {
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.2);
}

.next-subtitle {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-regular);
  background: var(--bg-container);
  border-top: 1px solid var(--border-color-light);
  white-space: pre-wrap;
  line-height: 1.4;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
  opacity: 0.8;
  max-height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Subtitle line with action button */
.subtitle-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  position: relative;
}

.subtitle-line .subtitle-text {
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
}

.subtitle-line .subtitle-action-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform: scale(0.9);
}

.subtitle-line:hover .subtitle-action-btn {
  opacity: 1;
  transform: scale(1);
}

/* Always show button on touch devices */
@media (hover: none) and (pointer: coarse) {
  .subtitle-line .subtitle-action-btn {
    opacity: 0.7;
    transform: scale(1);
  }

  .subtitle-line .subtitle-action-btn:active {
    opacity: 1;
  }
}

/* Buttons on previous/next subtitles - ensure proper contrast */
.subtitle-line.previous-subtitle .subtitle-action-btn,
.subtitle-line.next-subtitle .subtitle-action-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  color: var(--color-primary);
}

.subtitle-line.previous-subtitle .subtitle-action-btn:hover,
.subtitle-line.next-subtitle .subtitle-action-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb, 64, 158, 255), 0.3);
}

/* Special styling for current subtitle button - white on gradient */
.subtitle-line.current-subtitle-display .subtitle-action-btn.current {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
}

.subtitle-line.current-subtitle-display .subtitle-action-btn.current:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
}

/* Subtitles Container */
.subtitles-container {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
  min-height: 200px;
  position: relative;
  scrollbar-width: thin;
  margin-bottom: 10px;
}

.subtitles-container::-webkit-scrollbar {
  width: 8px;
}

.subtitles-container::-webkit-scrollbar-track {
  background: var(--bg-body);
  border-radius: 4px;
}

.subtitles-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc 0%, #909399 100%);
  border-radius: 4px;
}

.subtitles-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

/* Section Headers - Unified style */
.subtitles-header,
.translated-subtitles-header {
  padding: 12px 16px;
  background: var(--gradient-primary);
  border-bottom: none;
  font-size: 13px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
  cursor: pointer;
  user-select: none;
  transition: all 0.25s ease;
  border-radius: 12px 12px 0 0;
}

.subtitles-header {
  background: var(--gradient-success);
}

.subtitles-header:hover,
.translated-subtitles-header:hover {
  filter: brightness(1.1);
}

.subtitles-header:active,
.translated-subtitles-header:active {
  filter: brightness(0.95);
}

.subtitles-header i,
.translated-subtitles-header i {
  font-size: 16px;
  color: white;
}

.subtitle-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  margin-left: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.header-toggle-hint {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: none !important;
  color: white !important;
}

.header-action-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

.toggle-arrow {
  font-size: 14px;
  transition: transform 0.3s ease;
  color: white;
  opacity: 0.9;
}

.subtitles-wrapper {
  padding: 16px;
  min-height: calc(100% + 50px);
  scroll-behavior: smooth;
  overflow-y: auto;
  scroll-padding-top: 20px;
  scroll-padding-bottom: 20px;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

.subtitles-container p {
  margin: 4px 0;
  padding: 10px 14px;
  transition: all 0.25s ease;
  border-radius: 8px;
  cursor: pointer;
  line-height: 1.5;
  font-size: 14px;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  scroll-margin-top: 20px;
  scroll-margin-bottom: 20px;
  color: var(--text-primary);
  background: transparent;
}

.subtitles-container p:hover {
  background: var(--bg-container);
  border-color: var(--color-primary-light-5);
  transform: translateX(4px);
  box-shadow: var(--shadow-hover);
}

.subtitles-container p::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  transition: all 0.25s ease;
}

/* Subtitle state styles */
.subtitles-container p.active-subtitle {
  background: var(--color-primary-light-5);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-card);
  transform: translateX(4px);
}

.subtitles-container p.active-subtitle::before {
  background: var(--color-primary);
  width: 4px;
}

.subtitles-container p.past-subtitle {
  opacity: 0.6;
  color: var(--text-secondary);
}

.subtitles-container p.past-subtitle:hover {
  opacity: 0.9;
}

.subtitles-container p.future-subtitle {
  opacity: 0.85;
}

.subtitles-container p.future-subtitle:hover {
  opacity: 1;
}

/* Scroll filler to allow scrolling past last item */
.scroll-filler {
  height: 150px;
  flex-shrink: 0;
}

/* Translated Subtitles Container */
.translated-subtitles-container {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
  min-height: 200px;
  position: relative;
  scrollbar-width: thin;
}

.translated-subtitles-container::-webkit-scrollbar {
  width: 8px;
}

.translated-subtitles-container::-webkit-scrollbar-track {
  background: var(--bg-body);
  border-radius: 4px;
}

.translated-subtitles-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc 0%, #909399 100%);
  border-radius: 4px;
}

.translated-subtitles-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

.translation-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.streaming-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
}

.translated-subtitles-wrapper {
  padding: 10px;
  min-height: calc(100% + 50px);
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

.translation-streaming-indicator {
  padding: 16px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.streaming-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--color-primary);
  font-weight: 500;
}

.streaming-message i {
  font-size: 16px;
}

.streaming-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.streaming-bar {
  flex: 1;
  height: 4px;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.streaming-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.streaming-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

.streaming-percentage {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}

.translation-content {
  padding: 20px;
  line-height: 1.8;
  font-size: 15px;
  color: var(--text-primary);
  text-align: justify;
}

/* AI Search Dialog */
.ai-dialog-content { padding: 10px 0; }
.selected-text-preview { margin-bottom: 10px; color: var(--text-regular); }
.ai-response { max-height: 45vh; overflow-y: auto; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-color-light); border-radius: 8px; }
.inline-error { color: var(--color-danger); background: rgba(245, 108, 108, 0.1); border: 1px solid rgba(245, 108, 108, 0.2); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }

/* Vocabulary Popup (deprecated, replaced by dialog) */
/* .vocabulary-popup { display: none; } */

/* Clickable headers */
.clickable-header {
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.clickable-header:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.header-toggle-hint {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* Responsive Design - Mobile */
@media (max-width: 767px) {
  .youtube-player {
    height: 100%;
    min-height: 100vh;
  }

  .input-container {
    padding: 0 10px 6px;
  }

  .url-input-group {
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
  }

  .language-select {
    max-width: 100%;
    align-self: stretch;
  }

  .input-with-buttons {
    flex-direction: row;
    gap: 8px;
    align-items: center;
  }

  .url-input {
    flex: 1;
  }

  .action-buttons {
    flex-shrink: 0;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .load-button {
    min-width: 70px;
    padding: 8px 12px;
    font-size: 12px;
    height: 36px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    font-size: 12px;
  }

  .responsive-container {
    padding: 0 10px 6px;
  }

  .controls-wrapper {
    flex-direction: row;
    gap: 8px;
    padding: 8px;
    justify-content: space-around;
    align-items: center;
  }

  .switch-group {
    flex-direction: column;
    gap: 2px;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    position: relative;
  }

  .mobile-switch-label {
    position: static;
    transform: none;
    font-size: 10px;
    color: var(--text-regular);
    margin-top: 1px;
    order: 2;
  }

  .enhanced-switch {
    order: 1;
    transform: scale(0.7);
  }

  .divider {
    display: none;
  }

  .splitter {
    display: none;
  }

  .content-container {
    padding: 0 10px;
    flex-direction: column;
    height: auto;
    flex: 1;
    gap: 10px;
    overflow-y: auto;
  }

  .left-panel,
  .right-panel {
    width: 100% !important;
  }

  .left-panel {
    flex-shrink: 0;
  }

  .video-container {
    aspect-ratio: 16 / 9;
    max-height: 35vh;
    min-height: 180px;
  }

  .subtitles-context-display {
    margin-top: 8px;
  }

  .current-subtitle-display {
    font-size: 14px;
    padding: 10px 12px;
    max-height: 80px;
  }

  .previous-subtitle,
  .next-subtitle {
    font-size: 11px;
    padding: 6px 10px;
    max-height: 40px;
  }

  /* Make subtitle action buttons always visible on mobile */
  .subtitle-line .subtitle-action-btn {
    opacity: 0.8;
    transform: scale(1);
  }

  .subtitle-line .subtitle-action-btn:active {
    opacity: 1;
  }

  .right-panel {
    flex: 1;
    min-height: 300px;
  }

  .subtitles-container {
    min-height: 150px;
    max-height: 250px;
  }

  .translated-subtitles-container {
    min-height: 150px;
    flex: 1;
  }

  .subtitles-header,
  .translated-subtitles-header {
    padding: 8px 12px;
    font-size: 12px;
  }

  .subtitles-wrapper {
    padding: 10px;
  }

  .subtitles-container p {
    font-size: 13px;
    padding: 6px 10px;
  }

  .translation-content {
    padding: 12px;
    font-size: 14px;
    line-height: 1.6;
  }

  .subtitles-loading-overlay {
    top: 3px;
    right: 3px;
    left: 3px;
  }

  .subtitles-loading-container {
    min-width: auto;
    max-width: none;
    margin: 0;
    padding: 8px 12px;
  }
}

/* Tablet screens */
@media (min-width: 768px) and (max-width: 991px) {
  .content-container {
    flex-direction: column;
    gap: 16px;
  }

  .left-panel,
  .right-panel {
    width: 100% !important;
  }

  .video-container {
    max-height: 40vh;
  }

  .splitter {
    display: none;
  }
}

/* Desktop and larger screens */
@media (min-width: 992px) {
  .content-container {
    flex-direction: row;
    gap: 0;
    align-items: stretch;
  }

  .left-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .right-panel {
    height: 100%;
    padding-left: 0;
    border-left: none;
  }

  .video-section {
    flex: 1 1 auto;
    min-height: 0;
  }

  .video-container {
    max-height: none;
    height: 100%;
    aspect-ratio: auto;
  }

  .subtitles-context-display {
    flex: 0 0 auto;
    margin-top: 12px;
  }

  .subtitles-container {
    flex: 1;
    min-height: 150px;
    margin-bottom: 12px;
  }

  .translated-subtitles-container {
    flex: 1;
    min-height: 150px;
  }

  .url-input-group {
    flex-direction: row;
    align-items: center;
    gap: 15px;
  }

  .language-select {
    max-width: 180px;
    flex-shrink: 0;
  }

  .input-with-buttons {
    flex: 1;
  }

  .mobile-switch-label {
    display: none;
  }

  .enhanced-switch .el-switch__label {
    display: block;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

.content-container {
  animation: slideIn 0.5s ease-out;
}

/* Focus styles */
.load-button:focus,
.action-btn:focus,
.enhanced-switch:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* High contrast support */
@media (prefers-contrast: more) {

  .current-subtitle-display,
  .active-subtitle,
  .load-button,
  .vocabulary-popup {
    background: #000 !important;
    color: #fff !important;
  }

  .subtitles-container,
  .subtitles-context-display,
  .controls-wrapper {
    border: 2px solid #000 !important;
  }

  /* Ensure subtitle action buttons have high contrast */
  .subtitle-line .subtitle-action-btn {
    border: 2px solid #000 !important;
    opacity: 1 !important;
  }

  .subtitle-line.current-subtitle-display .subtitle-action-btn.current {
    background: #fff !important;
    color: #000 !important;
    border-color: #fff !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .progress-fill {
    animation: none;
    background: var(--color-primary);
  }

  .loading-spinner .spinner-ring {
    animation: none;
    border: 3px solid var(--color-primary);
  }

  .subtitles-wrapper {
    scroll-behavior: auto !important;
  }
}

/* Favorite overlay styles */
/* .favorite-overlay { display: none; } */
.favorite-top-group .favorite-btn {
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-card);
}
.favorite-top-group .favorite-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-light-5);
  box-shadow: var(--shadow-hover);
}
.favorite-top-group .favorite-btn.favorited {
  color: var(--color-warning);
}


</style>

