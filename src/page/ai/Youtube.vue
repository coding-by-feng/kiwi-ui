<template>
  <div class="youtube-page">
    <!-- Conditionally render Channel manager or Player based on route ytbMode -->
    <youtube-channel v-if="currentMode === modes.CHANNEL" />
    <youtube-player v-else :video-url="selectedVideoUrl" />
  </div>
</template>

<script>
import YoutubePlayer from '@/page/ai/YoutubePlayer.vue'
import YoutubeChannel from '@/page/ai/YoutubeChannel.vue'
import kiwiConsts from '@/const/kiwiConsts'

export default {
  name: 'YoutubePage',
  components: {
    YoutubePlayer,
    YoutubeChannel
  },
  data() {
    return {
      modes: kiwiConsts.YTB_MODE,
      currentMode: kiwiConsts.YTB_MODE.CHANNEL,
      selectedVideoUrl: null
    }
  },
  created() {
    this.initFromRoute()

    // Keep in sync with route changes
    this.$watch('$route', () => {
      this.initFromRoute()
    })
  },
  watch: {
    '$route.query'(newQuery) {
      // Update video url when present
      if (newQuery && newQuery.videoUrl) {
        try { this.selectedVideoUrl = decodeURIComponent(newQuery.videoUrl) } catch (_) { this.selectedVideoUrl = newQuery.videoUrl }
      }
    }
  },
  methods: {
    initFromRoute() {
      const q = this.$route.query || {}
      // Determine mode from query, default to channel
      const mode = (q.ytbMode === this.modes.PLAYER || q.ytbMode === this.modes.CHANNEL) ? q.ytbMode : this.modes.CHANNEL

      // If ytbMode is missing, normalize URL to include default to improve deep-link consistency
      if (!q.ytbMode) {
        this.$router.replace({
          path: this.$route.path,
          query: { ...q, ytbMode: mode }
        })
      }

      this.currentMode = mode

      // Set video url only for player mode
      if (this.currentMode === this.modes.PLAYER) {
        const videoUrl = q.videoUrl || q.video
        if (videoUrl) {
          try { this.selectedVideoUrl = decodeURIComponent(videoUrl) } catch (_) { this.selectedVideoUrl = videoUrl }
        }
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