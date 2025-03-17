<template>
  <div class="youtube-player">
    <h1 id="playHeader" v-show="!isPlaying && !forceHideInput">YouTube Player</h1>

    <!-- Input and Button for YouTube URL -->
    <div class="input-container" v-show="!isPlaying && !forceHideInput">
      <div class="url-input-group">
        <el-input
            v-model="videoUrl"
            type="text"
            placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
            @keyup.enter="loadContent"
            style="width: 100%; max-width: 500px;"
        />
        <button @click="pasteFromClipboard" class="ytb-player-button paste-button" title="Paste from clipboard">
          <span class="paste-icon">📋</span>
        </button>
        <button @click="loadContent" :disabled="!videoUrl || isLoading" class="ytb-player-button paste-button">
          {{ isLoading ? 'Loading...' : 'Load' }}
        </button>
      </div>
    </div>

    <!-- Status Message -->
    <p class="status-message" v-show="!isPlaying && !forceHideInput">{{ statusMessage }}</p>

    <!-- Responsive Content Container -->
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
        <div class="subtitles-context-display" v-if="currentSubtitleIndex !== -1 && subtitles.length"
             @mouseup="handleTextSelection"
             @touchend="handleTextSelection"
        >
          <div v-if="hasPreviousSubtitle" class="previous-subtitle">
            {{ subtitles[currentSubtitleIndex - 1]?.text }}
          </div>

          <div class="current-subtitle-display">
            {{ subtitles[currentSubtitleIndex]?.text }}
          </div>

          <div v-if="hasNextSubtitle" class="next-subtitle">
            {{ subtitles[currentSubtitleIndex + 1]?.text }}
          </div>
        </div>

        <!-- Controls for Subtitle View -->
        <div class="ytb-controls-container" v-if="subtitles.length && player">
          <div class="ytb-controls-row">
            <div class="controls-left">
              <div class="auto-scroll-toggle" v-if="!isSmallScreen">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="autoScrollEnabled">
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">Auto-scroll</span>
              </div>
              <div class="input-toggle">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="forceHideInput">
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">Hide input</span>
              </div>
            </div>
            <span class="current-line-info" v-if="currentSubtitleIndex !== -1">
              Line {{ currentSubtitleIndex + 1 }} of {{ subtitles.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Panel (subtitles) -->
      <div class="right-panel">

        <!-- Subtitles List -->
        <div class="subtitles-container" v-if="subtitles.length">
          <div class="subtitles-wrapper"
               @mouseup="handleTextSelection"
               @touchend="handleTextSelection">
            <p
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
            <!-- Add a dummy element to ensure the last subtitle is fully visible -->
            <div class="scroll-filler" v-if="subtitles.length > 0"> </div>
          </div>
        </div>
      </div>

      <!-- Vocabulary Lookup Popup -->
      <div
          v-if="showSelectionPopup"
          ref="vocabularyPopup"
          class="vocabulary-popup"
          @click="navigateToVocabulary"
      >
        <i class="el-icon-search"></i> "{{ selectedText }}"
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { downloadVideoSubtitles } from '@/api/ai';
import msgUtil from '@/util/msg'
import kiwiConsts from "@/const/kiwiConsts";

export default defineComponent({
  name: 'YoutubeSubtitleDownloader',
  data() {
    return {
      videoUrl: null,
      videoId: null,
      subtitles: [],
      statusMessage: '',
      isLoading: false,
      player: null,
      currentSubtitleIndex: -1,
      subtitleInterval: null,
      userInteracting: false,
      lastScrollTime: 0,
      visibilityCheckInterval: null,
      autoScrollEnabled: true, // Add back auto-scroll flag with default true
      forceHideInput: false, // New toggle for hiding input area
      isSmallScreen: false, // Track if we're on a small screen

      // Text selection and popup properties
      selectedText: '',
      showSelectionPopup: false,
      isPlaying: false,
    };
  },
  computed: {
    // Check if there is a previous subtitle available
    hasPreviousSubtitle() {
      return this.currentSubtitleIndex > 0;
    },

    // Check if there is a next subtitle available
    hasNextSubtitle() {
      return this.currentSubtitleIndex < this.subtitles.length - 1;
    }
  },
  mounted() {
    // Load YouTube API
    this.loadYouTubeAPI();

    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyPress);

    // Add click listener to document to close popup when clicking outside
    document.addEventListener('click', this.handleClickOutside);

    // Check if on small screen and disable auto-scroll if needed
    this.checkScreenSize();

    // Add resize listener to handle screen size changes
    window.addEventListener('resize', this.checkScreenSize);
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
    }
  },
  methods: {
    // Text selection and vocabulary lookup methods
    handleTextSelection(event) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;

        // Show popup first so it's in the DOM
        this.showSelectionPopup = true;

        // Calculate position for popup based on selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Use nextTick to ensure popup is rendered before positioning
        this.$nextTick(() => {
          const popup = document.querySelector('.vocabulary-popup');
          if (popup) {
            // Calculate the position relative to the viewport
            const viewportWidth = window.innerWidth;
            const popupWidth = popup.offsetWidth;

            // Keep popup within viewport bounds
            let left = rect.left + (rect.width / 2);

            // Ensure popup doesn't go off-screen
            if (left - (popupWidth / 2) < 10) {
              left = 10 + (popupWidth / 2); // Keep 10px from left edge
            } else if (left + (popupWidth / 2) > viewportWidth - 10) {
              left = viewportWidth - 10 - (popupWidth / 2); // Keep 10px from right edge
            }

            // Apply the calculated position
            popup.style.left = `${left}px`;
            popup.style.top = `${rect.bottom + 10}px`;
            popup.style.transform = 'translateX(-50%)';
          }
        });

        // Prevent default to maintain the selection
        event.preventDefault();
      } else {
        this.closePopup();
      }
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
          selectedMode: kiwiConsts.SEARCH_MODES.TRANSLATION_AND_EXPLANATION.value,
          language: this.selectedLanguage,
          originalText: encodedText,
          now: new Date().getTime()
        }
      })
    },

    closePopup() {
      this.showSelectionPopup = false;
      this.selectedText = '';
    },

    handleClickOutside(event) {
      // Close the popup if clicking outside of popup and subtitle display
      const popup = document.querySelector('.vocabulary-popup');
      const subtitleDisplay = document.querySelector('.subtitles-context-display');

      if (popup && subtitleDisplay &&
          !popup.contains(event.target) &&
          !subtitleDisplay.contains(event.target)) {
        this.closePopup();
      }
    },

    // Original methods from the component
    async pasteFromClipboard() {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.videoUrl = text.trim();
          // Optional: Auto-load content when URL is pasted
          if (this.extractVideoId(this.videoUrl)) {
            await this.loadContent();
          }
        }
      } catch (error) {
        console.error('Failed to read clipboard contents:', error);
        this.statusMessage = 'Unable to access clipboard. Please paste manually.';
        setTimeout(() => {
          if (this.statusMessage === 'Unable to access clipboard. Please paste manually.') {
            this.statusMessage = '';
          }
        }, 3000);
      }
    },
    handleKeyPress(event) {
      // Only handle keyboard shortcuts if player is initialized
      if (!this.player) return;

      switch(event.key) {
        case ' ': // Space bar - Play/Pause
          this.togglePlayPause();
          event.preventDefault();
          break;
        case 'v': // If Ctrl+V is pressed, handle paste (for accessibility)
          if (event.ctrlKey) {
            this.pasteFromClipboard();
            event.preventDefault();
          }
          break;
      }
    },
    togglePlayPause() {
      if (!this.player) return;

      const state = this.player.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        this.player.pauseVideo();
      } else {
        this.player.playVideo();
      }
    },
    jumpToSubtitle(index) {
      if (!this.player || !this.subtitles[index]) return;

      // Jump video to the start time of the clicked subtitle
      this.player.seekTo(this.subtitles[index].start, true);

      // If video is paused, play it
      if (this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
        this.player.playVideo();
      }
    },
    loadYouTubeAPI() {
      // Add YouTube API script if it doesn't exist
      if (!document.getElementById('youtube-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Set up callback for when YouTube API is ready
      window.onYouTubeIframeAPIReady = () => {
        if (this.videoId) {
          this.initializePlayer();
        }
      };
    },
    initializePlayer() {
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
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange
        }
      });
    },
    onPlayerReady(event) {
      console.log('Player ready');
    },
    onPlayerStateChange(event) {
      this.isPlaying = false;
      // Handle player state changes
      if (event.data === YT.PlayerState.PLAYING) {
        // Start syncing subtitles when video is playing
        this.startSubtitleSync();
        this.isPlaying = true;
      } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        // Stop syncing when video is paused or ended
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

    handleUserScroll() {
      // Mark user is interacting with scrolling
      this.userInteracting = true;
      this.lastScrollTime = Date.now();

      // After a brief period, re-enable automatic scrolling
      setTimeout(() => {
        this.userInteracting = false;
      }, 2000);
    },
    startSubtitleSync() {
      // Clear any existing interval
      this.stopSubtitleSync();

      // Create a new interval that runs every 100ms to update subtitle sync
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

      // Find the subtitle that matches the current playback time
      const index = this.subtitles.findIndex(
          (sub, i) =>
              currentTime >= sub.start &&
              (i === this.subtitles.length - 1 || currentTime < this.subtitles[i + 1].start)
      );

      // If the subtitle has changed, update and scroll if auto-scroll is enabled
      if (index !== -1 && index !== this.currentSubtitleIndex) {
        this.currentSubtitleIndex = index;
        // Only auto-scroll if enabled AND not on small screen AND not user interacting
        if (this.autoScrollEnabled && !this.isSmallScreen && !this.userInteracting) {
          this.scrollToCurrentSubtitle();
        }
      }
    },
    scrollToCurrentSubtitle() {
      // Scroll to current subtitle
      const subtitleElement = document.getElementById(`subtitle-${this.currentSubtitleIndex}`);
      if (subtitleElement) {
        subtitleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    async loadContent() {
      // Reset state for new video
      if (this.player) {
        this.stopSubtitleSync();
        this.stopVisibilityCheck();
        this.player.destroy();
        this.player = null;
      }

      this.statusMessage = 'Loading video and subtitles...';
      this.isLoading = true;
      this.videoId = null;
      this.subtitles = [];
      this.currentSubtitleIndex = -1;
      this.stopSubtitleSync();
      // Keep auto-scroll setting as is (don't reset it)

      try {
        const videoId = this.extractVideoId(this.videoUrl);
        if (!videoId) {
          this.statusMessage = 'Invalid YouTube URL';
          this.isLoading = false;
          return;
        }

        this.videoId = videoId;

        // Fetch subtitles
        const subtitleResponse = await downloadVideoSubtitles(this.videoUrl).catch(error => {
          console.error('Error downloading subtitles:', error);
          return { status: 500, data: { data: null } };
        });

        if (subtitleResponse.status !== 200 || !subtitleResponse.data.data) {
          this.statusMessage = 'Video loaded, but no subtitles available';
        } else {
          this.parseSubtitles(subtitleResponse.data.data);
          this.statusMessage = 'Content loaded successfully!';

          // Initialize the player now that we have the video ID
          this.initializePlayer();
        }
      } catch (error) {
        console.error('Error loading content:', error);
        this.statusMessage = 'Failed to load content. Check the console for details.';
      } finally {
        this.isLoading = false;
      }
    },
    extractVideoId(url) {
      try {
        const urlObj = new URL(url);
        let videoId;

        if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname === '/watch') {
          videoId = urlObj.searchParams.get('v') || url.match(/[?&]v=([^&]+)/)?.[1];
        } else if (urlObj.hostname === 'youtu.be') {
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          videoId = pathSegments[0] || null;
        } else {
          const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu.be\/([^?&]+)/);
          videoId = match ? match[1] : null;
        }

        return videoId;
      } catch (e) {
        console.error('Invalid URL:', e);
        return null;
      }
    },
    parseSubtitles(webvttText) {
      const lines = webvttText.split('\n').filter(line => line.trim());
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

    checkScreenSize() {
      // Consider small screen as less than 768px (typical mobile breakpoint)
      const isSmallScreen = window.innerWidth < 768;

      if (isSmallScreen) {
        // Disable auto-scroll on small screens
        this.autoScrollEnabled = false;
      }

      // Store screen size status for conditional rendering
      this.isSmallScreen = isSmallScreen;
    }
  },
  beforeUnmount() {
    // Clean up
    this.stopSubtitleSync();
    this.stopVisibilityCheck();
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    document.removeEventListener('mouseup', () => { this.userInteracting = false; });
    document.removeEventListener('touchend', () => { this.userInteracting = false; });
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('resize', this.checkScreenSize);

    // Remove text selection related event listeners
    document.removeEventListener('click', this.handleClickOutside);
  }
});
</script>

<style scoped>
.youtube-player {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.input-container {
  padding: 10px;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.url-input-group {
  display: flex;
  width: 100%;
  position: relative;
  align-items: center;
  justify-content: center;
}

.paste-button {
  margin-left: 8px;
  padding: 4px 10px;
  font-size: 14px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paste-icon {
  font-size: 18px;
}

.input-container button {
  padding: 8px;
  font-size: 16px;
}

/* Main container for side-by-side layout */
.content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 120px); /* Adjust based on header height */
  overflow: hidden;
}

/* Video section containing player and current subtitle */
.video-section {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto; /* Changed to auto for better responsiveness */
  position: relative;
}

/* Apply min-height only on larger screens */
@media (min-width: 768px) {
  .video-section {
    min-height: 50vh;
  }
}

.video-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Enhanced subtitle context display container */
.subtitles-context-display {
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 10px 0; /* Add space above and below */
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

/* Previous subtitle line styling */
.previous-subtitle {
  padding: 6px 10px;
  font-size: 14px;
  color: #777;
  background-color: #e0e0e0;
  border-bottom: 1px solid #ccc;
  white-space: pre-wrap;
}

/* Current subtitle display below video */
.current-subtitle-display {
  background-color: rgb(148, 154, 165);
  color: #ffffff;
  padding: 10px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  user-select: text; /* Make text selectable */
  cursor: text; /* Show text cursor when hovering */
  position: relative;
}

/* Next subtitle line styling */
.next-subtitle {
  padding: 6px 10px;
  font-size: 14px;
  color: #555;
  background-color: #e8e8e8;
  border-top: 1px solid #ccc;
  white-space: pre-wrap;
}

/* New vocabulary popup styles */
.vocabulary-popup {
  position: fixed; /* Use fixed positioning */
  background-color: rgb(148, 154, 165);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
  white-space: nowrap;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  width: fit-content;
}

.vocabulary-popup::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: transparent transparent rgb(148, 154, 165) transparent;
}

.vocabulary-popup:hover {
  background-color: #7b8291;
}

.ytb-controls-container {
  display: flex;
  flex-direction: column;
  padding: 10px 10px;
  margin-bottom: 8px;
}

.ytb-controls-row {
  display: flex;
  justify-content: space-between; /* Space between toggle and counter */
  align-items: center;
  margin-bottom: 5px;
  margin-right: 30px;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 15px; /* Add space between the toggles */
}

/* Toggle switch styling */
.auto-scroll-toggle, .input-toggle {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #43a047;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-label {
  margin-left: 8px;
  font-size: 14px;
  color: #666;
}

.current-line-info {
  font-size: 14px;
  color: #666;
}

.ytb-player-button {
  background-color: #949aa5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  margin-left: 5px;
}

.ytb-player-button:hover {
  background-color: #7b8291;
}

.ytb-player-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.subtitles-container {
  flex: 1 0 45%;
  overflow-y: auto;
  padding: 0;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  min-height: 100px;
  position: relative;
  scrollbar-width: thin; /* For Firefox */
}

/* Style scrollbar for webkit browsers (Chrome, Safari, Edge) */
.subtitles-container::-webkit-scrollbar {
  width: 8px;
  display: block;
}

.subtitles-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  display: block;
}

.subtitles-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
  display: block;
}

.subtitles-container::-webkit-scrollbar-thumb:hover {
  background: #555;
  display: block;
}

.subtitles-wrapper {
  padding: 5px;
  /* Add min-height to ensure content is taller than container, forcing scrollbar to appear */
  min-height: calc(100% + 50px);
}

.subtitles-container p {
  margin: 5px 0;
  padding: 8px;
  transition: all 0.3s ease;
  border-radius: 4px;
  cursor: pointer;
}

.subtitles-container p:hover {
  background-color: #f0f0f0;
}

.active-subtitle {
  background-color: #43a047;
  color: white;
  border-radius: 4px;
}

.past-subtitle {
  color: #777;
}

.future-subtitle {
  color: #333;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(67, 160, 71, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(67, 160, 71, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(67, 160, 71, 0);
  }
}

.scroll-filler {
  margin-top: 10px;
}

.status-message {
  padding: 10px;
  margin: 0;
  color: #d32f2f;
  flex-shrink: 0;
}

/* Media queries for small screens (mobile) */
@media (max-width: 767px) {
  .ytb-controls-container {
    display: none !important;
  }

  /* Show scrollbar explicitly on small screens */
  .subtitles-container {
    overflow-y: scroll !important;
    max-height: 40vh;
    -webkit-overflow-scrolling: touch; /* Better scrolling on iOS */
  }

  /* Make scrollbars more visible on small screens */
  .subtitles-container::-webkit-scrollbar {
    width: 10px !important;
    display: block !important;
  }

  .subtitles-container::-webkit-scrollbar-thumb {
    background: #666 !important;
    border-radius: 5px !important;
  }
}

/* Media query for larger screens (PC, laptop, tablet) */
@media (min-width: 992px) {
  /* Change to horizontal layout for larger screens */
  .content-container {
    flex-direction: row;
  }

  /* Left side - video area */
  .left-panel {
    width: 50%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Right side - subtitles area */
  .right-panel {
    width: 50%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid #ddd;
  }

  /* Adjust video section */
  .video-section {
    flex: 1 0 auto;
  }

  /* Apply min-height only on larger screens */
  @media (min-width: 768px) {
    .video-section {
      min-height: 50vh;
    }
  }

  /* Make controls stay in left panel */
  .ytb-controls-container {
    width: 100%;
  }

  /* Make subtitle display remain in left panel */
  .subtitles-context-display {
    margin-bottom: 10px;
    max-height: 150px;
  }

  /* Adjust subtitles list container */
  .subtitles-container {
    flex: 1;
    height: calc(100% - 160px); /* Account for context display */
    margin-bottom: 0;
  }
}

/* Responsive adjustments for mobile */
@media (max-width: 768px) {
  .video-section {
    flex: 1 0 30%;
  }

  .subtitles-container {
    flex: 1 0 55%;
  }

  .ytb-controls-container {
    flex-direction: column;
  }

  .ytb-controls-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .current-subtitle-display {
    font-size: 14px;
    padding: 8px;
    max-height: 60px;
  }

  .previous-subtitle,
  .next-subtitle {
    font-size: 12px;
    padding: 4px 8px;
  }

  .vocabulary-popup {
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>