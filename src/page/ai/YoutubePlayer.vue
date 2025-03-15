<template>
  <div class="youtube-player">
    <h1>YouTube Player</h1>

    <!-- Input and Button for YouTube URL -->
    <div class="input-container">
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

    <!-- Video Player Section -->
    <div class="video-section" v-if="videoId">
      <!-- Video Player -->
      <div class="video-container">
        <div id="youtube-player-container"></div>
      </div>

      <!-- Enhanced Subtitle Display with Previous, Current, and Next Lines -->
      <div class="subtitles-context-display" v-if="currentSubtitleIndex !== -1 && subtitles.length">
        <div v-if="hasPreviousSubtitle" class="previous-subtitle">
          {{ subtitles[currentSubtitleIndex - 1]?.text }}
        </div>

        <div
            class="current-subtitle-display"
            @mouseup="handleTextSelection"
            @touchend="handleTextSelection"
        >
          {{ subtitles[currentSubtitleIndex]?.text }}
        </div>

        <div v-if="hasNextSubtitle" class="next-subtitle">
          {{ subtitles[currentSubtitleIndex + 1]?.text }}
        </div>
      </div>

      <!-- Vocabulary Lookup Popup -->
      <div
          v-if="showSelectionPopup"
          class="vocabulary-popup"
          @click="navigateToVocabulary"
      >
        Look up "{{ selectedText }}"
      </div>
    </div>

    <!-- Controls for Subtitle View -->
    <div class="ytb-controls-container" v-if="subtitles.length && player">
      <div class="ytb-controls-row">
        <span class="current-line-info" v-if="currentSubtitleIndex !== -1">
          Line {{ currentSubtitleIndex + 1 }} of {{ subtitles.length }}
        </span>
      </div>
    </div>

    <!-- Subtitles List -->
    <div class="subtitles-container" ref="subtitleArea" v-if="subtitles.length">
      <div class="subtitles-wrapper">
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

    <!-- Status Message -->
    <p class="status-message">{{ statusMessage }}</p>
  </div>
</template>

<script>
import { defineComponent, ref, nextTick, onMounted, onBeforeUnmount, computed } from 'vue';
import { downloadVideoSubtitles } from '@/api/ai';

export default defineComponent({
  name: 'YoutubeSubtitleDownloader',
  data() {
    return {
      videoUrl: '',
      videoId: null,
      subtitles: [],
      statusMessage: '',
      isLoading: false,
      player: null,
      currentSubtitleIndex: -1,
      subtitleInterval: null,
      youtubeAPILoaded: false,
      autoScrollEnabled: true, // Always enabled by default
      userInteracting: false,
      lastScrollTime: 0,
      visibilityCheckInterval: null,

      // Text selection and popup properties
      selectedText: '',
      showSelectionPopup: false
    };
  },
  setup() {
    const subtitleArea = ref(null);
    return { subtitleArea };
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

    // Add event listener for manual scrolling to detect when user manually scrolls
    if (this.subtitleArea && this.subtitleArea.value) {
      this.subtitleArea.value.addEventListener('scroll', this.handleUserScroll);
      this.subtitleArea.value.addEventListener('mousedown', () => { this.userInteracting = true; });
      this.subtitleArea.value.addEventListener('touchstart', () => { this.userInteracting = true; });

      // Add document-level listeners to detect when user stops interacting
      document.addEventListener('mouseup', () => {
        setTimeout(() => { this.userInteracting = false; }, 500);
      });
      document.addEventListener('touchend', () => {
        setTimeout(() => { this.userInteracting = false; }, 500);
      });
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyPress);

    // Add click listener to document to close popup when clicking outside
    document.addEventListener('click', this.handleClickOutside);
  },
  methods: {
    // Text selection and vocabulary lookup methods
    handleTextSelection(event) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        // Show popup at the bottom of the current subtitle line (position is set in CSS)
        this.showSelectionPopup = true;

        // Prevent default to maintain the selection
        event.preventDefault();
      } else {
        this.closePopup();
      }
    },

    navigateToVocabulary() {
      const encodedText = encodeURIComponent(this.selectedText);
      window.location.href = `/#/index/vocabulary/aiResponseDetail?active=search&selectedMode=translation-and-explanation&language=EN&originalText=${encodedText}`;
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
            this.loadContent();
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
      if (window.YT && window.YT.Player) {
        this.youtubeAPILoaded = true;
        return;
      }

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
        this.youtubeAPILoaded = true;
        if (this.videoId) {
          this.initializePlayer();
        }
      };
    },
    initializePlayer() {
      if (!this.youtubeAPILoaded || !this.videoId) {
        return;
      }

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
      // Handle player state changes
      if (event.data === YT.PlayerState.PLAYING) {
        // Start syncing subtitles when video is playing
        this.startSubtitleSync();
        // Always start visibility checking since auto-scroll is always enabled
        this.startVisibilityCheck();
      } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        // Stop syncing when video is paused or ended
        this.stopSubtitleSync();
        this.stopVisibilityCheck();
      }
    },
    startVisibilityCheck() {
      // Clear any existing interval
      this.stopVisibilityCheck();

      // Check if subtitle is visible every 500ms
      this.visibilityCheckInterval = setInterval(() => {
        if (this.autoScrollEnabled && !this.userInteracting && this.currentSubtitleIndex !== -1) {
          this.ensureSubtitleVisible();
        }
      }, 500);
    },

    stopVisibilityCheck() {
      if (this.visibilityCheckInterval) {
        clearInterval(this.visibilityCheckInterval);
        this.visibilityCheckInterval = null;
      }
    },

    handleUserScroll() {
      // With auto-scroll always enabled, we just temporarily pause scrolling during user interaction
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
        if (this.autoScrollEnabled && !this.userInteracting) {
          this.scrollToCurrentSubtitle();
        }
      }
      // Even if the subtitle hasn't changed, check if it's visible and scroll if needed
      else if (this.autoScrollEnabled && !this.userInteracting && this.currentSubtitleIndex !== -1) {
        this.ensureSubtitleVisible();
      }
    },

    // New method to check if the current subtitle is visible and scroll if needed
    ensureSubtitleVisible() {
      nextTick(() => {
        const subtitleElement = document.getElementById(`subtitle-${this.currentSubtitleIndex}`);
        if (!subtitleElement || !this.subtitleArea.value) return;

        const containerRect = this.subtitleArea.value.getBoundingClientRect();
        const subtitleRect = subtitleElement.getBoundingClientRect();

        // Check if the subtitle is fully visible
        const isVisible =
            subtitleRect.top >= containerRect.top &&
            subtitleRect.bottom <= containerRect.bottom;

        // If not visible, scroll to make it visible
        if (!isVisible) {
          this.scrollToCurrentSubtitle(false);
        }
      });
    },
    scrollToCurrentSubtitle(forceScroll = false) {
      // If force scroll is true or auto-scroll is enabled
      if (forceScroll) {
        this.autoScrollEnabled = true;
      }

      if (!this.autoScrollEnabled && !forceScroll) {
        return;
      }

      nextTick(() => {
        const subtitleElement = document.getElementById(`subtitle-${this.currentSubtitleIndex}`);
        if (subtitleElement && this.subtitleArea.value) {
          // Calculate scroll position (always use center position)
          const containerHeight = this.subtitleArea.value.clientHeight;
          const scrollTop = subtitleElement.offsetTop - (containerHeight / 2) + (subtitleElement.offsetHeight / 2);

          // Apply smooth scrolling
          this.subtitleArea.value.scrollTo({
            top: scrollTop,
            behavior: forceScroll ? 'smooth' : 'auto' // Only use smooth for manual focus
          });

          // Add a brief highlight animation effect
          subtitleElement.classList.add('focus-pulse');
          setTimeout(() => {
            subtitleElement.classList.remove('focus-pulse');
          }, 1000);
        }
      });
    },
    async loadContent() {
      this.statusMessage = 'Loading content...';
      this.isLoading = true;
      this.videoId = null;
      this.subtitles = [];
      this.currentSubtitleIndex = -1;
      this.stopSubtitleSync();
      this.autoScrollEnabled = true;

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

          // Scroll to the top of the subtitles container after loading
          await nextTick();
          if (this.subtitleArea.value) {
            this.subtitleArea.value.scrollTop = 0;
          }
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
      const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
      return totalSeconds;
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

    // Remove event listeners
    if (this.subtitleArea && this.subtitleArea.value) {
      this.subtitleArea.value.removeEventListener('scroll', this.handleUserScroll);
      this.subtitleArea.value.removeEventListener('mousedown', () => { this.userInteracting = true; });
      this.subtitleArea.value.removeEventListener('touchstart', () => { this.userInteracting = true; });
    }

    document.removeEventListener('mouseup', () => { this.userInteracting = false; });
    document.removeEventListener('touchend', () => { this.userInteracting = false; });
    document.removeEventListener('keydown', this.handleKeyPress);

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

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input-container button {
  padding: 8px;
  font-size: 16px;
}

/* Video section containing player and current subtitle */
.video-section {
  display: flex;
  flex-direction: column;
  flex: 1 0 40%;
  position: relative;
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
  margin-bottom: 45px; /* Make room for the popup below */
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
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
  position: absolute;
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
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
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

/* Current subtitle header at the top of subtitles area */
.current-subtitle-header {
  background-color: #43a047; /* Green background */
  color: white;
  padding: 10px;
  font-weight: bold;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #2e7d32;
  margin-bottom: 5px;
}

.current-subtitle-text {
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
}

.ytb-controls-container {
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  margin-bottom: 8px;
}

.ytb-controls-row {
  display: flex;
  justify-content: flex-end; /* Right-align the line counter */
  align-items: center;
  margin-bottom: 5px;
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
  overflow-y: scroll;
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
}

.subtitles-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.subtitles-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.subtitles-container::-webkit-scrollbar-thumb:hover {
  background: #555;
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

.focus-pulse {
  animation: pulse 1s;
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
  /* Increase the height to ensure there's always enough content to scroll */
  height: calc(50vh + 150px);
}

.status-message {
  padding: 10px;
  margin: 0;
  color: #d32f2f;
  flex-shrink: 0;
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