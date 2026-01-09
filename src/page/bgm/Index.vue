<template>
  <div class="bgm-container">
    <el-card class="bgm-card" v-loading="loading">
      <div slot="header" class="card-header">
        <h3 class="card-title">
          <i class="el-icon-headset"></i>
          {{ $t('audio.title') }}
        </h3>
      </div>

      <!-- Audio Management Section -->
      <div class="audio-management-section">
        <h4 class="section-title">
          <i class="el-icon-setting"></i>
          {{ $t('audio.management') }}
        </h4>
        <div class="management-buttons">
          <KiwiButton
              type="primary"
              @click="cleanDb"
              class="management-button clean-audio-btn"
              :loading="loading">
            {{ $t('audio.cleanAudioData', { count: allDataSize }) }}
          </KiwiButton>
        </div>
      </div>

      <el-divider class="custom-divider"></el-divider>

      <!-- BGM Player Section -->
      <div class="bgm-player-section">
        <h4 class="section-title">
          <i class="el-icon-video-play"></i>
          {{ $t('audio.backgroundMusic') }}
        </h4>
        <div class="bgm-grid">
          <div
              v-for="(item, index) in bgmData"
              :key="index"
              class="bgm-item"
              :class="{ 'playing': currentPlayBgmIndex === index }"
              @click="playAudioData(index)">
            <div class="bgm-content">
              <div class="bgm-icon">
                <i class="el-icon-loading spinning" v-if="currentPlayBgmIndex === index"></i>
                <i class="el-icon-video-play" v-else></i>
              </div>
              <div class="bgm-info">
                <span class="bgm-name">{{ item.name }}</span>
                <span class="bgm-status">
                  {{ currentPlayBgmIndex === index ? $t('audio.playing') : $t('audio.clickToPlay') }}
                </span>
              </div>
            </div>
            <div class="bgm-waves" v-if="currentPlayBgmIndex === index">
              <div class="wave"></div>
              <div class="wave"></div>
              <div class="wave"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Playing Info -->
      <div v-if="currentPlayBgmIndex !== null" class="now-playing-section">
        <div class="now-playing-card">
          <i class="el-icon-headset"></i>
          <span class="now-playing-text">
            {{ $t('audio.nowPlaying') }}: <strong>{{ bgmData[currentPlayBgmIndex].name }}</strong>
          </span>
          <KiwiButton
              type="text"
              @click="playAudioData(currentPlayBgmIndex)"
              class="stop-button">
            <i class="el-icon-video-pause"></i>
            {{ $t('common.pause') }}
          </KiwiButton>
        </div>
      </div>
      
      <!-- Hidden YouTube Player Container -->
      <div class="youtube-player-container">
        <div id="bgm-youtube-player"></div>
      </div>
    </el-card>
  </div>
</template>

<script>
import db, {cleanDb} from "@/util/db";
import kiwiConst from "@/const/kiwiConsts";
import {getStore} from "@/util/store";
import it from "element-ui/src/locale/lang/it";
import msgUtil from '@/util/msg'
import { clearWebsiteData as clearWebsiteDataUtil } from '@/util/clearWebsiteData'
import KiwiButton from '@/components/ui/KiwiButton.vue'

let that

export default {
  name: 'bgmPage',
  components: { KiwiButton },
  computed: {
    it() {
      return it
    }
  },
  data() {
    return {
      loading: false,
      allDataSize: 0,
      bgmData: [
        {id: 1, name: 'Rescue', type: 'local'},
        {id: 4010190, name: 'Death', type: 'local'},
        {id: 'bzABzr9gPC8', name: 'Day of the Triffids', type: 'youtube'},
      ],
      currentPlayBgmIndex: null,
      currentPlayBgm: null, // Local Audio object
      youtubePlayer: null, // YouTube Player instance
      youtubeApiReady: false,
      // Read persisted preference using the standard config key
      bgm: getStore({name: kiwiConst.CONFIG_KEY.BGM})
    }
  },
  beforeCreate: function () {
    that = this
  },
  mounted() {
    this.loadYouTubeAPI()
    this.currentPlayBgm = new Audio()
    this.currentPlayBgm.volume = 0.6
    this.currentPlayBgm.loop = false
    this.currentPlayBgm.addEventListener('ended', async function () {
      that.nextBgm()
    })
    // Only auto-play when explicitly enabled
    if (this.bgm === kiwiConst.ENABLE_BGM.ENABLE) {
      this.playBgm(0)
    }
    this.countDbAudio()
  },
  methods: {
    loadYouTubeAPI() {
      if (window.YT && window.YT.Player) {
        this.youtubeApiReady = true
        return
      }
      if (!document.getElementById('youtube-api-script')) {
        const tag = document.createElement('script')
        tag.id = 'youtube-api-script'
        tag.src = '/assets/external/youtube-iframe-api.js'
        document.head.appendChild(tag)
      }
      const self = this
      const prevCb = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = function() {
        self.youtubeApiReady = true
        if (typeof prevCb === 'function') {
          try { prevCb() } catch (e) { /* no-op */ }
        }
      }
    },
    initYoutubePlayer(videoId) {
      return new Promise((resolve) => {
        if (this.youtubePlayer) {
          this.youtubePlayer.loadVideoById(videoId)
          resolve()
          return
        }
        this.youtubePlayer = new window.YT.Player('bgm-youtube-player', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1
          },
          events: {
            'onReady': (event) => {
              event.target.playVideo()
              resolve()
            },
            'onStateChange': (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                this.nextBgm()
              }
            }
          }
        })
      })
    },
    countDbAudio() {
      db.openDB(kiwiConst.DB_NAME, kiwiConst.DB_VERSION).then(dbObject => {
        db.cursorGetData(dbObject, kiwiConst.DB_STORE_NAME)
            .then(allDataSize => {
              that.allDataSize = allDataSize
            })
      })
    },
    cleanDb() {
      this.loading = true
      db.cleanDbData(kiwiConst.DB_NAME, kiwiConst.DB_VERSION, kiwiConst.DB_STORE_NAME)
          .then(() => {
            that.countDbAudio()
            that.loading = false
            msgUtil.msgSuccess(that, this.$t('audio.audioCleanedSuccess'))
          })
          .catch($ => {
            msgUtil.msgError(that, this.$t('messages.systemError'))
          })
          .finally($ => {
            that.loading = false
          })
    },
    stopAll() {
      // Stop local audio
      if (this.currentPlayBgm) {
        this.currentPlayBgm.pause()
        this.currentPlayBgm.currentTime = 0
      }
      // Stop YouTube audio
      if (this.youtubePlayer && typeof this.youtubePlayer.stopVideo === 'function') {
        this.youtubePlayer.stopVideo()
      }
    },
    async playBgm(index) {
      console.log('playBgm accepted', index)
      
      // Stop currently playing
      this.stopAll()
      
      const item = this.bgmData[index]
      if (!item) return

      this.currentPlayBgmIndex = index

      if (item.type === 'youtube') {
        if (this.youtubeApiReady) {
          await this.initYoutubePlayer(item.id)
          if (this.youtubePlayer && typeof this.youtubePlayer.playVideo === 'function') {
            this.youtubePlayer.playVideo()
          }
        } else {
          console.warn('YouTube API not ready yet')
        }
      } else {
        // Default to local
        this.currentPlayBgm.src = `bgm/${item.id}.mp3`
        this.currentPlayBgm.play()
      }
    },
    playAudioData(index) {
      if (this.currentPlayBgmIndex === index) {
        // Toggle pause/play for current track
        const item = this.bgmData[index]
        if (item.type === 'youtube') {
          if (this.youtubePlayer) {
            const state = this.youtubePlayer.getPlayerState()
            if (state === window.YT.PlayerState.PLAYING) {
              this.youtubePlayer.pauseVideo()
              this.currentPlayBgmIndex = null // Mark as paused/stopped
            } else {
              this.youtubePlayer.playVideo()
            }
          }
        } else {
          if (!this.currentPlayBgm.paused) {
            this.currentPlayBgm.pause()
            this.currentPlayBgmIndex = null
          } else {
            this.currentPlayBgm.play()
          }
        }
        return
      }
      // Switch to new track
      this.playBgm(index)
    },
    nextBgm() {
      ++this.currentPlayBgmIndex
      if (this.currentPlayBgmIndex >= this.bgmData.length) {
        this.currentPlayBgmIndex = 0
      }
      this.playBgm(this.currentPlayBgmIndex)
    },
    async clearWebsiteData() {
      this.loading = true
      try {
        await clearWebsiteDataUtil()
        msgUtil.msgSuccess(this, this.$t('audio.cacheCleanedSuccess'))
      } catch (error) {
        console.error('Failed to clear website data:', error)
        msgUtil.msgError(this, this.$t('messages.systemError'))
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.bgm-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
  animation: fadeInUp 0.6s ease;
}

.bgm-card {
  border: 1px solid var(--border-color-light) !important;
  border-radius: var(--card-border-radius) !important;
  box-shadow: var(--shadow-card) !important;
  background: var(--bg-card) !important;
  overflow: hidden !important;
  backdrop-filter: var(--backdrop-filter);
}

.card-header {
  background: var(--bg-header);
  margin: -20px -20px 20px -20px;
  padding: 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.card-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 20px;
    color: var(--color-primary);
  }
}

.audio-management-section,
.bgm-player-section {
  margin-bottom: 24px;
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  padding: 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  i {
    background: var(--gradient-text);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.management-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.management-button {
  padding: 12px 20px !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: var(--shadow-card) !important;
  border: none !important;
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;

  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: var(--shadow-hover) !important;
  }

  &:active {
    transform: translateY(0) !important;
  }

  i {
    margin-right: 8px;
  }
}

.clean-audio-btn {
  background: var(--gradient-primary) !important;
  color: white !important;

  &:hover {
    opacity: 0.9;
    color: white !important;
  }

  &:focus {
    opacity: 0.9;
    color: white !important;
  }
}

.custom-divider {
  border-top: 1px solid var(--divider-color) !important;
  margin: 24px 0 !important;
}

.bgm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.bgm-item {
  background: var(--bg-card);
  border: 2px solid var(--border-color-light);
  border-radius: var(--card-border-radius);
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
  }

  &.playing {
    border-color: var(--color-primary);
    background: var(--bg-card);
    box-shadow: var(--shadow-card);
  }
}

.bgm-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.bgm-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;

  .spinning {
    animation: spin 1s linear infinite;
  }
}

.bgm-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bgm-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.bgm-status {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
}

.bgm-waves {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  display: flex;
  align-items: end;
  gap: 2px;
  padding: 0 16px 8px;
}

.wave {
  background: var(--gradient-primary);
  border-radius: 2px;
  height: 100%;
  flex: 1;
  animation: wave 1.5s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

.now-playing-section {
  position: sticky;
  bottom: 0;
  margin: 20px -20px -20px -20px;
  background: var(--bg-header);
  padding: 16px 20px;
  border-top: 1px solid var(--border-color-light);
  backdrop-filter: var(--backdrop-filter);
}

.now-playing-card {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);

  i {
    font-size: 18px;
    color: var(--color-primary);
  }
}

.now-playing-text {
  flex: 1;
  font-size: 14px;

  strong {
    font-weight: 600;
    color: var(--color-primary);
  }
}

.stop-button {
  color: var(--text-primary) !important;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
  transition: all 0.3s ease !important;

  &:hover {
    background: var(--bg-container) !important;
    color: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
  }

  &:focus {
    background: var(--bg-container) !important;
    color: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
  }

  i {
    margin-right: 4px;
  }
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes wave {
  0%, 100% {
    height: 2px;
    opacity: 0.5;
  }
  50% {
    height: 4px;
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .bgm-container {
    padding: 2px;
    margin: 2px;
  }

  .card-header {
    margin: -16px -16px 16px -16px;
    padding: 16px;
  }

  .card-title {
    font-size: 16px;
  }

  .audio-management-section,
  .bgm-player-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .management-buttons {
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .management-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
    text-align: center;
  }

  .bgm-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .bgm-item {
    padding: 12px;
  }

  .now-playing-section {
    margin: 16px -16px -16px -16px;
    padding: 12px 16px;
  }

  .now-playing-text {
    font-size: 13px;
  }

  .stop-button {
    font-size: 11px !important;
    padding: 6px 10px !important;
  }
}

/* Custom Card Loading */
::v-deep .el-card.is-loading {
  position: relative;
}

::v-deep .el-loading-mask {
  border-radius: var(--card-border-radius) !important;
  background: var(--bg-card) !important;
  opacity: 0.9;
}

::v-deep .el-loading-spinner {
  color: var(--color-primary) !important;
}

/* Custom scrollbar */
.bgm-container::-webkit-scrollbar {
  width: 6px;
}

.bgm-container::-webkit-scrollbar-track {
  background: var(--border-color-light);
  border-radius: 3px;
}

.bgm-container::-webkit-scrollbar-thumb {
  background: var(--gradient-primary);
  border-radius: 3px;
}

.bgm-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

.youtube-player-container {
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}
</style>