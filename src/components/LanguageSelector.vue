<template>
  <el-dropdown
      @command="switchLanguage"
      trigger="click"
      :size="size"
      :class="dropdownClass">
    <el-button
        :size="size"
        :type="buttonType"
        :plain="plain"
        :circle="circle"
        class="language-switcher-btn">
      <i class="el-icon-s-home" v-if="showIcon"></i>
      <span v-if="showText">{{ getCurrentLanguageDisplay() }}</span>
      <i class="el-icon-arrow-down el-icon--right" v-if="showArrow"></i>
    </el-button>
    <el-dropdown-menu slot="dropdown" class="language-dropdown-menu">
      <el-dropdown-item
          v-for="lang in availableLanguages"
          :key="lang.code"
          :command="lang.code"
          :class="{ 'is-active': currentLanguage === lang.code }"
          class="language-option">
        <div class="language-option-content">
          <span class="language-native">{{ lang.name }}</span>
          <span class="language-english">{{ lang.englishName }}</span>
          <i class="el-icon-check" v-if="currentLanguage === lang.code"></i>
        </div>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import { getAvailableLanguages, setLanguage } from '@/i18n'

export default {
  name: 'LanguageSwitcher',
  props: {
    size: {
      type: String,
      default: 'small'
    },
    buttonType: {
      type: String,
      default: 'text'
    },
    plain: {
      type: Boolean,
      default: false
    },
    circle: {
      type: Boolean,
      default: false
    },
    showIcon: {
      type: Boolean,
      default: true
    },
    showText: {
      type: Boolean,
      default: true
    },
    showArrow: {
      type: Boolean,
      default: true
    },
    displayMode: {
      type: String,
      default: 'native', // 'native', 'english', 'code'
      validator: value => ['native', 'english', 'code'].includes(value)
    },
    dropdownClass: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      availableLanguages: getAvailableLanguages()
    }
  },
  computed: {
    currentLanguage() {
      return this.$i18n.locale
    }
  },
  methods: {
    switchLanguage(langCode) {
      if (langCode !== this.currentLanguage) {
        setLanguage(langCode)

        // Emit event for parent components
        this.$emit('language-changed', langCode)

        // Show success message
        this.$message({
          message: this.$t('messages.languageChanged'),
          type: 'success',
          duration: 2000
        })

        // Optionally reload the page to apply all changes
        // You might want to make this configurable
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    },
    getCurrentLanguageDisplay() {
      const currentLang = this.availableLanguages.find(lang => lang.code === this.currentLanguage)
      if (!currentLang) return 'Language'

      switch (this.displayMode) {
        case 'english':
          return currentLang.englishName
        case 'code':
          return currentLang.code.toUpperCase()
        default:
          return currentLang.name
      }
    }
  }
}
</script>

<style scoped>
.language-switcher-btn {
  min-width: auto;
}

.language-dropdown-menu {
  max-height: 300px;
  overflow-y: auto;
}

.language-option {
  padding: 0;
}

.language-option-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 16px;
  position: relative;
  min-height: 40px;
  justify-content: center;
}

.language-native {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
}

.language-english {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  margin-top: 2px;
}

.language-option.is-active .language-option-content {
  background-color: #ecf5ff;
  color: #409eff;
}

.language-option.is-active .language-english {
  color: #79bbff;
}

.language-option-content .el-icon-check {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #409eff;
  font-size: 16px;
}

.language-option:hover .language-option-content {
  background-color: #f5f7fa;
}

.language-option.is-active:hover .language-option-content {
  background-color: #d9ecff;
}

/* Compact mode for small spaces */
.language-switcher-btn.is-circle {
  width: 32px;
  height: 32px;
  padding: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .language-dropdown-menu {
    max-height: 250px;
  }

  .language-option-content {
    padding: 6px 12px;
    min-height: 36px;
  }

  .language-native {
    font-size: 13px;
  }

  .language-english {
    font-size: 11px;
  }
}
</style>