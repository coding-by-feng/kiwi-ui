<!-- components/WordDetailDialog.vue -->
<template>
  <el-dialog
      ref="detailDialog"
      :visible.sync="dialogVisible"
      fullscreen
      width="100%"
      class="word-detail-dialog"
      @close="$emit('close')"
  >
    <!-- Dialog Title with Sleep Mode Support -->
    <div slot="title" class="dialog-title">
      <!-- Sleep Mode Gesture Area -->
      <v-touch
          v-if="detail.isSleepMode"
          @click.stop="$emit('audio-play-trigger')"
          @swipeup="$emit('stop-playing')"
          @swipedown="$emit('show-next', true)"
          @swipeleft="$emit('remember-in-sleep', false)"
          @swiperight="$emit('show-next', false)"
          class="sleep-mode-gestures"
          :style="{height: innerHeightSleepModePx}"
      >
        <div class="gesture-instructions">
          <div class="gesture-item">
            <el-tag type="info" effect="dark">
              <i class="el-icon-right"></i>&nbsp;右滑跳过
            </el-tag>
          </div>
          <div class="gesture-item">
            <el-tag type="info" effect="dark">
              <i class="el-icon-back"></i>&nbsp;左滑记住
            </el-tag>
          </div>
          <div class="gesture-item">
            <el-tag type="info" effect="dark">
              <i class="el-icon-thumb"></i>&nbsp;单击从头开始听当前单词
            </el-tag>
          </div>
          <div class="gesture-item">
            <el-tag type="info" effect="dark">
              <i class="el-icon-top"></i>&nbsp;上滑暂停当前播放单词
            </el-tag>
          </div>
          <div class="gesture-item">
            <el-tag type="info" effect="dark">
              <i class="el-icon-bottom"></i>&nbsp;下滑跳过spelling
            </el-tag>
          </div>
        </div>
      </v-touch>

      <!-- Word Display -->
      <div class="word-display-section">
        <el-divider v-if="detail.isSleepMode"></el-divider>

        <div class="word-title-container">
          <el-tag
              type="info"
              :hit="true"
              class="word-title-tag"
              @click="$emit('toggle-word-display')"
          >
            {{ showWordSpelling }}
          </el-tag>

          <el-button
              v-if="isReview && detail.isSleepMode"
              type="info"
              @click="$emit('switch-sleep-mode')"
              size="mini"
              class="sleep-mode-toggle"
          >
            <i class="el-icon-thumb"></i>
          </el-button>
        </div>
      </div>
    </div>

    <!-- Word Content Card -->
    <el-card class="word-content-card">
      <!-- Word Header Information -->
      <div slot="header" class="word-header">
        <!-- Word Labels -->
        <el-row type="flex" justify="end" class="word-labels-row">
          <el-col>
            <el-tag type="info" class="word-character-tag">
              {{ detail.paraphraseVO.wordCharacter }}
            </el-tag>
            <el-tag
                v-if="detail.paraphraseVO.wordLabel && detail.paraphraseVO.wordLabel !== ''"
                type="info"
                class="word-label-tag"
            >
              {{ detail.paraphraseVO.wordLabel }}
            </el-tag>
          </el-col>
        </el-row>

        <!-- Pronunciation Section -->
        <PronunciationSection
            :pronunciation-list="detail.paraphraseVO.pronunciationVOList"
            :is-overlength="detail.paraphraseVO.isOverlength"
            :is-uk-playing="isUKPronunciationPlaying"
            :is-us-playing="isUSPronunciationPlaying"
            @play-pronunciation="$emit('play-pronunciation', $event.id, $event.url, $event.type)"
        />

        <!-- Main Definition Section -->
        <div
            @click="toggleTranslation"
            class="definition-section"
        >
          <el-alert
              ref="paraphraseDetail"
              type="info"
              :description="detail.showTranslation ? detail.paraphraseVO.meaningChinese : detail.hideTranslationPrompt"
              :closable="false"
              effect="dark"
              center
              class="definition-alert"
          >
            <div slot="title" class="definition-content">
              <!-- Phrases -->
              <div v-if="detail.paraphraseVO.phraseList" class="phrase-section">
                <el-tag
                    v-for="phrase in detail.paraphraseVO.phraseList"
                    :key="phrase"
                    type="info"
                    class="phrase-tag"
                >
                  {{ phrase }}
                </el-tag>
              </div>

              <!-- Codes -->
              <p v-if="detail.paraphraseVO.codes" class="word-codes">
                {{ detail.paraphraseVO.codes }}
              </p>

              <!-- English Definition -->
              <div class="english-definition">
                {{ detail.paraphraseVO.paraphraseEnglish }}
              </div>
            </div>
          </el-alert>
        </div>
      </div>

      <!-- Examples Section -->
      <div class="examples-section">
        <!-- No Examples Alert -->
        <el-alert
            v-if="!detail.paraphraseVO.exampleVOList || detail.paraphraseVO.exampleVOList.length === 0"
            type="info"
            title="该释义暂时没有例句"
            center
            effect="light"
            :closable="false"
            class="no-examples-alert"
        />

        <!-- Example Items -->
        <div
            v-for="example in detail.paraphraseVO.exampleVOList"
            :key="example.id"
            @click="toggleTranslation"
            class="example-item"
        >
          <el-alert
              type="info"
              center
              effect="light"
              :description="detail.showTranslation ? example.exampleTranslate : '释义已经隐藏，点击该区域显示/隐藏'"
              :closable="false"
              class="example-alert"
          >
            <div slot="title" class="example-sentence">
              {{ example.exampleSentence }}
            </div>
          </el-alert>
        </div>
      </div>

      <!-- Bottom Spacing -->
      <div class="bottom-spacing"></div>
    </el-card>
  </el-dialog>
</template>

<script>
import PronunciationSection from './PronunciationSection.vue'

export default {
  name: 'WordDetailDialog',
  components: {
    PronunciationSection
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    detail: {
      type: Object,
      required: true
    },
    isReview: {
      type: Boolean,
      default: false
    },
    isChToEn: {
      type: Boolean,
      default: false
    },
    innerHeightPx: {
      type: String,
      required: true
    },
    innerHeightSleepModePx: {
      type: String,
      required: true
    },
    isUKPronunciationPlaying: {
      type: Boolean,
      default: false
    },
    isUSPronunciationPlaying: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      default: ''
    },
    showWordSpelling: {
      type: String,
      default: '点击切换是否显示单词'
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    }
  },
  methods: {
    toggleTranslation() {
      this.$emit('toggle-translation')
    }
  }
}
</script>

<style scoped>
.word-detail-dialog {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

/* Dialog Title Styles */
.dialog-title {
  margin-bottom: -35px;
}

.sleep-mode-gestures {
  background: #909399;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sleep-mode-gestures:hover {
  background: #787c82;
}

.gesture-instructions {
  padding: 20px;
  text-align: center;
}

.gesture-item {
  margin-bottom: 12px;
}

.gesture-item:last-child {
  margin-bottom: 0;
}

.word-display-section {
  padding: 0 20px;
}

.word-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.word-title-tag {
  font-size: 18px;
  font-weight: bold;
  font-family: sans-serif;
  padding: 12px 20px;
  cursor: pointer;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.word-title-tag:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.sleep-mode-toggle {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
  border: none !important;
  color: white !important;
  transition: all 0.3s ease;
}

.sleep-mode-toggle:hover {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  transform: translateY(-1px);
}

/* Word Content Card */
.word-content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Word Header */
.word-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.word-labels-row {
  background-color: #8c939d;
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
}

.word-character-tag,
.word-label-tag {
  margin-right: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  border: none;
  font-weight: 600;
}

/* Definition Section */
.definition-section {
  margin-top: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.definition-section:hover {
  transform: translateY(-1px);
}

.definition-alert {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.definition-content {
  text-align: left;
}

.phrase-section {
  margin-bottom: 12px;
}

.phrase-tag {
  margin-right: 8px;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  border: none;
}

.word-codes {
  font-size: 14px;
  color: #606266;
  margin: 8px 0;
  font-style: italic;
}

.english-definition {
  word-wrap: break-word;
  overflow: hidden;
  line-height: 1.6;
  font-size: 15px;
  color: #2c3e50;
}

/* Examples Section */
.examples-section {
  padding: 0 20px;
}

.no-examples-alert {
  margin-bottom: 20px;
  border-radius: 8px;
  background: rgba(144, 147, 153, 0.1);
}

.example-item {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-item:hover {
  transform: translateY(-1px);
}

.example-alert {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.example-alert:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.example-sentence {
  font-size: 15px;
  line-height: 1.6;
  color: #2c3e50;
  font-weight: 500;
}

.bottom-spacing {
  margin-top: 100px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .word-title-tag {
    font-size: 16px;
    padding: 10px 16px;
  }

  .word-content-card {
    border-radius: 8px;
  }

  .definition-alert,
  .example-alert {
    border-radius: 6px;
  }

  .phrase-tag {
    font-size: 12px;
    padding: 4px 8px;
  }

  .english-definition {
    font-size: 14px;
  }

  .example-sentence {
    font-size: 14px;
  }

  .examples-section {
    padding: 0 12px;
  }

  .gesture-instructions {
    padding: 16px;
  }

  .gesture-item {
    margin-bottom: 8px;
  }
}

/* Element UI Dialog Overrides */
.word-detail-dialog :deep(.el-dialog) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.word-detail-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 0;
}

.word-detail-dialog :deep(.el-dialog__body) {
  padding: 20px;
  background: transparent;
}

/* Card overrides */
.word-content-card :deep(.el-card__header) {
  background: transparent;
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.word-content-card :deep(.el-card__body) {
  padding: 20px;
}

/* Alert overrides */
.definition-alert :deep(.el-alert__content) {
  text-align: left;
}

.definition-alert :deep(.el-alert__title) {
  color: white;
  font-weight: 600;
}

.definition-alert :deep(.el-alert__description) {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-top: 8px;
}

.example-alert :deep(.el-alert__title) {
  color: #2c3e50;
  font-weight: 500;
}

.example-alert :deep(.el-alert__description) {
  color: #606266;
  font-size: 13px;
  margin-top: 6px;
  font-style: italic;
}
</style>