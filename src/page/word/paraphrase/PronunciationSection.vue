<!-- components/PronunciationSection.vue -->
<template>
  <div class="pronunciation-section">
    <!-- Normal Layout (Non-overlength) -->
    <el-row
        v-if="!isOverlength && pronunciationList && pronunciationList.length > 0"
        type="flex"
        justify="end"
        class="pronunciation-row"
    >
      <el-col
          v-for="pronunciation in pronunciationList"
          :key="pronunciation.pronunciationId"
          class="pronunciation-col"
      >
        <el-tag
            type="info"
            @click="playPronunciation(pronunciation)"
            class="pronunciation-tag"
            :class="{ 'playing': isPronunciationPlaying(pronunciation.soundmarkType) }"
        >
          <span class="soundmark">{{ pronunciation.soundmark }}</span>
          <span class="soundmark-type">[{{ pronunciation.soundmarkType }}]</span>

          <!-- Play/Loading Icons -->
          <i
              v-if="pronunciation.soundmarkType === 'UK' && !isUkPlaying"
              class="el-icon-video-play play-icon"
          ></i>
          <i
              v-if="pronunciation.soundmarkType === 'US' && !isUsPlaying"
              class="el-icon-video-play play-icon"
          ></i>
          <i
              v-if="pronunciation.soundmarkType === 'UK' && isUkPlaying"
              class="el-icon-loading loading-icon"
          ></i>
          <i
              v-if="pronunciation.soundmarkType === 'US' && isUsPlaying"
              class="el-icon-loading loading-icon"
          ></i>
        </el-tag>
      </el-col>
    </el-row>

    <!-- Overlength Layout (Stacked) -->
    <div
        v-if="isOverlength && pronunciationList && pronunciationList.length > 0"
        class="pronunciation-overlength"
    >
      <el-row
          v-for="pronunciation in pronunciationList"
          :key="pronunciation.pronunciationId"
          type="flex"
          justify="end"
          class="pronunciation-row-stacked"
      >
        <el-col class="pronunciation-col-stacked">
          <el-tag
              type="info"
              @click="playPronunciation(pronunciation)"
              class="pronunciation-tag-stacked"
              :class="{ 'playing': isPronunciationPlaying(pronunciation.soundmarkType) }"
          >
            <span class="soundmark">{{ pronunciation.soundmark }}</span>
            <span class="soundmark-type">[{{ pronunciation.soundmarkType }}]</span>

            <!-- Play/Loading Icons -->
            <i
                v-if="pronunciation.soundmarkType === 'UK' && !isUkPlaying"
                class="el-icon-video-play play-icon"
            ></i>
            <i
                v-if="pronunciation.soundmarkType === 'US' && !isUsPlaying"
                class="el-icon-video-play play-icon"
            ></i>
            <i
                v-if="pronunciation.soundmarkType === 'UK' && isUkPlaying"
                class="el-icon-loading loading-icon"
            ></i>
            <i
                v-if="pronunciation.soundmarkType === 'US' && isUsPlaying"
                class="el-icon-loading loading-icon"
            ></i>
          </el-tag>
        </el-col>
      </el-row>
    </div>

    <!-- Empty State -->
    <div v-if="!pronunciationList || pronunciationList.length === 0" class="no-pronunciation">
      <el-tag type="info" effect="plain" class="no-pronunciation-tag">
        <i class="el-icon-warning-outline"></i>
        暂无发音信息
      </el-tag>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PronunciationSection',
  props: {
    pronunciationList: {
      type: Array,
      default: () => []
    },
    isOverlength: {
      type: Boolean,
      default: false
    },
    isUkPlaying: {
      type: Boolean,
      default: false
    },
    isUsPlaying: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    playPronunciation(pronunciation) {
      this.$emit('play-pronunciation', {
        id: pronunciation.pronunciationId,
        url: pronunciation.sourceUrl,
        type: pronunciation.soundmarkType
      })
    },

    isPronunciationPlaying(type) {
      return (type === 'UK' && this.isUkPlaying) || (type === 'US' && this.isUsPlaying)
    }
  }
}
</script>

<style scoped>
.pronunciation-section {
  margin-top: 8px;
}

/* Normal Layout Styles */
.pronunciation-row {
  background-color: #8c939d;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.pronunciation-col {
  margin-left: 8px;
}

.pronunciation-col:first-child {
  margin-left: 0;
}

/* Overlength Layout Styles */
.pronunciation-overlength {
  background-color: #8c939d;
  border-radius: 8px;
  overflow: hidden;
}

.pronunciation-row-stacked {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pronunciation-row-stacked:last-child {
  border-bottom: none;
}

.pronunciation-col-stacked {
  width: 100%;
}

/* Pronunciation Tag Styles */
.pronunciation-tag,
.pronunciation-tag-stacked {
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.pronunciation-tag:hover,
.pronunciation-tag-stacked:hover {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pronunciation-tag.playing,
.pronunciation-tag-stacked.playing {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  animation: pulse 1.5s infinite;
}

/* Soundmark Text Styles */
.soundmark {
  font-family: 'Times New Roman', serif;
  font-size: 15px;
  font-weight: 500;
}

.soundmark-type {
  font-size: 12px;
  font-weight: 700;
  opacity: 0.8;
}

/* Icon Styles */
.play-icon {
  color: #409eff;
  font-size: 12px;
  transition: all 0.3s ease;
}

.loading-icon {
  color: #409eff;
  font-size: 12px;
  animation: rotating 1s linear infinite;
}

.pronunciation-tag.playing .play-icon,
.pronunciation-tag.playing .loading-icon,
.pronunciation-tag-stacked.playing .play-icon,
.pronunciation-tag-stacked.playing .loading-icon {
  color: white;
}

/* No Pronunciation State */
.no-pronunciation {
  text-align: center;
  padding: 12px;
  background-color: rgba(144, 147, 153, 0.1);
  border-radius: 8px;
}

.no-pronunciation-tag {
  background: rgba(255, 255, 255, 0.8);
  color: #909399;
  border: 1px dashed #d4d4d4;
  font-size: 13px;
  padding: 6px 12px;
}

.no-pronunciation-tag i {
  margin-right: 4px;
}

/* Animations */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .pronunciation-row,
  .pronunciation-row-stacked {
    padding: 8px 12px;
  }

  .pronunciation-tag,
  .pronunciation-tag-stacked {
    font-size: 13px;
    padding: 6px 10px;
    gap: 6px;
  }

  .soundmark {
    font-size: 14px;
  }

  .soundmark-type {
    font-size: 11px;
  }

  .play-icon,
  .loading-icon {
    font-size: 11px;
  }

  .no-pronunciation-tag {
    font-size: 12px;
    padding: 5px 10px;
  }
}

/* High DPI Display Support */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .soundmark {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Focus States for Accessibility */
.pronunciation-tag:focus,
.pronunciation-tag-stacked:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* Dark Mode Support (if needed) */
@media (prefers-color-scheme: dark) {
  .pronunciation-tag,
  .pronunciation-tag-stacked {
    background: rgba(255, 255, 255, 0.9);
    color: #2c3e50;
  }

  .no-pronunciation {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .no-pronunciation-tag {
    background: rgba(255, 255, 255, 0.1);
    color: #c0c4cc;
    border-color: #4c4d4f;
  }
}
</style>