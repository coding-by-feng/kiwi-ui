<template>
  <div class="youtube-player">
    <!-- Enhanced header with gradient styling -->
    <div class="header-container" v-show="!isPlaying && !forceHideInput">
      <h1 id="playHeader" class="main-title">
        <i class="el-icon-video-play"></i>
        YouTube Player
      </h1>
    </div>

    <!-- Enhanced Input Container with gradient styling -->
    <div class="input-container" v-show="!forceHideInput">
      <div class="url-input-group">
        <!-- Language dropdown that shows only when translation is enabled -->
        <el-select v-show="ifTranslation" v-model="selectedLanguage" placeholder="Select Language"
                   @change="selectedLanguageChange" class="language-select">
          <el-option
              v-for="(code, language) in languageCodes"
              :key="code"
              :label="language.replaceAll('_', ' ')"
              :value="code">
          </el-option>
        </el-select>

        <div class="input-with-buttons">
          <el-input
              v-model="videoUrl"
              type="text"
              placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
              @keyup.enter="loadContent"
              class="url-input"
              :disabled="isLoading"
          />
          <div class="action-buttons">
            <button @click="loadContent" :disabled="!videoUrl || isLoading" class="load-button">
              <i v-if="isLoading" class="el-icon-loading spinning"></i>
              <i v-else class="el-icon-video-play"></i>
              {{ isLoading ? 'Loading...' : 'Load' }}
            </button>
            <el-button type="info" icon="el-icon-delete" size="small" circle @click="cleanSubtitles" class="action-btn"></el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Controls Container -->
    <div id="responsiveContainer" class="responsive-container">
      <div class="controls-wrapper">
        <div class="switch-group" v-if="!forceHideInput">
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
        <div class="divider" v-if="!isSmallScreen && !forceHideInput"></div>
        <div class="switch-group">
          <el-switch
              v-model="forceHideInput"
              :active-text="isSmallScreen ? '' : 'Force to hide searching while playing'"
              @change="ifTranslationOnChange"
              class="enhanced-switch">
            <template v-if="isSmallScreen" #inactive-icon>
              <i class="el-icon-s-operation"></i>
            </template>
            <template v-if="isSmallScreen" #active-icon>
              <i class="el-icon-view"></i>
            </template>
          </el-switch>
          <span v-if="isSmallScreen" class="mobile-switch-label">
            <i class="el-icon-view"></i>
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
        <!-- Favorite button moved to top controls bar -->
        <div class="switch-group favorite-top-group">
          <el-tooltip :content="canFavorite ? (isFavorited ? 'Unfavorite this video' : 'Favorite this video') : 'Load a video to favorite'" placement="top">
            <el-button
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
    <div class="status-container" v-show="!isPlaying && !forceHideInput && statusMessage !== ''">
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

    <!-- Enhanced Subtitles Loading Indicator -->
    <div v-if="showSubtitlesLoading" class="subtitles-loading-overlay">
      <div class="subtitles-loading-container">
        <div class="subtitles-loading-icon">
          <i v-if="isSubtitlesLoading || isTranslationLoading" class="el-icon-loading spinning"></i>
          <i v-else-if="subtitlesLoadingComplete && hasSubtitles" class="el-icon-check success-icon"></i>
          <i v-else-if="subtitlesLoadingComplete" class="el-icon-warning warning-icon"></i>
        </div>
        <div class="subtitles-loading-text">
          <span v-if="isSubtitlesLoading">Loading subtitles...</span>
          <span v-else-if="isTranslationLoading">Streaming translation...</span>
          <span v-else-if="subtitlesLoadingComplete && hasSubtitles">Ready!</span>
          <span v-else-if="subtitlesLoadingComplete">Failed to load</span>

          <div v-if="isSubtitlesLoading || isTranslationLoading" class="subtitles-progress">
            <div class="subtitles-progress-bar">
              <div class="subtitles-progress-fill" :style="{ width: currentProgress + '%' }"></div>
            </div>
            <span class="subtitles-progress-text">{{ Math.round(currentProgress) }}%</span>
          </div>

          <div v-else-if="subtitlesLoadingComplete" class="subtitles-status">
            <div class="status-indicators">
              <span :class="['status-item', subtitles.length > 0 ? 'success' : 'failed']">
                <i :class="subtitles.length > 0 ? 'el-icon-check' : 'el-icon-close'"></i>
                Subtitles
              </span>
              <span v-if="ifTranslation" :class="['status-item', translatedSubtitles ? 'success' : 'failed']">
                <i :class="translatedSubtitles ? 'el-icon-check' : 'el-icon-close'"></i>
                Translation
              </span>
              <span v-else class="status-item disabled">
                <i class="el-icon-minus"></i>
                Translation off
              </span>
            </div>
          </div>
        </div>

        <div class="subtitles-loading-actions">
          <div v-if="isSubtitlesLoading || isTranslationLoading" class="subtitles-loading-close" @click="cancelSubtitlesLoading">
            <i class="el-icon-close"></i>
          </div>
          <div v-else-if="subtitlesLoadingComplete" class="subtitles-loading-minimize" @click="minimizeSubtitlesStatus">
            <i class="el-icon-minus"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Content Container -->
    <div class="content-container" :class="{ resizing: isResizing }" v-if="(videoUrl && videoUrl !== '') || (playerVideoId && playerVideoId !== '')">
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
          <div v-if="hasPreviousSubtitle" class="previous-subtitle">
            {{ subtitles[currentSubtitleIndex - 1]?.text }}
          </div>
          <div v-if="subtitles.length" class="current-subtitle-display">
            {{ subtitles[currentSubtitleIndex]?.text }}
          </div>
          <div v-if="hasNextSubtitle" class="next-subtitle">
            {{ subtitles[currentSubtitleIndex + 1]?.text }}
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
            <el-button
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
        title="AI Search"
        @open-ai-tab="onOpenAiTabFromPopup"
      />

    </div>
  </div>
</template>

<script>
// Removed defineComponent import for Vue 2 options API
// import {defineComponent} from 'vue';
import {downloadVideoScrollingSubtitles, favoriteVideoByUrl, unfavoriteVideoByUrl, checkVideoFavoriteById, checkVideoFavoriteByUrl} from '@/api/ai';
import msgUtil from '@/util/msg';
import kiwiConsts from '@/const/kiwiConsts'
import {getStore, setStore} from "@/util/store";
import MarkdownIt from 'markdown-it';
import NoSleep from 'nosleep.js';
import AiSelectionPopup from '@/page/ai/AiSelectionPopup.vue'
import { buildAiTabQuery } from '@/util/aiNavigation'
import { navigateIfChanged } from '@/util/routerUtil'

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true
});

export default {
  name: 'YoutubeSubtitleDownloader',
  components: { AiSelectionPopup },
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
      videoUrl: null,
      ifTranslation: normalizedIfTranslation,
      selectedLanguage: getStore({name: kiwiConsts.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE}) || null,
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      // Split IDs: backend internal DB id vs YouTube 11-char id
      backendVideoId: null,
      playerVideoId: null,
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
      currentSubtitleIndex: -1,
      subtitleInterval: null,
      middleControlEnabled: true,
      forceHideInput: false,
      isSmallScreen: false,
      selectedText: '',
      // Use dialog instead of small bubble for selection actions and AI streaming
      showSelectionPopup: false,
      isPlaying: false,
      videoReady: false,
      // New: flag for YouTube IFrame API readiness
      youtubeApiReady: false,

      // WebSocket streaming (subtitles translation)
      websocket: null,
      wsUrl: '/ai-biz/ai/ws/ytb/subtitle',
      isTranslationLoading: false,
      translationProgress: 0,
      translationChunks: [],
      wsConnectionStatus: 'disconnected',
      streamingStartTime: null,
      streamingBuffer: '',
      shouldShowTranslationContainer: false,

      // WS stability state
      wsHeartbeatInterval: null,
      wsReconnectTimer: null,
      wsReconnectAttempts: 0,
      wsShouldReconnect: false,
      wsSessionId: '',
      lastTranslationRequest: null,
      pageHidden: false,

      // NoSleep helper to reduce iOS background suspension via wake-lock-like behavior
      noSleep: null,

      // Optimized debouncing
      scrollTimeout: null,
      progressUpdateInterval: null,
      // New: downloading state
      isDownloading: false,
      // New: auto-center toggle (default true if unset)
      autoCenterEnabled: (persistedAutoCenter === undefined || persistedAutoCenter === null) ? true : !!persistedAutoCenter,

      // Mini loader state
      isBuffering: false,
      miniLoaderPercent: 0,
      miniLoaderInterval: null,
      // Splitter state (desktop only)
      leftPanelPercent: (() => {
        const v = getStore({ name: 'ytb_left_panel_percent' });
        const n = typeof v === 'number' ? v : parseFloat(v);
        const clamped = isNaN(n) ? 50 : Math.max(20, Math.min(80, n));
        return clamped;
      })(),
      isResizing: false,
      splitterMin: 20,
      splitterMax: 80,

      // Inline AI search (generic) streaming state
      aiWebsocket: null,
      aiSearchLoading: false,
      aiIsStreaming: false,
      aiRequestId: '',
      aiResponseText: '',
      aiLastError: '',
      // Init guards & timeouts
      isInitializing: false,
      _suppressVideoIdWatcher: false,
      playerInitTimeout: null
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
      return (this.isSafariOrIOS() || this.currentSubtitleIndex !== -1) &&
          this.subtitles.length &&
          (this.ifTranslation || (!this.ifTranslation && !this.ifProfessionalSubtitles));
    },
    hasSubtitles() {
      return this.subtitles.length > 0 || (this.ifTranslation && this.translatedSubtitles);
    },
    showSubtitlesLoading() {
      return (this.isSubtitlesLoading || this.subtitlesLoadingComplete || this.isTranslationLoading) &&
          this.videoUrl && this.videoUrl !== '';
    },
    currentProgress() {
      return this.isTranslationLoading ? this.translationProgress : this.subtitlesLoadingProgress;
    },
    // Whether a video can be favorited: requires a valid URL or a player video id we can convert to URL
    canFavorite() {
      const hasValidUrl = !!(this.videoUrl && this.extractVideoId(this.videoUrl));
      const hasPlayerId = !!(this.playerVideoId && this.isLikelyYoutubeId(this.playerVideoId));
      return hasValidUrl || hasPlayerId;
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
    }
  },
  watch: {
    // When player video id changes, re-init the iframe (guarded)
    playerVideoId(newVideoId, oldVideoId) {
      if (this._suppressVideoIdWatcher) return;
      if (newVideoId && oldVideoId && newVideoId !== oldVideoId) {
        if (this.player && this.youtubeApiReady) {
          console.log('[YoutubePlayer] watcher loadVideoById', newVideoId);
          this.isLoading = true;
          this.videoReady = false;
          this.statusMessage = 'Initializing player...';
          this.stopMiniLoaderPoll();
          this.startMiniLoaderPoll();
          try {
            this.player.loadVideoById(newVideoId);
            this.setPlayerInitTimeout();
          } catch (e) {
            console.warn('[YoutubePlayer] loadVideoById failed in watcher, reinitializing', e);
            this.reinitializePlayer().then(() => { this.isLoading = false; });
          }
        } else {
          console.log('[YoutubePlayer] watcher reinitializePlayer', newVideoId);
          this.reinitializePlayer().then(() => { this.isLoading = false; });
        }
      }
    },
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
          this.playerVideoId = s;
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
      if (this.autoCenterEnabled && newVal !== oldVal) {
        this.$nextTick(() => this.scrollActiveSubtitleIntoView());
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
      this.playerVideoId = String(q.videoId);
      this.videoUrl = `https://www.youtube.com/watch?v=${this.playerVideoId}`;
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
      const fallbackUrl = this.videoUrl || (this.playerVideoId ? `https://www.youtube.com/watch?v=${this.playerVideoId}` : null);

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
          const url = this.videoUrl || (this.playerVideoId ? `https://www.youtube.com/watch?v=${this.playerVideoId}` : null);
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
      this.disconnectWebSocket();
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
      this.clearWsTimers();
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
        // On becoming visible, if translation was in progress and socket is down, try to resume
        if (this.isTranslationLoading && (!this.websocket || this.websocket.readyState !== WebSocket.OPEN)) {
          this.scheduleReconnect(200);
        }
      }
    },
    onPageHide() {
      // Browsers may suspend timers; keep minimal state; we'll resume on pageshow
    },
    onPageShow() {
      if (this.isTranslationLoading && (!this.websocket || this.websocket.readyState !== WebSocket.OPEN)) {
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

    // WebSocket optimized streaming
    async connectWebSocket() {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        return Promise.resolve();
      }

      this.disconnectWebSocket();
      this.clearWsTimers();

      return new Promise((resolve, reject) => {
        this.wsConnectionStatus = 'connecting';
        const token = getStore({name: 'access_token'});

        if (!token) {
          const error = new Error('Authentication token not found');
          this.handleWebSocketError(error, 'Authentication token not found. Please login again.');
          reject(error);
          return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}${this.wsUrl}?access_token=${encodeURIComponent(token)}`;

        this.websocket = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (this.wsConnectionStatus !== 'connected') {
            try { this.websocket?.close(); } catch (_) {}
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'connected';
          // Start heartbeat keepalive (best-effort; may be throttled in background)
          this.wsHeartbeatInterval = setInterval(() => {
            try {
              if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
              }
            } catch (_) {}
          }, 25000);
          resolve();
        };

        this.websocket.onmessage = this.handleWebSocketMessage;

        this.websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'disconnected';
          this.websocket = null;
          this.clearWsTimers();

          if (event.code === 1008 || event.code === 1011) {
            this.handleWebSocketError(new Error('Authentication failed'), 'Authentication failed. Please login again.');
          }

          // Unexpected close during active translation -> schedule reconnect
          if (this.isTranslationLoading && this.wsShouldReconnect) {
            this.scheduleReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'error';
          // If initial connect, reject; otherwise we'll attempt reconnect
          if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.handleWebSocketError(error, 'Failed to connect to translation service.');
            reject(error);
          }
        };
      });
    },

    disconnectWebSocket() {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
        this.wsConnectionStatus = 'disconnected';
      }
      this.clearWsTimers();
    },

    handleWebSocketMessage(event) {
      try {
        const response = JSON.parse(event.data);

        if (response.type === 'pong') {
          // Heartbeat reply; nothing to do
          return;
        }

        switch (response.type) {
          case 'connected':
            console.log('WebSocket connected:', response.message);
            break;
          case 'started':
            this.handleTranslationStarted();
            break;
          case 'chunk':
            this.handleTranslationChunk(response.chunk);
            break;
          case 'completed':
            this.handleTranslationCompleted(response);
            break;
          case 'error':
            this.handleTranslationError(response);
            break;
          default:
            console.warn('Unknown WebSocket message type:', response.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        msgUtil.msgError(this, 'Failed to parse translation response');
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
      this.wsShouldReconnect = true;
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
      this.wsShouldReconnect = false;
      this.clearWsTimers();

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
      this.wsShouldReconnect = false;
      this.clearWsTimers();

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

    handleWebSocketError(error, message) {
      console.error('WebSocket error:', error);
      // Avoid noisy toasts if we already have translated content or not actively loading
      if (this.isTranslationLoading || !this.translatedSubtitles) {
        msgUtil.msgError(this, message, 3000);
      } else {
        console.warn('Suppressing WS error toast because content is already present.');
      }
    },

    async requestTranslation(videoUrl, language) {
      try {
        // Show translation container immediately when starting WS streaming
        this.shouldShowTranslationContainer = true;
        this.translatedSubtitlesCollapsed = false; // Ensure it's expanded

        await this.connectWebSocket();

        // New session id and remember payload for reconnects
        this.wsSessionId = 'ws_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        this.wsShouldReconnect = true;
        this.lastTranslationRequest = { videoUrl, language, requestType: 'translated', sessionId: this.wsSessionId };

        const request = {
          videoUrl: videoUrl,
          language: language,
          requestType: 'translated',
          timestamp: Date.now(),
          sessionId: this.wsSessionId
        };

        this.websocket.send(JSON.stringify(request));
      } catch (error) {
        this.handleWebSocketError(error, 'Failed to start translation: ' + error.message);
        this.isTranslationLoading = false;
        this.subtitlesLoadingComplete = true;
        this.shouldShowTranslationContainer = false;
        this.wsShouldReconnect = false;
        this.clearWsTimers();
        this.disableNoSleep();
      }
    },

    // Reconnect with incremental backoff and resume request
    scheduleReconnect(initialDelay) {
      if (!this.wsShouldReconnect) return;
      if (this.wsReconnectTimer) return;
      const attempt = ++this.wsReconnectAttempts;
      const delay = typeof initialDelay === 'number' ? initialDelay : Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      this.wsReconnectTimer = setTimeout(async () => {
        this.wsReconnectTimer = null;
        try {
          await this.connectWebSocket();
          if (this.lastTranslationRequest && this.isTranslationLoading) {
            const resumeRequest = {
              ...this.lastTranslationRequest,
              timestamp: Date.now()
            };
            this.websocket.send(JSON.stringify(resumeRequest));
          }
        } catch (e) {
          // Keep trying while allowed
          if (this.wsShouldReconnect) this.scheduleReconnect();
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
        tag.src = '/assets/external/youtube-iframe-api.js';
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

    async initializePlayer() {
      return new Promise((resolve) => {
        console.log('[YoutubePlayer] initializePlayer videoId=', this.playerVideoId);
        this.player = new YT.Player('youtube-player-container', {
          height: '100%',
          width: '100%',
          videoId: this.playerVideoId,
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
    },

    onPlayerStateChange(event) {
      const isPlaying = event.data === YT.PlayerState.PLAYING;
      this.isPlaying = isPlaying;

      if (event.data === YT.PlayerState.BUFFERING) {
        this.isBuffering = true;
        this.startMiniLoaderPoll();
      } else if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        this.isBuffering = false;
        // keep poll running only if not fully loaded
        if (this.getLoadedFraction() >= 1) this.stopMiniLoaderPoll();
      }

      if (isPlaying) {
        this.startSubtitleSync();
        this.forceHideInput = true;
      } else {
        this.stopSubtitleSync();
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
        const extractedId = this.videoUrl ? this.extractVideoId(this.videoUrl) : (this.isLikelyYoutubeId(this.videoUrl) ? this.videoUrl : null);
        const prevId = this.playerVideoId;
        this.playerVideoId = extractedId || this.playerVideoId;
        if (!this.playerVideoId) {
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
        await this.ensureYouTubeAPIReady();
        if (this.player && prevId && prevId !== this.playerVideoId) {
          console.log('[YoutubePlayer] Reuse existing player loadVideoById', this.playerVideoId);
          try { this.player.loadVideoById(this.playerVideoId); this.setPlayerInitTimeout(); }
          catch(e) { console.warn('[YoutubePlayer] loadVideoById failed, fallback initializePlayer', e); await this.initializePlayer(); }
        } else if (!this.player) {
          await this.initializePlayer();
        }
        this.isLoading = false; // may already be false after onReady
        if (!this.videoReady) {
          // onReady not fired yet; keep status if still initializing
          console.log('[YoutubePlayer] waiting for onReady...');
        } else {
          this.statusMessage = ''; // ensure cleared
        }
        if (this.videoUrl) this.loadSubtitlesInBackground();
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
      this.cleanupPlayer && this.cleanupPlayer();
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

      // Reset inline AI search state
      this.closeAiStream(true);
      this.aiResponseText = '';
      this.aiLastError = '';
    },

    async loadSubtitlesInBackground() {
      if (!this.videoReady) return;

      this.isSubtitlesLoading = true;
      this.subtitlesLoadingComplete = false;
      this.subtitlesLoadingProgress = 0;

      // Start progress animation
      const progressInterval = setInterval(() => {
        if (this.subtitlesLoadingProgress < 90) {
          this.subtitlesLoadingProgress += Math.random() * 15;
        }
      }, 200);

      try {
        const response = await this.retryApiCall(() =>
            downloadVideoScrollingSubtitles(this.videoUrl)
        );

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
              this.playerVideoId = String(maybeYtId);
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

          // Suppress popup: subtitles loaded successfully
          // msgUtil.msgSuccess(this, 'Subtitles loaded successfully!', 2000);

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
          this.handleSubtitlesError(progressInterval, response.reason);
        }
      } catch (error) {
        this.handleSubtitlesError(progressInterval, error);
      }
    },

    handleSubtitlesError(progressInterval, error) {
      clearInterval(progressInterval);
      this.isSubtitlesLoading = false;
      this.subtitlesLoadingComplete = true;
      this.subtitlesLoadingProgress = 0;

      console.error('Error loading subtitles:', error);
      msgUtil.msgError(this, 'Failed to load subtitles', 3000);
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
      const subtitles = [];
      let currentSubtitle = null;
      let parsingCue = false;

      for (const line of lines) {
        if (line.match(/\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/)) {
          if (currentSubtitle) subtitles.push(currentSubtitle);

          const [start, end] = line.split(' --> ');
          currentSubtitle = {
            start: this.parseTime(start),
            end: this.parseTime(end),
            text: ''
          };
          parsingCue = true;
        } else if (parsingCue && line.trim()) {
          currentSubtitle.text += (currentSubtitle.text ? '\n' : '') + line.trim();
        } else if (line.trim() === '' && parsingCue) {
          parsingCue = false;
        }
      }

      if (currentSubtitle) subtitles.push(currentSubtitle);
      this.subtitles = subtitles;
    },

    parseTime(timeStr) {
      const [hours, minutes, seconds] = timeStr.split(':');
      const [secs, ms] = seconds.split('.');
      return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
    },

    // Optimized subtitle sync
    startSubtitleSync() {
      this.stopSubtitleSync();
      this.subtitleInterval = setInterval(() => {
        this.updateCurrentSubtitle();
      }, 100);
    },

    stopSubtitleSync() {
      if (this.subtitleInterval) {
        clearInterval(this.subtitleInterval);
        this.subtitleInterval = null;
      }
    },

    updateCurrentSubtitle() {
      if (!this.player || !this.subtitles.length) return;

      const currentTime = this.player.getCurrentTime();
      const newIndex = this.subtitles.findIndex(subtitle =>
          currentTime >= subtitle.start && currentTime < subtitle.end
      );

      if (newIndex !== this.currentSubtitleIndex) {
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
      if (this.autoCenterEnabled) {
        this.currentSubtitleIndex = index;
        this.$nextTick(() => this.scrollActiveSubtitleIntoView());
      }
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
      if (this.player && this.player.getPlayerState() === YT.PlayerState.PLAYING) {
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
        // Open inline AI dialog directly instead of navigating
        this.showSelectionPopup = true;
      } else {
        this.closePopup();
      }
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

      // Token
      const token = getStore({name: 'access_token'});
      if (!token) {
        this.aiSearchLoading = false;
        this.aiIsStreaming = false;
        this.aiLastError = 'Authentication token not found. Please login again.';
        msgUtil.msgError(this, this.aiLastError);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const aiBase = kiwiConsts.API_BASE.AI_BIZ.replace(/^http(s)?:\/\//, '');
      const wsUrl = `${protocol}//${host}${kiwiConsts.API_BASE.AI_BIZ}/ws/stream?access_token=${encodeURIComponent(token)}`;

      try { this.closeAiStream(); } catch (_) {}
      try { this.aiWebsocket = new WebSocket(wsUrl); } catch (e) {
        this.aiSearchLoading = false;
        this.aiIsStreaming = false;
        this.aiLastError = 'Failed to open WebSocket';
        msgUtil.msgError(this, this.aiLastError);
        return;
      }

      this.aiWebsocket.onopen = () => {
        const request = {
          prompt: prompt,
          promptMode: promptMode,
          targetLanguage: targetLanguage,
          nativeLanguage: nativeLanguage,
          aiUrl: wsUrl,
          timestamp: Date.now(),
          requestId: this.aiRequestId
        };
        try {
          this.aiWebsocket.send(JSON.stringify(request));
        } catch (e) {
          this.handleAiStreamError('Failed to send request');
        }
      };

      this.aiWebsocket.onmessage = (event) => {
        let response;
        try {
          response = JSON.parse(event.data);
        } catch (error) {
          this.handleAiStreamError('Failed to parse response');
          return;
        }

        switch (response.type) {
          case 'connected':
            // no-op
            break;
          case 'started':
            this.aiIsStreaming = true;
            break;
          case 'chunk':
            if (response.chunk) {
              this.aiResponseText += response.chunk;
            }
            break;
          case 'completed':
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
            try { this.aiWebsocket && this.aiWebsocket.close(); } catch (_) {}
            this.aiWebsocket = null;
            break;
          case 'error':
            this.handleAiStreamError((response.message || 'AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : ''));
            break;
          default:
            // ignore
            break;
        }
      };

      this.aiWebsocket.onerror = () => {
        this.handleAiStreamError('WebSocket connection error');
      };

      this.aiWebsocket.onclose = () => {
        this.aiSearchLoading = false;
        this.aiIsStreaming = false;
      };
    },

    handleAiStreamError(message) {
      this.aiSearchLoading = false;
      this.aiIsStreaming = false;
      this.aiLastError = message || 'AI streaming error';
      try { this.aiWebsocket && this.aiWebsocket.close(); } catch (_) {}
      this.aiWebsocket = null;
      msgUtil.msgError(this, this.aiLastError);
    },

    closeAiStream(silent) {
      try { if (this.aiWebsocket) { this.aiWebsocket.close(); } } catch (_) {}
      this.aiWebsocket = null;
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

    scrollActiveSubtitleIntoView() {
      if (this.currentSubtitleIndex == null || this.currentSubtitleIndex < 0) return;
      if (this.scrollingSubtitlesCollapsed) return;

      const activeEl = document.getElementById(`subtitle-${this.currentSubtitleIndex}`);
      if (!activeEl) return;

      const containerEl = this.getScrollableSubtitlesContainer(activeEl);
      if (!containerEl) return;

      try {
        const relativeTop = this.getOffsetTopRelativeTo(activeEl, containerEl);
        const target = Math.max(0, relativeTop - (containerEl.clientHeight / 2) + (activeEl.offsetHeight / 2));
        containerEl.scrollTo({ top: target, behavior: 'smooth' });
      } catch (e) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    },

    toggleScrollingSubtitles() {
      this.scrollingSubtitlesCollapsed = !this.scrollingSubtitlesCollapsed;
      // Suppress popup on expand/collapse of subtitles timeline
      // const action = this.scrollingSubtitlesCollapsed ? 'collapsed' : 'expanded';
      // msgUtil.msgSuccess(this, `Subtitles timeline ${action}`, 1000);
      if (!this.scrollingSubtitlesCollapsed) {
        this.$nextTick(() => this.scrollActiveSubtitleIntoView());
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
        this.disconnectWebSocket();
      }

      msgUtil.msgSuccess(this, 'Loading cancelled', 2000);
    },

    minimizeSubtitlesStatus() {
      this.subtitlesLoadingComplete = false;
      msgUtil.msgSuccess(this, 'Status minimized', 1500);
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
        this.loadContent();
      } else if (!enabled) {
        this.shouldShowTranslationContainer = false;
        this.disconnectWebSocket();
      }
    },

    selectedLanguageChange(language) {
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

    onAutoCenterChange(enabled) {
      setStore({ name: kiwiConsts.CONFIG_KEY.SUBTITLES_AUTO_CENTER, content: enabled, type: 'local' });
      if (enabled) {
        this.$nextTick(() => this.scrollActiveSubtitleIntoView());
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
/* Base styles */
.youtube-player {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

/* Header */
.header-container {
  margin: 8px 0;
  padding: 0 20px;
}

.main-title {
  margin: 0;
  padding: 10px 16px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.main-title:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.main-title i {
  margin-right: 6px;
  font-size: 16px;
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

.url-input .el-input__inner {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.url-input .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.url-input .el-input__inner:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.load-button {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
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
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  min-width: 100px;
  justify-content: center;
}

.load-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.load-button:disabled {
  background: linear-gradient(135deg, #c0c4cc 0%, #c0c4cc 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
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
  color: #409eff;
  pointer-events: none;
  opacity: 0.7;
}

.enhanced-switch {
  margin: 0;
}

.enhanced-switch .el-switch__label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.enhanced-switch .el-switch__core {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.enhanced-switch.is-checked .el-switch__core {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
}

.divider {
  width: 1px;
  height: 20px;
  background: #e4e7ed;
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
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  color: #606266;
  border-radius: 999px;
  padding: 6px 10px;
}
.compact-status .spinning { animation: spin 1s linear infinite; }
.compact-status-text { font-size: 12px; font-weight: 500; }
.compact-progress {
  width: 90px;
  height: 4px;
  background: #f2f3f5;
  border-radius: 999px;
  overflow: hidden;
}
.compact-progress-fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  transition: width 0.25s ease;
}

.status-message {
  padding: 10px 12px;
  margin: 0;
  color: #f56c6c;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #fde2e2;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
.status-message.compact { border-radius: 999px; }

/* Subtitles Loading Overlay */
.subtitles-loading-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  animation: slideInFromRight 0.3s ease-out;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.subtitles-loading-container {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e4e7ed;
  min-width: 280px;
  max-width: 320px;
  position: relative;
  backdrop-filter: blur(10px);
}

.subtitles-loading-icon {
  text-align: center;
  margin-bottom: 12px;
}

.subtitles-loading-icon i {
  font-size: 24px;
  color: #409eff;
}

.success-icon {
  color: #67c23a !important;
}

.warning-icon {
  color: #e6a23c !important;
}

.subtitles-loading-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.subtitles-loading-text > span {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
  text-align: center;
}

.subtitles-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.subtitles-progress-bar {
  flex: 1;
  height: 6px;
  background: #f0f2f5;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.subtitles-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
}

.subtitles-progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.subtitles-progress-text {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}

.subtitles-status {
  width: 100%;
}

.status-indicators {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.status-item.success {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
}

.status-item.failed {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.2);
}

.status-item.disabled {
  color: #909399;
  background: rgba(144, 147, 153, 0.1);
  border-color: rgba(144, 147, 153, 0.2);
}

.status-item i {
  font-size: 14px;
}

.subtitles-loading-actions {
  position: absolute;
  top: 8px;
  right: 8px;
}

.subtitles-loading-close,
.subtitles-loading-minimize {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #909399;
}

.subtitles-loading-close:hover,
.subtitles-loading-minimize:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #606266;
  transform: scale(1.1);
}

.subtitles-loading-close i,
.subtitles-loading-minimize i {
  font-size: 12px;
}

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
  gap: 15px;
}

.right-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.video-section {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  position: relative;
}

.video-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #000;
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
.subtitles-context-display {
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

.previous-subtitle {
  padding: 6px 10px;
  font-size: 11px;
  color: #909399;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  white-space: pre-wrap;
  line-height: 1.2;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

.current-subtitle-display {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 8px 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
  position: relative;
  -webkit-touch-callout: none;
  line-height: 1.2;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.next-subtitle {
  padding: 6px 10px;
  font-size: 11px;
  color: #606266;
  background: #f0f2f5;
  border-top: 1px solid #e9ecef;
  white-space: pre-wrap;
  line-height: 1.2;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

/* Subtitles Container */
.subtitles-container {
  flex: 1;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 200px;
  position: relative;
  scrollbar-width: thin;
  margin-bottom: 10px;
}

.subtitles-container::-webkit-scrollbar {
  width: 8px;
}

.subtitles-container::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
}

.subtitles-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc 0%, #909399 100%);
  border-radius: 4px;
}

.subtitles-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

/* Updated Subtitles Header - matching translated-subtitles-header style */
.subtitles-header {
  padding: 10px 16px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
  position: sticky;
  top: 0;
  z-index: 10;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.subtitles-header:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.subtitles-header i {
  font-size: 15px;
  color: white;
}

.subtitle-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 4px;
}

.header-toggle-hint {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* New: add a bit of spacing between the download button and the arrow icon */
.header-action-btn {
  margin-right: 10px;
}

.toggle-arrow {
  font-size: 14px;
  transition: transform 0.3s ease;
  color: white;
}

.subtitles-wrapper {
  padding: 16px;
  min-height: calc(100% + 50px);
  scroll-behavior: smooth;
  overflow-y: auto;
  scroll-padding-top: 20px;
  scroll-padding-bottom: 20px;
}

.subtitles-container p {
  margin: 4px 0;
  padding: 8px 12px;
  transition: all 0.3s ease;
  border-radius: 8px;
  cursor: pointer;
  line-height: 1.4;
  font-size: 14px;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  scroll-margin-top: 20px;
  scroll-margin-bottom: 20px;
}

.subtitles-container p:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #bae7ff;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.subtitles-container p::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
}

/* Subtitle state styles */
.subtitles-container p.active-subtitle {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #a0d8ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.18);
}
.subtitles-container p.active-subtitle::before {
  background: #409eff;
}
.subtitles-container p.past-subtitle {
  opacity: 0.7;
}
.subtitles-container p.future-subtitle {
  opacity: 0.95;
}

/* Translated Subtitles Container */
.translated-subtitles-container {
  flex: 1;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 200px;
  position: relative;
  scrollbar-width: thin;
}

.translated-subtitles-container::-webkit-scrollbar {
  width: 8px;
}

.translated-subtitles-container::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
}

.translated-subtitles-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc 0%, #909399 100%);
  border-radius: 4px;
}

.translated-subtitles-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

.translated-subtitles-header {
  padding: 10px 16px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.translated-subtitles-header i {
  font-size: 15px;
  color: white;
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
  color: #409eff;
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
  background: linear-gradient(90deg, #409eff, #67c23a);
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
  color: #409eff;
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}

.translation-content {
  padding: 20px;
  line-height: 1.8;
  font-size: 15px;
  color: #2c3e50;
  text-align: justify;
}

/* AI Search Dialog */
.ai-dialog-content { padding: 10px 0; }
.selected-text-preview { margin-bottom: 10px; color: #606266; }
.ai-response { max-height: 45vh; overflow-y: auto; padding: 10px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; }
.inline-error { color: #f56c6c; background: #fdecea; border: 1px solid #f5c2c0; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }

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

/* Responsive Design */
@media (max-width: 767px) {
  .header-container {
    margin: 3px 0;
    padding: 0 10px;
  }

  .main-title {
    font-size: 13px;
    padding: 5px 8px;
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
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
  }

  .action-buttons {
    width: 100%;
    justify-content: center;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .load-button {
    flex: 1;
    max-width: none;
    min-width: 80px;
    padding: 8px 12px;
    font-size: 12px;
    height: 32px;
  }

  .action-btn {
    width: 32px;
    height: 32px;
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
    color: #606266;
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

  .content-container {
    padding: 0 10px;
    height: calc(100vh - 120px);
    gap: 8px;
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

/* iPad and larger screens */
@media (min-width: 992px) {
  .content-container {
    flex-direction: row;
    gap: 25px;
  }

  .left-panel {
    width: 50%;
    height: 100%;
  }

  .right-panel {
    width: 50%;
    height: 100%;
    border-left: 1px solid #e4e7ed;
    padding-left: 15px;
  }

  .video-section {
    flex: 1 0 auto;
    min-height: 45vh;
  }

  .subtitles-container {
    flex: 1;
    height: calc(50% - 25px);
    margin-bottom: 10px;
  }

  .translated-subtitles-container {
    flex: 1;
    height: calc(50% - 25px);
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
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* High contrast support */
@media (prefers-contrast: more) {
  .main-title,
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
    background: #409eff;
  }

  .loading-spinner .spinner-ring {
    animation: none;
    border: 3px solid #409eff;
  }

  .subtitles-wrapper {
    scroll-behavior: auto !important;
  }
}

/* Favorite overlay styles */
/* .favorite-overlay { display: none; } */
.favorite-top-group .favorite-btn {
  background: rgba(255,255,255,0.95);
  color: #909399;
}
.favorite-top-group .favorite-btn.favorited {
  color: #f7ba2a;
}
</style>

