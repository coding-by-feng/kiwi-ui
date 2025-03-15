<template>
  <div class="youtube-player">
    <h1>YouTube Player</h1>

    <!-- Input and Button for YouTube URL -->
    <div class="input-container">
      <el-input
          v-model="videoUrl"
          type="text"
          placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
          @keyup.enter="loadContent"
          style="width: 100%;"
      />
      <el-divider></el-divider>
      <button @click="loadContent" :disabled="!videoUrl || isLoading" style="width: 150px; padding: 8px; font-size: 16px;">
        {{ isLoading ? 'Loading...' : 'Load Content' }}
      </button>
    </div>

    <!-- Video Player (Top Half) - Using YouTube IFrame -->
    <div class="video-container" v-if="videoId">
      <iframe
          ref="videoPlayer"
          :src="`https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="video-player"
      ></iframe>
    </div>

    <!-- Subtitles (Bottom Half) -->
    <div class="subtitles-container" ref="subtitleArea" v-if="subtitles.length">
      <p v-for="(subtitle, index) in subtitles" :key="index">
        {{ subtitle.text }}
      </p>
      <!-- Add a dummy element to ensure the last subtitle is fully visible -->
      <div class="scroll-filler" v-if="subtitles.length > 0"> </div>
    </div>

    <!-- Status Message -->
    <p class="status-message">{{ statusMessage }}</p>
  </div>
</template>

<script>
import { defineComponent, ref, nextTick } from 'vue';
import { downloadVideoSubtitles } from '@/api/ai';

export default defineComponent({
  name: 'YoutubeSubtitleDownloader',
  data() {
    return {
      videoUrl: '',
      videoId: null, // Store the extracted video ID
      subtitles: [],
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
      this.videoId = null;
      this.subtitles = [];

      try {
        const videoId = this.extractVideoId(this.videoUrl);
        if (!videoId) {
          this.statusMessage = 'Invalid YouTube URL';
          this.isLoading = false;
          return;
        }

        this.videoId = videoId; // Set the video ID for the iframe

        // Fetch subtitles using the existing API
        const subtitleResponse = await downloadVideoSubtitles(this.videoUrl).catch(error => {
          console.error('Error downloading subtitles:', error);
          return { status: 500, data: { data: null } };
        });

        if (subtitleResponse.status !== 200 || !subtitleResponse.data.data) {
          this.statusMessage = 'Video loaded, but no subtitles available';
        } else {
          this.parseSubtitles(subtitleResponse.data.data);
          this.statusMessage = 'Content loaded successfully!';
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
          currentSubtitle = { start: this.parseTime(start), end: this.parseTime(end), text: '' };
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
  watch: {
    videoId(newId) {
      if (newId && this.videoPlayer?.value) {
        // No need to load manually; the iframe handles it
      }
    }
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

.input-container button {
  padding: 8px;
  font-size: 16px;
}

.video-container {
  flex: 1 0 40%;
  overflow: hidden;
  padding: 0;
  margin-bottom: 10px;
  position: relative; /* Ensure iframe is positioned correctly */
}

.video-container .video-player {
  width: 100%;
  height: 100%;
  border: none; /* Remove default iframe border */
}

.subtitles-container {
  flex: 1 0 55%;
  overflow-y: auto;
  padding: 0;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  min-height: 100px;
}

.subtitles-container p {
  margin: 5px 0;
  padding: 8px;
}

.scroll-filler {
  margin-top: 10px;
  height: calc(2em + 150px); /* Based on font-size and padding of subtitles */
}

.status-message {
  padding: 10px;
  margin: 0;
  color: #d32f2f;
  flex-shrink: 0;
}

/* Responsive adjustments for mobile */
@media (max-width: 768px) {
  .video-container {
    flex: 1 0 30%;
  }
  .subtitles-container {
    flex: 1 0 65%;
  }
}
</style>