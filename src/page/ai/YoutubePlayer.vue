<template>
  <div class="youtube-player">
    <h1>YouTube Player (Developing and Testing)</h1>

    <!-- Input and Button for YouTube URL -->
    <div class="input-container">
      <input
          v-model="videoUrl"
          type="text"
          placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
          @keyup.enter="loadContent"
      />
      <button @click="loadContent" :disabled="!videoUrl || isLoading">Load Content</button>
    </div>

    <!-- Video Player (Top Half) -->
    <div class="video-container" v-if="videoBlobUrl">
      <video
          ref="videoPlayer"
          controls
          :src="videoBlobUrl"
          @play="onPlay"
          @timeupdate="updateSubtitle"
          @pause="onPause"
      >
        Your browser does not support the video tag.
      </video>
    </div>

    <!-- Subtitles (Bottom Half) -->
    <div class="subtitles-container" v-if="subtitles.length">
      <div class="subtitle-text" ref="subtitleArea">
        <p
            v-for="(subtitle, index) in visibleSubtitles"
            :key="index"
            :class="{ active: index === activeSubtitleIndex }"
        >
          {{ subtitle.text }}
        </p>
      </div>
    </div>

    <!-- Status Message -->
    <p class="status-message">{{ statusMessage }}</p>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { downloadVideo, downloadVideoSubtitles } from '@/api/ai';

export default defineComponent({
  name: 'YoutubeSubtitleDownloader',
  data() {
    return {
      videoUrl: '',
      videoBlobUrl: '',
      subtitles: [],
      visibleSubtitles: [],
      activeSubtitleIndex: -1,
      statusMessage: '',
      isLoading: false
    };
  },
  setup() {
    const videoPlayer = ref(null);
    const subtitleArea = ref(null);
    return { videoPlayer, subtitleArea };
  },
  methods: {
    async loadContent() {
      this.statusMessage = 'Loading content...';
      this.isLoading = true;
      this.videoBlobUrl = '';
      this.subtitles = [];
      this.visibleSubtitles = [];
      this.activeSubtitleIndex = -1;

      try {
        const videoId = this.extractVideoId(this.videoUrl);
        if (!videoId) {
          this.statusMessage = 'Invalid YouTube URL';
          this.isLoading = false;
          return;
        }

        // Fetch and play video
        const videoResponse = await downloadVideo(this.videoUrl);
        if (videoResponse.status !== 200) {
          throw new Error('Failed to download video');
        }
        const videoBlob = new Blob([videoResponse.data], { type: 'video/mp4' });
        this.videoBlobUrl = URL.createObjectURL(videoBlob);

        // Fetch and parse subtitles
        const subtitleResponse = await downloadVideoSubtitles(this.videoUrl);
        if (subtitleResponse.status !== 200 || !subtitleResponse.data.data) {
          this.statusMessage = 'No subtitles available';
          this.isLoading = false;
          return;
        }
        this.parseSubtitles(subtitleResponse.data.data);
        this.statusMessage = 'Content loaded successfully!';
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

        if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname === '/watch') {
          return urlObj.searchParams.get('v') || url.match(/[?&]v=([^&]+)/)?.[1];
        }

        if (urlObj.hostname === 'youtu.be') {
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          return pathSegments[0] || null;
        }

        const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
        return match ? match[1] : null;
      } catch (e) {
        console.error('Invalid URL:', e);
        return null;
      }
    },
    parseSubtitles(webvttText) {
      // Parse WebVTT format
      const lines = webvttText.split('\n').filter(line => line.trim());
      const subtitles = [];
      let currentSubtitle = null;

      lines.forEach(line => {
        if (line.match(/\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}/)) {
          if (currentSubtitle) subtitles.push(currentSubtitle);
          const [start, end] = line.split(' --> ');
          currentSubtitle = { start: this.parseTime(start), end: this.parseTime(end), text: '' };
        } else if (currentSubtitle && line.trim()) {
          currentSubtitle.text += (currentSubtitle.text ? '\n' : '') + line.trim();
        }
      });
      if (currentSubtitle) subtitles.push(currentSubtitle);

      this.subtitles = subtitles;
    },
    parseTime(timeStr) {
      const [hours, minutes, seconds] = timeStr.split(':');
      const [secs, ms] = seconds.split('.');
      return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
    },
    updateSubtitle() {
      if (!this.videoPlayer.value) return;
      const currentTime = this.videoPlayer.value.currentTime;

      // Find the active subtitle
      this.activeSubtitleIndex = this.subtitles.findIndex(sub =>
          currentTime >= sub.start && currentTime < sub.end
      );

      // Update visible subtitles (show 5 subtitles: 2 before, active, 2 after)
      const startIndex = Math.max(0, this.activeSubtitleIndex - 2);
      const endIndex = Math.min(this.activeSubtitleIndex + 3, this.subtitles.length);
      this.visibleSubtitles = this.subtitles.slice(startIndex, endIndex);

      // Scroll to active subtitle if needed
      if (this.subtitleArea.value && this.activeSubtitleIndex >= 0) {
        const activeElement = this.subtitleArea.value.querySelector('.active');
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    onPlay() {
      // Ensure subtitles are updated immediately when playback starts
      this.updateSubtitle();
    },
    onPause() {
      // Optional: Keep the current subtitle visible when paused
      this.updateSubtitle();
    }
  },
  watch: {
    videoBlobUrl(newUrl) {
      if (newUrl && this.videoPlayer.value) {
        this.videoPlayer.value.load(); // Reload video when URL changes
      }
    }
  }
});
</script>

<style scoped>
.youtube-player {
  padding: 20px;
}

.input-container {
  margin-bottom: 20px;
}

input, button {
  margin: 5px;
  padding: 5px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-container {
  height: 50vh; /* Top half of the page */
  overflow: hidden;
  margin-bottom: 20px;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.subtitles-container {
  height: 45vh; /* Bottom half of the page, leaving space for status */
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}

.subtitle-text p {
  margin: 5px 0;
  padding: 5px;
  transition: background-color 0.3s;
  font-size: 16px;
  line-height: 1.5;
}

.subtitle-text p.active {
  background-color: #e0e0e0; /* Highlight active subtitle */
  font-weight: bold;
}

.status-message {
  margin-top: 10px;
  color: #d32f2f;
}
</style>