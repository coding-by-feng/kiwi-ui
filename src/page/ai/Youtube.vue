<template>
  <div class="youtube-page">
    <!-- YouTube player component -->
    <youtube-player :video-url="selectedVideoUrl" />
  </div>
</template>

<script>
import YoutubePlayer from '@/page/ai/YoutubePlayer.vue'

export default {
  name: 'YoutubePage',
  components: {
    YoutubePlayer
  },
  data() {
    return {
      selectedVideoUrl: null
    }
  },
  created() {
    // Initialize video URL from route
    this.initFromRoute()

    // Listen for route changes
    this.$watch('$route', () => {
      this.initFromRoute()
    })
  },
  watch: {
    // Watch for videoUrl query parameter changes
    '$route.query': function(newQuery) {
      if (newQuery.videoUrl) {
        this.selectedVideoUrl = decodeURIComponent(newQuery.videoUrl);
      }
    }
  },
  methods: {
    initFromRoute() {
      // Get video URL from route parameters
      const videoUrl = this.$route.query.videoUrl || this.$route.query.video;
      if (videoUrl) {
        this.selectedVideoUrl = videoUrl;
      }
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