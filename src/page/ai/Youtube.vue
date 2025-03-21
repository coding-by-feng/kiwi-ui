<template>
  <div class="youtube-page">
    <!-- Main component that will be displayed when the youtubePlayer tab is clicked -->
    <youtube-channel v-if="showChannel" />

    <!-- Conditionally render the YouTube player when a video is selected -->
    <youtube-player v-if="showYoutubePlayer" :video-url="selectedVideoUrl" />
  </div>
</template>

<script>
import YoutubeChannel from '@/page/ai/YoutubeChannel.vue'
import YoutubePlayer from '@/page/ai/YoutubePlayer.vue'

export default {
  name: 'YoutubePage',
  components: {
    YoutubeChannel,
    YoutubePlayer
  },
  data() {
    return {
      showChannel: true,
      showYoutubePlayer: false,
      selectedVideoUrl: null
    }
  },
  created() {
    // If you need to handle routing or get data from the route
    this.initFromRoute()

    // Listen for route changes
    this.$watch('$route', () => {
      this.initFromRoute()
    })
  },
  watch: {
    // Watch for ytbMode query parameter changes
    '$route.query.ytbMode': function(newMode) {
      if (newMode === 'player') {
        this.showYoutubePlayer = true;
        this.showChannel = false;
        // If video URL is provided, use it
        if (this.$route.query.videoUrl) {
          this.selectedVideoUrl = decodeURIComponent(this.$route.query.videoUrl);
        }
      } else if (newMode === 'channel') {
        this.showYoutubePlayer = false;
        this.showChannel = true;
        this.selectedVideoUrl = null;
      }
    }
  },
  methods: {
    initFromRoute() {
      // Check for ytbMode parameter first
      const ytbMode = this.$route.query.ytbMode;
      if (ytbMode) {
        // The watch will handle this case
        return;
      }

      // Legacy handling for video parameter
      const videoUrl = this.$route.query.videoUrl || this.$route.query.video;
      if (videoUrl) {
        this.showVideo(videoUrl);
      } else {
        this.showChannelList();
      }
    },

    // Method to switch to the video player
    showVideo(videoUrl) {
      this.selectedVideoUrl = videoUrl;
      this.showYoutubePlayer = true;
      this.showChannel = false;
    },

    // Method to switch back to the channel manager
    showChannelList() {
      this.showYoutubePlayer = false;
      this.showChannel = true;
      this.selectedVideoUrl = null;
    }
  }
}
</script>

<style scoped>
.youtube-page {
  width: 100%;
  min-height: 400px;
}
</style>