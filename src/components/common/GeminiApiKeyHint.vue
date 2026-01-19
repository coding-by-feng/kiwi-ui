<template>
  <KiwiDialog
    :visible.sync="dialogVisible"
    :title="$t('user.geminiApiKeyRequired')"
    width="420px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
  >
    <div class="hint-content">
      <div class="hint-icon">
        <i class="el-icon-warning-outline"></i>
      </div>
      <p class="hint-message">{{ $t('user.geminiApiKeyRequiredMessage') }}</p>
    </div>

    <div slot="footer" class="dialog-footer">
      <KiwiButton
        type="primary"
        icon="el-icon-setting"
        @click="goToSettings"
      >
        {{ $t('user.configureApiKey') }}
      </KiwiButton>
      <KiwiButton
        type="info"
        plain
        icon="el-icon-refresh"
        @click="switchToBackend"
      >
        {{ $t('user.switchToBackend') }}
      </KiwiButton>
    </div>
  </KiwiDialog>
</template>

<script>
import KiwiDialog from '@/components/ui/KiwiDialog.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import { setAiProvider } from '@/util/geminiClient'
import kiwiConsts from '@/const/kiwiConsts'

export default {
  name: 'GeminiApiKeyHint',
  components: { KiwiDialog, KiwiButton },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  methods: {
    goToSettings() {
      this.dialogVisible = false
      // Navigate to user settings page
      this.$router.push({
        path: kiwiConsts.ROUTES.DETAIL,
        query: { active: 'user' }
      }).catch(() => {})
      this.$emit('go-to-settings')
    },
    switchToBackend() {
      // Switch to backend API mode
      setAiProvider(kiwiConsts.AI_PROVIDER.BACKEND_SSE)
      this.dialogVisible = false
      this.$emit('switched-to-backend')
    }
  }
}
</script>

<style lang="scss" scoped>
.hint-content {
  text-align: center;
  padding: 20px 10px;
}

.hint-icon {
  font-size: 48px;
  color: var(--color-warning, #e6a23c);
  margin-bottom: 16px;
}

.hint-message {
  font-size: 15px;
  color: var(--text-primary, #303133);
  line-height: 1.6;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .dialog-footer {
    flex-direction: column;
  }

  .dialog-footer .kiwi-button {
    width: 100%;
  }
}
</style>
