<template>
  <div class="youtube-page">
    <!-- Mode toggle control -->
    <div class="ytb-mode-switch">
      <el-radio-group v-model="currentMode" size="mini" @change="handleModeChange">
        <el-radio-button :label="modes.FAVORITES">Favorites</el-radio-button>
        <el-radio-button :label="modes.CHANNEL">Channel</el-radio-button>
        <el-radio-button :label="modes.PLAYER">Player</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Persist all sub-modes to avoid remounting when switching -->
    <keep-alive>
      <div>
        <youtube-favorites v-show="currentMode === modes.FAVORITES" />
        <youtube-channel v-show="currentMode === modes.CHANNEL" @play-video="openVideoFromChannel" />
        <youtube-player v-show="currentMode === modes.PLAYER" :video-url="selectedVideoUrl" />
      </div>
    </keep-alive>
  </div>
</template>

<script>
import YoutubePlayer from '@/page/ai/YoutubePlayer.vue'
import YoutubeChannel from '@/page/ai/YoutubeChannel.vue'
import YoutubeFavorites from '@/page/ai/YoutubeFavorites.vue'
import kiwiConsts from '@/const/kiwiConsts'

const STORAGE_KEY = 'ytb_state'

export default {
  name: 'YoutubePage',
  components: {
    YoutubePlayer,
    YoutubeChannel,
    YoutubeFavorites
  },
  data() {
    return {
      modes: kiwiConsts.YTB_MODE,
      currentMode: kiwiConsts.YTB_MODE.CHANNEL,
      selectedVideoUrl: null,
      restoring: false
    }
  },
  created() {
    // Attempt restoration from local storage first (before route normalization)
    this.restoreLocalState()
    this.initFromRoute()

    // Keep in sync with route changes
    this.$watch('$route', () => {
      this.initFromRoute()
    })
  },
  watch: {
    '$route.query'(newQuery) {
      // Update video url when present
      if (newQuery && (newQuery.videoUrl || newQuery.video)) {
        const raw = newQuery.videoUrl || newQuery.video
        this.selectedVideoUrl = this.safeDecode(raw)
        this.persistLocalState()
      }
    }
  },
  methods: {
    safeDecode(v) {
      if (!v) return v
      try { return decodeURIComponent(v) } catch (_) { return v }
    },
    initFromRoute() {
      const q = this.$route.query || {}
      // Determine mode from query, default to channel
      const allowed = [this.modes.PLAYER, this.modes.CHANNEL, this.modes.FAVORITES]
      const mode = allowed.includes(q.ytbMode) ? q.ytbMode : (this.currentMode || this.modes.CHANNEL)

      // Only normalize URL to include ytbMode when YouTube tab is active to avoid interfering with other tabs
      if (!q.ytbMode && this.$route.query.active === 'youtube') {
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
          this.selectedVideoUrl = this.safeDecode(videoUrl)
        }
      }

      this.persistLocalState()
    },

    // Handle UI toggle to switch modes and persist to URL
    handleModeChange(val) {
      const q = { ...(this.$route.query || {}) }
      this.currentMode = val
      this.persistLocalState()
      this.$router.replace({
        path: this.$route.path,
        query: { ...q, active: 'youtube', ytbMode: val, videoUrl: q.videoUrl || this.selectedVideoUrl }
      })
    },

    openVideoFromChannel(url) {
      // Fired when child channel component emits a play request
      if (!url) return
      this.selectedVideoUrl = this.safeDecode(url)
      // Switch to player mode but keep previous components cached
      this.currentMode = this.modes.PLAYER
      const q = { ...(this.$route.query || {}) }
      this.$router.replace({
        path: this.$route.path,
        query: { ...q, active: 'youtube', ytbMode: this.modes.PLAYER, videoUrl: encodeURIComponent(this.selectedVideoUrl) }
      })
      this.persistLocalState()
    },

    persistLocalState() {
      try {
        const payload = {
          mode: this.currentMode,
          videoUrl: this.selectedVideoUrl
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch (e) { /* ignore */ }
    },
    restoreLocalState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed.mode) this.currentMode = parsed.mode
        if (parsed.videoUrl) this.selectedVideoUrl = parsed.videoUrl
        this.restoring = true
      } catch (e) { /* ignore */ }
    }
  }
}
</script>

<style scoped>
.youtube-page {
  width: 100%;
  min-height: 400px;
}

.ytb-mode-switch {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>