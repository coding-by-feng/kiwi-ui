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
      </div>
    </div>

    <!-- Enhanced Status Message with Loading Animation -->
    <div class="status-container" v-show="!isPlaying && !forceHideInput && statusMessage !== ''">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-animation">
          <div class="loading-spinner">
            <div class="loading-spinner-ring"></div>
            <div class="loading-spinner-ring"></div>
            <div class="loading-spinner-ring"></div>
          </div>
          <div class="loading-text">
            <span class="loading-message">{{ statusMessage || 'Loading video...' }}</span>
            <div class="loading-dots">
              <span class="dot dot-1">.</span>
              <span class="dot dot-2">.</span>
              <span class="dot dot-3">.</span>
            </div>
          </div>
        </div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">Preparing video player...</div>
        </div>
      </div>
      <p v-else class="status-message">{{ statusMessage }}</p>
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
    <div class="content-container" v-if="videoUrl && videoUrl !== ''">
      <!-- Left Panel (video and controls) -->
      <div class="left-panel">
        <!-- Video Player Section -->
        <div class="video-section">
          <div class="video-container">
            <div id="youtube-player-container"></div>
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

      <!-- Right Panel (subtitles) -->
      <div class="right-panel">
        <!-- Enhanced Subtitles List -->
        <div class="subtitles-header clickable-header" @click="toggleScrollingSubtitles">
          <i class="el-icon-document"></i>
          <span>Subtitles Timeline</span>
          <span class="subtitle-count">({{ subtitles.length }})</span>
          <div class="header-toggle-hint">
            <i :class="scrollingSubtitlesCollapsed ? 'el-icon-arrow-right' : 'el-icon-arrow-down'" class="toggle-arrow"></i>
          </div>
        </div>
        <div class="subtitles-container" v-if="subtitles.length && !scrollingSubtitlesCollapsed">
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

      <!-- Enhanced Vocabulary Lookup Popup -->
      <div
          v-if="showSelectionPopup"
          ref="vocabularyPopup"
          class="vocabulary-popup"
          @click="navigateToTools"
      >
        <i class="el-icon-search"></i>
        <span>"{{ selectedText }}"</span>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from 'vue';
import {downloadVideoScrollingSubtitles, deleteVideoSubtitles} from '@/api/ai';
import msgUtil from '@/util/msg';
import util from '@/util/util';
import kiwiConsts from "@/const/kiwiConsts";
import {getStore, setStore} from "@/util/store";
import kiwiConst from "@/const/kiwiConsts";
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true
});

export default defineComponent({
  name: 'YoutubeSubtitleDownloader',
  data() {
    return {
      videoUrl: null,
      ifTranslation: getStore({name: kiwiConsts.CONFIG_KEY.IF_SUBTITLES_TRANSLATION}) || false,
      selectedLanguage: getStore({name: kiwiConsts.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE}) || null,
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      videoId: null,
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
      showSelectionPopup: false,
      isPlaying: false,
      videoReady: false,

      // WebSocket streaming
      websocket: null,
      wsUrl: '/ai-biz/ai/ws/ytb/subtitle',
      isTranslationLoading: false,
      translationProgress: 0,
      translationChunks: [],
      wsConnectionStatus: 'disconnected',
      streamingStartTime: null,
      streamingBuffer: '',
      shouldShowTranslationContainer: false,

      // Optimized debouncing
      scrollTimeout: null,
      progressUpdateInterval: null,
      // New: downloading state
      isDownloading: false,
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
    }
  },
  watch: {
    videoId: {
      handler(newVideoId, oldVideoId) {
        if (newVideoId && oldVideoId && newVideoId !== oldVideoId) {
          this.reinitializePlayer();
        }
      }
    },
    '$route.query.videoUrl': {
      handler(newVideoUrl) {
        if (newVideoUrl && newVideoUrl !== encodeURIComponent(this.videoUrl)) {
          this.videoUrl = decodeURIComponent(newVideoUrl);
          this.loadContent();
        }
      }
    }
  },
  mounted() {
    this.initializeComponent();

    const videoUrl = this.$route.query.videoUrl;
    if (videoUrl) {
      this.videoUrl = decodeURIComponent(videoUrl);
      this.loadContent();
    }
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    // Initialization
    initializeComponent() {
      this.loadYouTubeAPI();
      this.setupEventListeners();
      this.checkScreenSize();
      this.applyTouchPreventions();
      this.updateDisplayStyle();
    },

    setupEventListeners() {
      document.addEventListener('click', this.handleClickOutside);
      window.addEventListener('resize', this.debounce(this.checkScreenSize, 250));
      window.addEventListener('resize', this.debounce(this.updateDisplayStyle, 250));
    },

    cleanup() {
      this.stopSubtitleSync();
      this.disconnectWebSocket();
      this.clearTimeouts();

      if (this.player) {
        this.player.destroy();
        this.player = null;
      }

      document.removeEventListener('click', this.handleClickOutside);
      window.removeEventListener('resize', this.checkScreenSize);
      window.removeEventListener('resize', this.updateDisplayStyle);
    },

    clearTimeouts() {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = null;
      }
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    },

    // WebSocket optimized streaming
    async connectWebSocket() {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        return Promise.resolve();
      }

      this.disconnectWebSocket();

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
            this.websocket?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'connected';
          resolve();
        };

        this.websocket.onmessage = this.handleWebSocketMessage;

        this.websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'disconnected';
          this.websocket = null;

          if (event.code === 1008 || event.code === 1011) {
            this.handleWebSocketError(new Error('Authentication failed'), 'Authentication failed. Please login again.');
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'error';
          this.handleWebSocketError(error, 'Failed to connect to translation service.');
          reject(error);
        };
      });
    },

    disconnectWebSocket() {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
        this.wsConnectionStatus = 'disconnected';
      }
    },

    handleWebSocketMessage(event) {
      try {
        const response = JSON.parse(event.data);

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

      this.startProgressAnimation();
    },

    handleTranslationChunk(chunk) {
      if (!chunk) return;

      // Process chunk to handle newlines before adding to array
      const processedChunk = chunk.replace(/\\n|\n/g, '<br>');
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

      if (response.fullResponse) {
        this.translatedSubtitles = response.fullResponse;
      }

      this.stopProgressAnimation();
      msgUtil.msgSuccess(this, 'Translation completed successfully!', 2000);

      this.$nextTick(() => {
        this.applyTouchPreventions();
      });
    },

    handleTranslationError(response) {
      this.isTranslationLoading = false;
      this.translationProgress = 0;
      this.subtitlesLoadingComplete = true;
      this.shouldShowTranslationContainer = false; // Hide container on error

      this.stopProgressAnimation();

      let errorMessage = response.message || 'Translation failed';
      if (response.errorCode === 'AUTHENTICATION_ERROR' || response.errorCode === 'UNAUTHORIZED') {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (response.errorCode === 'RATE_LIMIT_EXCEEDED') {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }

      msgUtil.msgError(this, errorMessage, 3000);
    },

    handleWebSocketError(error, message) {
      console.error('WebSocket error:', error);
      msgUtil.msgError(this, message, 3000);
    },

    async requestTranslation(videoUrl, language) {
      try {
        // Show translation container immediately when starting WS streaming
        this.shouldShowTranslationContainer = true;
        this.translatedSubtitlesCollapsed = false; // Ensure it's expanded

        await this.connectWebSocket();

        const request = {
          videoUrl: videoUrl,
          language: language,
          requestType: 'TRANSLATION',
          timestamp: Date.now()
        };

        this.websocket.send(JSON.stringify(request));
      } catch (error) {
        this.handleWebSocketError(error, 'Failed to start translation: ' + error.message);
        this.isTranslationLoading = false;
        this.subtitlesLoadingComplete = true;
        this.shouldShowTranslationContainer = false;
      }
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

    loadYouTubeAPI() {
      if (!document.getElementById('youtube-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api-script';
        tag.src = '/assets/external/youtube-iframe-api.js';
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (this.videoId) {
          this.initializePlayer();
        }
      };
    },

    async initializePlayer() {
      return new Promise((resolve) => {
        this.player = new YT.Player('youtube-player-container', {
          height: '100%',
          width: '100%',
          videoId: this.videoId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            autoplay: 0
          },
          events: {
            onReady: (event) => {
              this.onPlayerReady(event);
              resolve();
            },
            onStateChange: this.onPlayerStateChange
          }
        });
      });
    },

    onPlayerReady(event) {
      this.videoReady = true;
      msgUtil.msgSuccess(this, 'Video ready to play!', 2000);
    },

    onPlayerStateChange(event) {
      const isPlaying = event.data === YT.PlayerState.PLAYING;
      this.isPlaying = isPlaying;

      if (isPlaying) {
        this.startSubtitleSync();
        this.forceHideInput = true;
      } else {
        this.stopSubtitleSync();
      }
    },

    // Optimized content loading
    async loadContent() {
      this.resetStates();

      try {
        const videoId = this.extractVideoId(this.videoUrl);
        if (!videoId) {
          this.statusMessage = 'Invalid YouTube URL';
          this.isLoading = false;
          return;
        }

        this.videoId = videoId;
        this.statusMessage = 'Initializing player...';

        await this.initializePlayer();

        this.isLoading = false;
        this.statusMessage = '';

        // Load subtitles in background
        this.loadSubtitlesInBackground();

      } catch (error) {
        console.error('Error loading content:', error);
        this.statusMessage = 'Failed to load content';
        this.isLoading = false;
      }
    },

    resetStates() {
      this.cleanup();
      this.isLoading = true;
      this.videoReady = false;
      this.videoId = null;
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
          this.scrollingSubtitles = response.value.data.data;
          this.parseSubtitles(this.scrollingSubtitles);

          clearInterval(progressInterval);
          this.subtitlesLoadingProgress = 100;
          this.isSubtitlesLoading = false;
          this.middleControlEnabled = true;

          msgUtil.msgSuccess(this, 'Subtitles loaded successfully!', 2000);

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
    },

    pauseVideo() {
      if (this.player && this.player.getPlayerState() === YT.PlayerState.PLAYING) {
        this.player.pauseVideo();
      }
    },

    // Text selection and vocabulary
    handleTextSelection(event) {
      this.showQueryingWords(event);
    },

    handleTextSelectionWithPausing(event) {
      this.pauseVideo();
      this.handleTextSelection(event);
    },

    showQueryingWords(event) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        this.positionPopup(selection, event);
      } else {
        this.closePopup();
      }
    },

    positionPopup(selection, event) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (this.isMobileDevice()) {
        setTimeout(() => selection.removeAllRanges(), 10);
        event.preventDefault();
      }

      this.showSelectionPopup = true;

      this.$nextTick(() => {
        const popup = document.querySelector('.vocabulary-popup');
        if (popup) {
          const viewportWidth = window.innerWidth;
          const popupWidth = popup.offsetWidth;
          let left = rect.left + (rect.width / 2);

          left = Math.max(10 + (popupWidth / 2), Math.min(left, viewportWidth - 10 - (popupWidth / 2)));

          popup.style.left = `${left}px`;
          popup.style.top = `${rect.bottom + 10}px`;
          popup.style.transform = 'translateX(-50%)';
        }
      });

      event.preventDefault();
    },

    navigateToTools() {
      const cleanedText = this.selectedText.replace(/\n/g, ' ').trim();
      const encodedText = encodeURIComponent(cleanedText);

      this.player.pauseVideo();
      this.$router.push({
        path: '/index/tools/aiResponseDetail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value,
          language: getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
          originalText: encodedText,
          ytbMode: 'player',
          now: Date.now()
        }
      });
    },

    closePopup() {
      this.showSelectionPopup = false;
      this.selectedText = '';
    },

    handleClickOutside(event) {
      const popup = document.querySelector('.vocabulary-popup');
      const interactiveElements = document.querySelectorAll('.subtitles-context-display, .subtitles-container, .translated-subtitles-container');

      if (popup && !Array.from(interactiveElements).some(el => el.contains(event.target))) {
        this.closePopup();
      }
    },

    // UI state management
    getSubtitleClass(index) {
      return {
        'active-subtitle': this.currentSubtitleIndex === index,
        'past-subtitle': index < this.currentSubtitleIndex,
        'future-subtitle': index > this.currentSubtitleIndex
      };
    },

    toggleScrollingSubtitles() {
      this.scrollingSubtitlesCollapsed = !this.scrollingSubtitlesCollapsed;
      const action = this.scrollingSubtitlesCollapsed ? 'collapsed' : 'expanded';
      msgUtil.msgSuccess(this, `Subtitles timeline ${action}`, 1000);
    },

    toggleTranslatedSubtitles() {
      this.translatedSubtitlesCollapsed = !this.translatedSubtitlesCollapsed;
      const action = this.translatedSubtitlesCollapsed ? 'collapsed' : 'expanded';
      msgUtil.msgSuccess(this, `Translated subtitles ${action}`, 1000);
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
        const videoId = this.extractVideoId(this.videoUrl);
        const languageCode = this.selectedLanguage || 'translated';
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const filename = `youtube_${videoId}_${languageCode}_subtitles_${timestamp}.txt`;

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

    // Remove or comment out the old downloadSubtitlesTxt method since it's no longer needed
    /*
    async downloadSubtitlesTxt() {
      // This method is replaced by downloadTranslatedSubtitlesFromUI
    },
    */

    // Utilities
    extractVideoId(url) {
      try {
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

    isSafariOrIOS() {
      const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return isSafariBrowser || isIOS;
    },

    isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    },

    checkScreenSize() {
      this.isSmallScreen = window.innerWidth < 768;
    },

    updateDisplayStyle() {
      const container = document.getElementById('responsiveContainer');
      if (container) {
        container.style.display = this.isMobileDevice() || this.isSmallScreen ? 'inline' : 'flex';
        if (!this.isMobileDevice() && !this.isSmallScreen) {
          container.style.justifyContent = 'center';
          container.style.alignItems = 'center';
        }
      }
    },

    applyTouchPreventions() {
      this.$nextTick(() => {
        const elements = document.querySelectorAll(
            '.current-subtitle-display, .previous-subtitle, .next-subtitle, .subtitles-wrapper p, .translation-content'
        );

        elements.forEach(el => {
          if (el) {
            Object.assign(el.style, {
              webkitTouchCallout: 'none',
              webkitUserSelect: 'text',
              userSelect: 'text'
            });

            el.addEventListener('contextmenu', (e) => {
              if (this.isMobileDevice()) e.preventDefault();
            });
          }
        });
      });
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    async cleanSubtitles() {
      try {
        await deleteVideoSubtitles(this.videoUrl, this.selectedLanguage);
        msgUtil.msgSuccess(this, 'Subtitles cleaned successfully!', 2000);
      } catch (error) {
        msgUtil.msgError(this, 'Failed to clean subtitles', 2000);
      }
    }
  }
});
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
  padding: 20px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
  max-width: 400px;
  width: 100%;
}

.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #409eff;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: #67c23a;
  animation-delay: 0.3s;
  animation-duration: 1.5s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #e6a23c;
  animation-delay: 0.6s;
  animation-duration: 1.8s;
}

.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-message {
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
  text-align: center;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #f0f2f5;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c, #409eff);
  background-size: 200% 100%;
  border-radius: 3px;
  animation: progress-flow 2s linear infinite;
  width: 100%;
}

@keyframes progress-flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.progress-text {
  font-size: 12px;
  color: #909399;
  text-align: center;
  font-style: italic;
}

.status-message {
  padding: 16px 20px;
  margin: 0;
  color: #f56c6c;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #fde2e2;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

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
  transition: all 0.3s ease;
}

.active-subtitle {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  border-radius: 8px;
  transform: translateX(8px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  font-weight: 600;
  scroll-margin-top: 40px;
  scroll-margin-bottom: 40px;
}

.active-subtitle::before {
  background: white;
}

.past-subtitle {
  color: #909399;
  background: #f8f9fa;
  border-color: #e9ecef;
}

.past-subtitle::before {
  background: #e9ecef;
}

.future-subtitle {
  color: #606266;
  background: white;
}

.future-subtitle::before {
  background: #f0f2f5;
}

.scroll-filler {
  margin-top: 20px;
  height: 50px;
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

/* Vocabulary Popup */
.vocabulary-popup {
  position: fixed;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
  max-width: 60%;
  text-overflow: ellipsis;
  overflow: hidden;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 8px;
}

.vocabulary-popup::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: transparent transparent #409eff transparent;
}

.vocabulary-popup:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.vocabulary-popup i {
  font-size: 16px;
}

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
@media (prefers-contrast: high) {
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
</style>

