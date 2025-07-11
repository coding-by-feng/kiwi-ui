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
            <el-button type="info" icon="el-icon-back" size="small" circle @click="backToChannelList" class="action-btn"></el-button>
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
              v-model="autoScrollEnabled"
              :active-text="isSmallScreen ? '' : 'Scrolling'"
              class="enhanced-switch">
            <template v-if="isSmallScreen" #inactive-icon>
              <i class="el-icon-position"></i>
            </template>
            <template v-if="isSmallScreen" #active-icon>
              <i class="el-icon-sort"></i>
            </template>
          </el-switch>
          <span v-if="isSmallScreen" class="mobile-switch-label">
            <i class="el-icon-sort"></i>
          </span>
        </div>
        <div class="divider" v-if="!isSmallScreen"></div>
        <div class="switch-group">
          <el-switch
              v-model="middleControlEnabled"
              :active-text="isSmallScreen ? '' : 'Middle-Control'"
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
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
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

    <!-- Background Subtitles Loading Indicator -->
    <div v-if="isSubtitlesLoading" class="subtitles-loading-overlay">
      <div class="subtitles-loading-container">
        <div class="subtitles-loading-icon">
          <i class="el-icon-loading spinning"></i>
        </div>
        <div class="subtitles-loading-text">
          <span>Loading subtitles...</span>
          <div class="subtitles-progress">
            <div class="subtitles-progress-bar">
              <div class="subtitles-progress-fill" :style="{ width: subtitlesLoadingProgress + '%' }"></div>
            </div>
            <span class="subtitles-progress-text">{{ Math.round(subtitlesLoadingProgress) }}%</span>
          </div>
        </div>
        <div class="subtitles-loading-close" @click="cancelSubtitlesLoading">
          <i class="el-icon-close"></i>
        </div>
      </div>
    </div>

    <!-- Enhanced Content Container -->
    <div class="content-container" v-if="videoUrl && videoUrl !== ''">
      <!-- Left Panel (video and controls) -->
      <div class="left-panel">
        <!-- Video Player Section -->
        <div class="video-section">
          <!-- Video Player -->
          <div class="video-container">
            <div id="youtube-player-container"></div>
          </div>
        </div>

        <!-- Enhanced Subtitle Display with Previous, Current, and Next Lines -->
        <div class="subtitles-context-display"
             v-if="isSafariOrIOS || currentSubtitleIndex !== -1 && subtitles.length && (ifTranslation || (!ifTranslation && !ifProfessionalSubtitles))"
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
        <div class="subtitles-container" v-if="subtitles.length">
          <div class="subtitles-header">
            <i class="el-icon-document"></i>
            <span>Subtitles Timeline</span>
          </div>
          <div class="subtitles-wrapper"
               @mouseup="handleTextSelection"
               @touchend="handleTextSelection">
            <p v-show="!ifTranslation"
               v-for="(subtitle, index) in subtitles"
               :key="index"
               :class="{
                  'active-subtitle': currentSubtitleIndex === index,
                  'past-subtitle': index < currentSubtitleIndex,
                  'future-subtitle': index > currentSubtitleIndex
                }"
               :id="`subtitle-${index}`"
               @click="jumpToSubtitle(index)"
            >
              {{ subtitle.text }}
            </p>
            <div v-show="ifTranslation" class="translation-content" v-html="parsedResponseText"></div>
            <!-- Add a dummy element to ensure the last subtitle is fully visible -->
            <div class="scroll-filler" v-if="subtitles.length > 0"></div>
          </div>
        </div>
      </div>

      <!-- Enhanced Vocabulary Lookup Popup -->
      <div
          v-if="showSelectionPopup"
          ref="vocabularyPopup"
          class="vocabulary-popup"
          @click="navigateToVocabulary"
      >
        <i class="el-icon-search"></i>
        <span>"{{ selectedText }}"</span>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent, ref} from 'vue';
import {downloadVideoSubtitles, deleteVideoSubtitles} from '@/api/ai';
import msgUtil from '@/util/msg'
import util from '@/util/util'
import kiwiConsts from "@/const/kiwiConsts";
import {getStore, setStore} from "@/util/store";
import kiwiConst from "@/const/kiwiConsts";
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export default defineComponent({
  name: 'YoutubeSubtitleDownloader',
  data() {
    return {
      videoUrl: null,
      ifTranslation: getStore({name: kiwiConsts.CONFIG_KEY.IF_SUBTITLES_TRANSLATION}) ? getStore({name: kiwiConsts.CONFIG_KEY.IF_SUBTITLES_TRANSLATION}) : false,
      selectedLanguage: getStore({name: kiwiConsts.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE}) ? getStore({name: kiwiConsts.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE}) : null,
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
      videoId: null,
      subtitles: [],
      translatedSubtitles: '',
      subtitlesType: null,
      statusMessage: '',
      isLoading: false,
      isSubtitlesLoading: false, // New: separate loading state for subtitles
      subtitlesLoadingProgress: 0, // New: progress tracking
      player: null,
      currentSubtitleIndex: -1,
      subtitleInterval: null,
      lastScrollTime: 0,
      visibilityCheckInterval: null,
      autoScrollEnabled: true,
      middleControlEnabled: true,
      forceHideInput: false,
      isSmallScreen: false,
      selectedText: '',
      showSelectionPopup: false,
      isPlaying: false,
      videoReady: false, // New: track video readiness
    };
  },
  computed: {
    parsedResponseText() {
      console.log('this.translatedSubtitles', this.translatedSubtitles)
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
  },
  mounted() {
    this.loadYouTubeAPI();
    document.addEventListener('click', this.handleClickOutside);
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
    this.applyTouchPreventions();
    this.updateDisplayStyle();

    const videoUrl = this.$route.query.videoUrl;
    if (videoUrl) {
      this.videoUrl = decodeURIComponent(videoUrl);
      this.loadContent();
    }
  },
  watch: {
    videoId: {
      handler(newVideoId, oldVideoId) {
        if (newVideoId && oldVideoId && newVideoId !== oldVideoId) {
          if (this.player) {
            this.player.destroy();
            this.player = null;
          }
          this.initializePlayer();
        }
      }
    },
    '$route.query.videoUrl': function(newVideoUrl) {
      if (newVideoUrl && newVideoUrl !== encodeURIComponent(this.videoUrl)) {
        this.videoUrl = decodeURIComponent(newVideoUrl);
        this.loadContent();
      }
    }
  },
  methods: {
    backToChannelList() {
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: {
          active: 'youtube',
          ytbMode: 'channel'
        }
      });
    },
    isSafariOrIOS() {
      const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return isSafariBrowser || isIOS;
    },
    isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    },
    ifTranslationOnChange(item) {
      setStore({
        name: kiwiConst.CONFIG_KEY.IF_SUBTITLES_TRANSLATION,
        content: item,
        type: 'local'
      })
      if (item && !util.isEmptyStr(this.selectedLanguage) && !util.isEmptyStr(this.videoUrl) && util.isEmptyStr(this.translatedSubtitles)) {
        this.loadContent()
      }
      console.log('ifTranslationOnChange', this.ifTranslation);
    },
    selectedLanguageChange(item) {
      console.log('selectedLanguageChange', item)
      setStore({
        name: kiwiConst.CONFIG_KEY.SUBTITLES_TRANSLATION_SELECTED_LANGUAGE,
        content: item,
        type: 'local'
      })
      setStore({
        name: kiwiConst.CONFIG_KEY.IF_SUBTITLES_TRANSLATION,
        content: true,
        type: 'local'
      })
    },
    applyTouchPreventions() {
      this.$nextTick(() => {
        const subtitleElements = document.querySelectorAll('.current-subtitle-display, .previous-subtitle, .next-subtitle, .subtitles-wrapper p');
        subtitleElements.forEach(el => {
          if (el) {
            el.style.webkitTouchCallout = 'none';
            el.style.webkitUserSelect = 'text';
            el.style.khtmlUserSelect = 'text';
            el.style.mozUserSelect = 'text';
            el.style.msUserSelect = 'text';
            el.style.userSelect = 'text';
            el.addEventListener('contextmenu', (e) => {
              if (this.isMobileDevice()) {
                e.preventDefault();
              }
            });
          }
        });
      });
    },
    pauseVideo() {
      if (this.player && this.player.getPlayerState() === YT.PlayerState.PLAYING) {
        this.player.pauseVideo();
      }
    },
    showQueryingWords(event) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (this.isMobileDevice()) {
          setTimeout(() => {
            selection.removeAllRanges();
          }, 10);
          event.preventDefault();
        }

        this.showSelectionPopup = true;

        this.$nextTick(() => {
          const popup = document.querySelector('.vocabulary-popup');
          if (popup) {
            const viewportWidth = window.innerWidth;
            const popupWidth = popup.offsetWidth;
            let left = rect.left + (rect.width / 2);

            if (left - (popupWidth / 2) < 10) {
              left = 10 + (popupWidth / 2);
            } else if (left + (popupWidth / 2) > viewportWidth - 10) {
              left = viewportWidth - 10 - (popupWidth / 2);
            }

            popup.style.left = `${left}px`;
            popup.style.top = `${rect.bottom + 10}px`;
            popup.style.transform = 'translateX(-50%)';
          }
        });

        event.preventDefault();
      } else {
        this.closePopup();
      }
    },
    handleTextSelectionWithPausing(event) {
      this.pauseVideo();
      this.handleTextSelection(event)
    },
    handleTextSelection(event) {
      this.showQueryingWords(event);
    },
    navigateToVocabulary() {
      const cleanedText = this.selectedText.replace(/\n/g, ' ').trim();
      const encodedText = encodeURIComponent(cleanedText);
      console.log('encodedText = ', encodedText)
      this.player.pauseVideo();
      this.$router.push({
        path: '/index/vocabulary/aiResponseDetail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value,
          language: getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) ? getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) : kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
          originalText: encodedText,
          ytbMode: 'player',
          now: new Date().getTime()
        }
      })
    },
    closePopup() {
      this.showSelectionPopup = false;
      this.selectedText = '';
    },
    handleClickOutside(event) {
      const popup = document.querySelector('.vocabulary-popup');
      const subtitleDisplay = document.querySelector('.subtitles-context-display');
      const subtitlesContainer = document.querySelector('.subtitles-container');

      if (popup &&
          !(popup.contains(event.target) ||
              (subtitleDisplay && subtitleDisplay.contains(event.target)) ||
              (subtitlesContainer && subtitlesContainer.contains(event.target)))) {
        this.closePopup();
      }
    },
    jumpToSubtitle(index) {
      if (!this.player || !this.subtitles[index]) return;
      this.player.seekTo(this.subtitles[index].start, true);
      if (this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
        this.player.playVideo();
      }
    },
    loadYouTubeAPI() {
      if (!document.getElementById('youtube-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (this.videoId) {
          this.initializePlayer();
        }
      };
    },
    initializePlayer() {
      return new Promise((resolve) => {
        // Create YouTube player
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
      console.log('Player ready');
      this.videoReady = true;
      msgUtil.msgSuccess(this, 'Video ready to play!', 2000);
    },
    onPlayerStateChange(event) {
      this.isPlaying = false;
      if (event.data === YT.PlayerState.PLAYING) {
        this.startSubtitleSync();
        this.isPlaying = true;
        this.forceHideInput = true;
      } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        this.stopSubtitleSync();
        this.stopVisibilityCheck();
      }
    },
    stopVisibilityCheck() {
      if (this.visibilityCheckInterval) {
        clearInterval(this.visibilityCheckInterval);
        this.visibilityCheckInterval = null;
      }
    },
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
    async loadContent() {
      // Reset player state for new video
      if (this.player) {
        this.stopSubtitleSync();
        this.stopVisibilityCheck();
        this.player.destroy();
        this.player = null;
      }

      // Reset states
      this.isLoading = true;
      this.videoReady = false;
      this.videoId = null;
      this.subtitles = [];
      this.currentSubtitleIndex = -1;
      this.stopSubtitleSync();
      this.statusMessage = 'Loading video...';

      try {
        const videoId = this.extractVideoId(this.videoUrl);
        if (!videoId) {
          this.statusMessage = 'Invalid YouTube URL';
          this.isLoading = false;
          return;
        }

        // Set video ID and initialize player immediately
        this.videoId = videoId;
        this.statusMessage = 'Initializing player...';

        // Initialize the player first (video loads faster)
        await this.initializePlayer();

        // Video is ready, stop main loading
        this.isLoading = false;
        this.videoReady = true;
        this.statusMessage = '';

        // Start loading subtitles in background
        this.loadSubtitlesInBackground();

      } catch (error) {
        console.error('Error loading content:', error);
        this.statusMessage = 'Failed to load content. Check the console for details.';
        this.isLoading = false;
      }
    },

    async loadSubtitlesInBackground() {
      // Don't load subtitles if video is not ready or no translation needed
      if (!this.videoReady) return;

      this.isSubtitlesLoading = true;
      this.subtitlesLoadingProgress = 0;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (this.subtitlesLoadingProgress < 90) {
          this.subtitlesLoadingProgress += Math.random() * 20;
        }
      }, 200);

      try {
        const subtitleResponse = await downloadVideoSubtitles(
            this.videoUrl,
            this.ifTranslation ? this.selectedLanguage : null
        ).catch(error => {
          console.error('Error downloading subtitles:', error);
          return {status: 500, data: {data: null}};
        });

        clearInterval(progressInterval);
        this.subtitlesLoadingProgress = 100;

        let scrollingSubtitles = subtitleResponse?.data?.data?.scrollingSubtitles;
        let translatedOrRetouchedSubtitles = subtitleResponse?.data?.data?.translatedOrRetouchedSubtitles;
        this.subtitlesType = subtitleResponse?.data?.data?.type;

        if (subtitleResponse.status === 200 && scrollingSubtitles) {
          this.parseSubtitles(scrollingSubtitles);
          this.translatedSubtitles = translatedOrRetouchedSubtitles;

          msgUtil.msgSuccess(this, 'Subtitles loaded successfully!', 2000);

          // Re-apply touch preventions for the new subtitles
          this.$nextTick(() => {
            this.applyTouchPreventions();
          });

          this.middleControlEnabled = this.ifTranslation;
        } else {
          msgUtil.msgWarning(this, 'No subtitles available for this video', 3000);
        }

        // Hide loading indicator after a short delay
        setTimeout(() => {
          this.isSubtitlesLoading = false;
          this.subtitlesLoadingProgress = 0;
        }, 1000);

      } catch (error) {
        clearInterval(progressInterval);
        console.error('Error loading subtitles:', error);
        this.isSubtitlesLoading = false;
        this.subtitlesLoadingProgress = 0;
        msgUtil.msgError(this, 'Failed to load subtitles', 3000);
      }
    },

    cancelSubtitlesLoading() {
      this.isSubtitlesLoading = false;
      this.subtitlesLoadingProgress = 0;
      msgUtil.msgInfo(this, 'Subtitles loading cancelled', 2000);
    },
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
        }
        else if (urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.split('/')[1];
        }

        if (videoId) {
          videoId = videoId.split('?')[0].split('&')[0];
        }

        return videoId || null;
      } catch (e) {
        console.error('Invalid URL:', e);
        return null;
      }
    },
    parseSubtitles(scrollingSubtitles) {
      const lines = scrollingSubtitles.split('\n').filter(line => line.trim());
      const subtitles = [];
      let currentSubtitle = null;
      let parsingCue = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

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

      console.log('Parsed subtitles:', subtitles);
      this.subtitles = subtitles;
    },
    parseTime(timeStr) {
      const [hours, minutes, seconds] = timeStr.split(':');
      const [secs, ms] = seconds.split('.');
      return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
    },
    scrollToCurrentSubtitle() {
      if (this.ifTranslation) {
        return;
      }

      const subtitleElement = document.getElementById(`subtitle-${this.currentSubtitleIndex}`);
      if (!subtitleElement) return;

      const subtitlesContainer = document.querySelector('.subtitles-container');
      if (!subtitlesContainer) return;

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari) {
        const containerRect = subtitlesContainer.getBoundingClientRect();
        const elementRect = subtitleElement.getBoundingClientRect();
        const relativePosition = elementRect.top - containerRect.top;
        const targetScrollTop = subtitlesContainer.scrollTop + relativePosition - (containerRect.height / 2) + (elementRect.height / 2);
        subtitlesContainer.scrollTop = targetScrollTop;
      } else {
        window.requestAnimationFrame(() => {
          const containerRect = subtitlesContainer.getBoundingClientRect();
          const elementRect = subtitleElement.getBoundingClientRect();
          const scrollPosition = (elementRect.top - containerRect.top) + subtitlesContainer.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);

          subtitlesContainer.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        });
      }
    },
    updateCurrentSubtitle() {
      if (!this.player || !this.subtitles.length) return;

      const currentTime = this.player.getCurrentTime();
      const index = this.subtitles.findIndex(
          (sub, i) =>
              currentTime >= sub.start &&
              (i === this.subtitles.length - 1 || currentTime < this.subtitles[i + 1].start)
      );

      if (index !== -1 && index !== this.currentSubtitleIndex) {
        this.currentSubtitleIndex = index;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (this.autoScrollEnabled) {
          if (isSafari) {
            this.scrollToCurrentSubtitle();
          } else {
            setTimeout(() => {
              this.scrollToCurrentSubtitle();
            }, 50);
          }
        }
      }
    },
    checkScreenSize() {
      this.isSmallScreen = window.innerWidth < 768;
    },
    cleanSubtitles() {
      deleteVideoSubtitles(this.videoUrl, this.selectedLanguage).then(() => {
        msgUtil.msgSuccess(this, 'Subtitles cleaned successfully!', 2000);
      })
    },
    updateDisplayStyle() {
      const container = document.getElementById('responsiveContainer');
      if (this.isMobileDevice() || this.isSmallScreen) {
        container.style.display = 'inline';
      } else {
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
      }
    }
  },
  beforeUnmount() {
    this.stopSubtitleSync();
    this.stopVisibilityCheck();
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    window.removeEventListener('resize', this.checkScreenSize);
    window.addEventListener('resize', this.updateDisplayStyle);
    document.removeEventListener('click', this.handleClickOutside);

    const subtitleElements = document.querySelectorAll('.current-subtitle-display, .previous-subtitle, .next-subtitle, .subtitles-wrapper p');
    subtitleElements.forEach(el => {
      if (el) {
        el.removeEventListener('contextmenu', e => {
          if (this.isMobileDevice()) {
            e.preventDefault();
          }
        });
      }
    });
  }
});
</script>

<style scoped>
/* Base styles aligned with AiResponseDetail */
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

/* Enhanced Header Container */
.header-container {
  margin: 15px 0;
  padding: 0 20px;
}

.main-title {
  margin: 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-size: 24px;
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
  margin-right: 8px;
  font-size: 20px;
}

/* Enhanced Input Container */
.input-container {
  padding: 0 20px 15px;
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
  gap: 15px;
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

/* Enhanced Controls Container */
.responsive-container {
  padding: 0 20px 15px;
  margin: 0;
}

.controls-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  background: white;
  padding: 16px 20px;
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

/* Enhanced Status Container with Amazing Loading Animation */
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

.dot-1 { animation-delay: 0s; }
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
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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

/* Enhanced Content Container */
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

/* Enhanced Subtitle Context Display */
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

.subtitle-header {
  padding: 8px 12px;
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.subtitle-header i {
  font-size: 14px;
}

.previous-subtitle {
  padding: 8px 12px;
  font-size: 14px;
  color: #909399;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  white-space: pre-wrap;
  line-height: 1.4;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

.current-subtitle-display {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 12px;
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
  line-height: 1.4;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.next-subtitle {
  padding: 8px 12px;
  font-size: 14px;
  color: #606266;
  background: #f0f2f5;
  border-top: 1px solid #e9ecef;
  white-space: pre-wrap;
  line-height: 1.4;
  -webkit-touch-callout: none;
  -webkit-user-select: text;
  user-select: text;
}

/* Enhanced Subtitles Container */
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
}

.subtitles-container::-webkit-scrollbar {
  width: 8px;
  display: block;
}

.subtitles-container::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
  display: block;
}

.subtitles-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc 0%, #909399 100%);
  border-radius: 4px;
  display: block;
}

.subtitles-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
  display: block;
}

.subtitles-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.subtitles-header i {
  font-size: 18px;
  color: #409eff;
}

.subtitles-wrapper {
  padding: 16px;
  min-height: calc(100% + 50px);
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

.translation-content {
  padding: 20px;
  line-height: 1.8;
  font-size: 15px;
  color: #2c3e50;
  text-align: justify;
}

.scroll-filler {
  margin-top: 20px;
  height: 50px;
}

/* Enhanced Vocabulary Popup */
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

/* Media Queries for Responsive Design */
@media (max-width: 767px) {
  .header-container {
    margin: 5px 0;
    padding: 0 10px;
  }

  .main-title {
    font-size: 16px;
    padding: 8px 12px;
  }

  .main-title i {
    font-size: 16px;
    margin-right: 6px;
  }

  .input-container {
    padding: 0 10px 8px;
  }

  .url-input-group {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .language-select {
    max-width: 100%;
    align-self: stretch;
  }

  .language-select .el-input__inner {
    height: 36px;
    padding: 8px 12px;
    font-size: 14px;
  }

  .input-with-buttons {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .url-input {
    width: 100%;
  }

  .url-input .el-input__inner {
    height: 36px;
    padding: 8px 12px;
    font-size: 14px;
  }

  .action-buttons {
    width: 100%;
    justify-content: center;
    gap: 8px;
    flex-wrap: nowrap;
  }

  .load-button {
    flex: 1;
    max-width: none;
    min-width: 100px;
    padding: 10px 16px;
    font-size: 14px;
    height: 36px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    font-size: 14px;
  }

  .action-btn .el-icon-delete,
  .action-btn .el-icon-back {
    font-size: 14px;
  }

  /* Mobile-specific controls styling */
  .responsive-container {
    padding: 0 10px 8px;
  }

  .controls-wrapper {
    flex-direction: row;
    gap: 12px;
    padding: 12px;
    justify-content: space-around;
    align-items: center;
  }

  .switch-group {
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    min-width: 50px;
    position: relative;
  }

  .mobile-switch-label {
    position: static;
    transform: none;
    font-size: 14px;
    color: #606266;
    margin-top: 2px;
    order: 2;
  }

  .enhanced-switch {
    order: 1;
    transform: scale(0.8);
  }

  .enhanced-switch .el-switch__core {
    width: 32px;
    height: 18px;
  }

  .enhanced-switch .el-switch__button {
    width: 14px;
    height: 14px;
  }

  .enhanced-switch .el-switch__label {
    display: none;
  }

  .divider {
    display: none;
  }

  /* Optimized content layout for mobile */
  .content-container {
    padding: 0 10px;
    height: calc(100vh - 140px);
    gap: 10px;
  }

  .left-panel {
    gap: 8px;
  }

  .video-section {
    flex: 1 1 55%;
    min-height: 200px;
  }

  .video-container {
    border-radius: 8px;
  }

  .subtitles-context-display {
    font-size: 13px;
  }

  .subtitle-header {
    padding: 4px 8px;
    font-size: 11px;
  }

  .subtitle-header i {
    font-size: 12px;
  }

  .current-subtitle-display {
    padding: 8px;
    font-size: 13px;
    line-height: 1.3;
    max-height: 60px;
  }

  .previous-subtitle,
  .next-subtitle {
    padding: 4px 8px;
    font-size: 11px;
    line-height: 1.3;
  }

  .subtitles-container {
    flex: 1 1 40%;
    max-height: none;
    min-height: 150px;
    -webkit-overflow-scrolling: touch;
  }

  .subtitles-header {
    padding: 8px 12px;
    font-size: 13px;
  }

  .subtitles-header i {
    font-size: 14px;
  }

  .subtitles-wrapper {
    padding: 8px;
  }

  .subtitles-container p {
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.5;
    margin: 4px 0;
  }

  .subtitles-container::-webkit-scrollbar {
    width: 8px !important;
  }

  .subtitles-container::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #909399 0%, #606266 100%) !important;
    border-radius: 4px !important;
  }

  .vocabulary-popup {
    font-size: 12px;
    padding: 6px 10px;
    max-width: 80%;
  }

  .loading-container {
    padding: 15px;
    margin: 0 5px;
  }

  .loading-message {
    font-size: 13px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
  }

  .loading-text {
    gap: 8px;
  }

  .loading-dots {
    gap: 2px;
  }

  .dot {
    width: 6px;
    height: 6px;
  }

  .status-container {
    padding: 8px;
    min-height: 60px;
  }

  .status-message {
    padding: 8px 12px;
    font-size: 13px;
  }

  .subtitles-loading-overlay {
    top: 5px;
    right: 5px;
    left: 5px;
  }

  .subtitles-loading-container {
    min-width: auto;
    max-width: none;
    margin: 0;
    padding: 12px 16px;
  }

  .subtitles-loading-icon i {
    font-size: 20px;
  }

  .subtitles-loading-text > span {
    font-size: 13px;
  }

  .subtitles-progress-text {
    font-size: 11px;
    min-width: 30px;
  }

  .translation-content {
    padding: 12px;
    font-size: 13px;
    line-height: 1.6;
  }
}

/* iPad Mini and small tablets optimization */
@media (max-width: 768px) and (min-width: 481px) {
  .content-container {
    height: calc(100vh - 160px);
  }

  .video-section {
    flex: 1 1 60%;
    min-height: 250px;
  }

  .subtitles-container {
    flex: 1 1 35%;
    min-height: 200px;
  }

  .main-title {
    font-size: 18px;
    padding: 10px 16px;
  }

  .current-subtitle-display {
    font-size: 15px;
    padding: 14px;
  }

  .subtitles-container p {
    font-size: 14px;
    padding: 10px 14px;
  }

  /* Medium screen controls */
  .controls-wrapper {
    gap: 16px;
    padding: 14px;
  }

  .switch-group {
    min-width: 60px;
  }

  .mobile-switch-label {
    font-size: 15px;
  }

  .enhanced-switch {
    transform: scale(0.9);
  }
}

/* Ensure video doesn't touch bottom on very small screens */
@media (max-width: 480px) {
  .content-container {
    height: calc(100vh - 120px);
    padding-bottom: 15px;
  }

  .video-section {
    flex: 1 1 50%;
    min-height: 180px;
  }

  .subtitles-container {
    flex: 1 1 45%;
    min-height: 120px;
  }

  .main-title {
    font-size: 15px;
    padding: 6px 10px;
  }

  .current-subtitle-display {
    font-size: 13px;
    padding: 8px;
    max-height: 50px;
  }

  .subtitles-container p {
    font-size: 11px;
    padding: 4px 6px;
    margin: 1px 0;
  }

  /* Very small screen controls */
  .controls-wrapper {
    gap: 8px;
    padding: 8px;
  }

  .switch-group {
    min-width: 45px;
  }

  .mobile-switch-label {
    font-size: 12px;
  }

  .enhanced-switch {
    transform: scale(0.7);
  }
}

/* Media query for larger screens (PC, laptop, tablet) */
@media (min-width: 992px) {
  .content-container {
    flex-direction: row;
    gap: 30px;
  }

  .left-panel {
    width: 50%;
    height: 100%;
  }

  .right-panel {
    width: 50%;
    height: 100%;
    border-left: 1px solid #e4e7ed;
    padding-left: 20px;
  }

  .video-section {
    flex: 1 0 auto;
    min-height: 50vh;
  }

  .subtitles-context-display {
    max-height: 200px;
  }

  .subtitles-container {
    flex: 1;
    height: calc(100% - 60px);
  }

  .url-input-group {
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }

  .language-select {
    max-width: 200px;
    flex-shrink: 0;
  }

  .input-with-buttons {
    flex: 1;
  }

  /* Desktop controls retain text labels */
  .mobile-switch-label {
    display: none;
  }

  .enhanced-switch .el-switch__label {
    display: block;
  }
}

/* Background Subtitles Loading Overlay */
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
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.subtitles-progress-text {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}

.subtitles-loading-close {
  position: absolute;
  top: 8px;
  right: 8px;
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

.subtitles-loading-close:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #606266;
  transform: scale(1.1);
}

.subtitles-loading-close i {
  font-size: 12px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-container {
  animation: slideIn 0.5s ease-out;
}

/* Focus styles for accessibility */
.load-button:focus,
.action-btn:focus,
.enhanced-switch:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* High contrast mode support */
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
}
</style>