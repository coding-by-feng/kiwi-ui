<template>
  <div class="study-timer-container">
    <el-card class="timer-card">
      <div class="timer-header">
        <el-dropdown
            size="mini"
            split-button
            type="info"
            @command="handleCommand"
            class="timer-dropdown"
        >
          <i class="el-icon-stopwatch timer-icon"></i>{{ countdownText }}
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item :command="{text:'1小时',m:60}">1小时</el-dropdown-item>
            <el-dropdown-item :command="{text:'2小时',m:120}">2小时</el-dropdown-item>
            <el-dropdown-item :command="{text:'10分钟',m:10}">10分钟</el-dropdown-item>
            <el-dropdown-item :command="{text:'20分钟',m:20}">20分钟</el-dropdown-item>
            <el-dropdown-item :command="{text:'30分钟',m:30}">30分钟</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <div v-if="countdownMode" class="countdown-section">
        <Countdown
            :endTime="countdownTime"
            @endFun="$emit('countdown-end')"
            class="countdown-display"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'StudyTimer',
  components: {
    Countdown: () => import('@/page/word/Countdown')
  },
  props: {
    countdownMode: {
      type: Boolean,
      default: false
    },
    countdownTime: {
      type: Number,
      required: true
    },
    countdownText: {
      type: String,
      default: '1小时'
    }
  },
  methods: {
    handleCommand(command) {
      this.$emit('countdown-select', command)
    }
  }
}
</script>

<style scoped>
.study-timer-container {
  margin-bottom: 20px;
  z-index: 1;
}

.timer-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.timer-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.timer-dropdown {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  transition: all 0.3s ease;
}

.timer-dropdown:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.timer-icon {
  margin-right: 8px;
  font-size: 14px;
}

.countdown-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.countdown-display {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .timer-card {
    border-radius: 8px;
  }

  .timer-dropdown {
    font-size: 12px;
  }

  .timer-icon {
    font-size: 12px;
    margin-right: 4px;
  }
}

/* Element UI overrides for better styling */
.timer-card :deep(.el-card__body) {
  padding: 16px;
}

.timer-dropdown :deep(.el-button) {
  color: white !important;
  background: transparent !important;
  border: none !important;
}

.timer-dropdown :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

.timer-dropdown :deep(.el-button:focus) {
  background: rgba(255, 255, 255, 0.1) !important;
}
</style>