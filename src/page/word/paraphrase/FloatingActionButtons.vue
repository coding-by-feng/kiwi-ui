<template>
  <div class="floating-actions-container">
    <!-- First Row - Navigation and Detail Actions -->
    <div class="action-row">
      <el-button
          v-if="enableShowDetailIcon"
          type="info"
          size="mini"
          @click="$emit('show-detail', (detail.paraphraseVO && detail.paraphraseVO.paraphraseId) || null, detail.showIndex || 0)"
          class="action-button detail-button"
          title="显示详情"
      >
        <i class="el-icon-document"></i>
      </el-button>

      <el-button
          v-if="enableSleepModeIcon"
          type="info"
          @click="$emit('switch-sleep-mode')"
          size="mini"
          class="action-button sleep-button"
          title="睡眠模式"
      >
        <i class="el-icon-thumb"></i>
      </el-button>

      <el-button
          v-if="showPreviousPageIcon"
          type="info"
          size="mini"
          @click="$emit('previous-page')"
          class="action-button page-button"
          title="上一页"
      >
        <i class="el-icon-d-arrow-left"></i>
      </el-button>

      <el-button
          v-if="showNextPageIcon"
          type="info"
          size="mini"
          @click="$emit('next-page')"
          class="action-button page-button"
          title="下一页"
      >
        <i class="el-icon-d-arrow-right"></i>
      </el-button>
    </div>

    <!-- Second Row - Review Control Actions -->
    <div class="action-row">
      <el-button
          v-if="enableSkipSomeAudioIcon"
          type="info"
          size="mini"
          @click="$emit('skip-audio', true)"
          class="action-button skip-button"
          title="跳过部分音频"
      >
        <i class="el-icon-finished"></i>
      </el-button>

      <el-button
          v-if="enableStopwatchIcon"
          type="info"
          size="mini"
          @click="$emit('switch-stopwatch')"
          class="action-button stopwatch-button"
          title="倒计时模式"
      >
        <i class="el-icon-stopwatch" v-if="!countdownMode"></i>
        <i class="el-icon-switch-button" v-if="countdownMode"></i>
      </el-button>

      <el-button
          v-if="enableShowPreviousIcon"
          type="info"
          size="mini"
          @click="$emit('show-previous')"
          class="action-button nav-button"
          title="上一个"
      >
        <i class="el-icon-arrow-left"></i>
      </el-button>

      <el-button
          v-if="enableShowNextIcon"
          type="info"
          size="mini"
          @click="$emit('show-next', false)"
          class="action-button nav-button"
          title="下一个"
      >
        <i class="el-icon-arrow-right"></i>
      </el-button>

      <el-button
          v-if="enableStopPlayingIcon"
          type="info"
          @click="$emit('stop-playing')"
          size="mini"
          class="action-button stop-button"
          title="停止播放"
      >
        <i class="el-icon-video-pause"></i>
      </el-button>

      <el-button
          v-if="enableRefreshReviseDetailIcon"
          type="info"
          @click="$emit('refresh-revise')"
          size="mini"
          class="action-button refresh-button"
          title="刷新复习"
      >
        <i class="el-icon-brush"></i>
      </el-button>
    </div>

    <!-- Third Row - Learning Actions -->
    <div class="action-row">
      <el-button
          v-if="isStockReviewModel && !detail.isUnfoldOperateIcon"
          type="info"
          size="mini"
          @click="$emit('remember-one')"
          class="action-button remember-button"
          title="记住单词"
      >
        <i class="el-icon-success"></i>
      </el-button>

      <el-button
          v-if="isEnhanceReviewModel && !detail.isUnfoldOperateIcon"
          type="info"
          size="mini"
          @click="$emit('keep-in-mind')"
          class="action-button master-button"
          title="牢记单词"
      >
        <i class="el-icon-medal"></i>
      </el-button>

      <el-button
          v-if="detail.paraphraseVO && detail.paraphraseVO.wordName && !detail.isUnfoldOperateIcon"
          type="info"
          size="mini"
          @click="$emit('handle-show-detail')"
          class="action-button open-button"
          title="打开详情页"
      >
        <i class="el-icon-open"></i>
      </el-button>

      <el-button
          v-if="detail.paraphraseVO && detail.paraphraseVO.paraphraseId && !detail.isUnfoldOperateIcon"
          type="info"
          size="mini"
          @click="$emit('forget-one')"
          class="action-button forget-button"
          title="忘记单词"
      >
        <i class="el-icon-question"></i>
      </el-button>

      <el-button
          type="info"
          size="mini"
          @click="$emit('toggle-icons')"
          class="action-button toggle-button"
          title="展开/收起操作"
      >
        <i class="el-icon-s-unfold" v-if="!detail.isUnfoldOperateIcon"></i>
        <i class="el-icon-s-fold" v-if="detail.isUnfoldOperateIcon"></i>
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloatingActionButtons',
  props: {
    detail: {
      type: Object,
      default: () => ({
        isUnfoldOperateIcon: false,
        dialogVisible: false,
        paraphraseVO: {}
      })
    },
    isReview: {
      type: Boolean,
      default: false
    },
    isFirstIncome: {
      type: Boolean,
      default: true
    },
    isReviewStop: {
      type: Boolean,
      default: false
    },
    isReviewPlaying: {
      type: Boolean,
      default: false
    },
    page: {
      type: Object,
      default: () => ({
        current: 1,
        pages: 1
      })
    },
    isStockReviewModel: {
      type: Boolean,
      default: false
    },
    isEnhanceReviewModel: {
      type: Boolean,
      default: false
    },
    countdownMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    showPreviousPageIcon() {
      return !this.detail.isUnfoldOperateIcon && this.page.current >= 1
    },
    showNextPageIcon() {
      return !this.detail.isUnfoldOperateIcon && this.page.current < this.page.pages
    },
    enableShowDetailIcon() {
      return !this.detail.isUnfoldOperateIcon && !this.detail.dialogVisible &&
          this.detail.paraphraseVO && this.detail.paraphraseVO.paraphraseId
    },
    enableStopwatchIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview
    },
    enableShowPreviousIcon() {
      return !this.detail.isUnfoldOperateIcon && !this.isReview
    },
    enableShowNextIcon() {
      return !this.detail.isUnfoldOperateIcon
    },
    enableSleepModeIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview && this.detail.dialogVisible
    },
    enableStopPlayingIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview && !this.isReviewStop
    },
    enableRefreshReviseDetailIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview && this.isReviewStop && !this.isReviewPlaying
    },
    enableSkipSomeAudioIcon() {
      return !this.detail.isUnfoldOperateIcon && this.isReview
    }
  }
}
</script>

<style scoped>
.floating-actions-container {
  position: fixed;
  bottom: 15px;
  right: 15px;
  z-index: 2147483646;
  text-align: right;
  line-height: 30px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-row {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}

.action-button {
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: none !important;
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  transition: all 0.3s ease;
  z-index: -1;
}

.action-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.action-button:hover::before {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
}

.action-button:active {
  transform: translateY(0) scale(0.95);
}

/* Specific button type styling */
.detail-button::before {
  background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
}

.sleep-button::before {
  background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
}

.page-button::before {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.skip-button::before {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.stopwatch-button::before {
  background: linear-gradient(135deg, #ff5722 0%, #d84315 100%);
}

.nav-button::before {
  background: linear-gradient(135deg, #607d8b 0%, #455a64 100%);
}

.stop-button::before {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.refresh-button::before {
  background: linear-gradient(135deg, #795548 0%, #5d4037 100%);
}

.remember-button::before {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
}

.master-button::before {
  background: linear-gradient(135deg, #ffc107 0%, #f57f17 100%);
}

.open-button::before {
  background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
}

.forget-button::before {
  background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
}

.toggle-button::before {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

/* Button text color */
.action-button {
  color: white !important;
}

/* Responsive design */
@media (max-width: 768px) {
  .floating-actions-container {
    bottom: 10px;
    right: 10px;
    gap: 6px;
  }

  .action-row {
    gap: 4px;
  }

  .action-button {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
  }
}

/* Animation for button appearance */
@keyframes buttonFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-button {
  animation: buttonFadeIn 0.3s ease-out;
}

/* Hover state enhancements */
.action-button:hover {
  z-index: 10;
}

/* Focus states for accessibility */
.action-button:focus {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Disabled state */
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.action-button:disabled::before {
  background: #bbb !important;
}
</style>