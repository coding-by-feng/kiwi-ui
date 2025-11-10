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
          <el-button
              type="primary"
              @click="cleanDb"
              class="management-button clean-audio-btn"
              :loading="loading">
            {{ $t('audio.cleanAudioData', { count: allDataSize }) }}
          </el-button>
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
          <el-button
              type="text"
              @click="playAudioData(currentPlayBgmIndex)"
              class="stop-button">
            <i class="el-icon-video-pause"></i>
            {{ $t('common.pause') }}
          </el-button>
        </div>
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

let that

export default {
  name: 'bgmPage',
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
        {id: 1, name: 'Rescue'},
        {id: 4010190, name: 'Death'},
      ],
      currentPlayBgmIndex: null,
      currentPlayBgm: null,
      // Read persisted preference using the standard config key
      bgm: getStore({name: kiwiConst.CONFIG_KEY.BGM})
    }
  },
  beforeCreate: function () {
    that = this
  },
  mounted() {
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
    playBgm(index) {
      console.log('playBgm accepted')
      console.log('this.currentPlayBgm.paused', this.currentPlayBgm.paused)
      if (this.currentPlayBgm.paused) {
        this.currentPlayBgm.src = `bgm/${this.bgmData[index].id}.mp3`
        this.currentPlayBgm.play()
        this.currentPlayBgmIndex = index
      }
    },
    playAudioData(index) {
      if (this.currentPlayBgmIndex === index) {
        this.currentPlayBgm.pause()
        this.currentPlayBgmIndex = null
        return
      }
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
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  overflow: hidden !important;
}

.card-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  margin: -20px -20px 20px -20px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.card-title {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 20px;
  }
}

.audio-management-section,
.bgm-player-section {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  i {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border: none !important;

  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  &:active {
    transform: translateY(0) !important;
  }

  i {
    margin-right: 8px;
  }
}

.clean-audio-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%) !important;
  color: white !important;

  &:hover {
    background: linear-gradient(135deg, #3a8ee6 0%, #5ca3f7 100%) !important;
    color: white !important;
  }

  &:focus {
    background: linear-gradient(135deg, #3a8ee6 0%, #5ca3f7 100%) !important;
    color: white !important;
  }
}

.custom-divider {
  border-top: 1px solid rgba(64, 158, 255, 0.2) !important;
  margin: 24px 0 !important;
}

.bgm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.bgm-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 2px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: rgba(64, 158, 255, 0.4);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
    transform: translateY(-2px);
  }

  &.playing {
    border-color: #409eff;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
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
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
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
  color: #2c3e50;
  font-size: 14px;
}

.bgm-status {
  font-size: 12px;
  color: #6c757d;
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
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
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
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.now-playing-card {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;

  i {
    font-size: 18px;
  }
}

.now-playing-text {
  flex: 1;
  font-size: 14px;

  strong {
    font-weight: 600;
  }
}

.stop-button {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
  transition: all 0.3s ease !important;

  &:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    color: white !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
  }

  &:focus {
    background: rgba(255, 255, 255, 0.3) !important;
    color: white !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
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
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.9) !important;
}

::v-deep .el-loading-spinner {
  color: #409eff !important;
}

/* Custom scrollbar */
.bgm-container::-webkit-scrollbar {
  width: 6px;
}

.bgm-container::-webkit-scrollbar-track {
  background: rgba(64, 158, 255, 0.1);
  border-radius: 3px;
}

.bgm-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border-radius: 3px;
}

.bgm-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
}
</style>