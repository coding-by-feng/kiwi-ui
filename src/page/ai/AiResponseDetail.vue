<template>
  <div>
    <h1>{{ getTitle }}</h1>
    <div class="response-container">
      <div v-html="parsedResponseText" style="text-align: justify; margin-bottom: 40px;" v-loading="apiLoading"></div>
      <el-button
          v-if="parsedResponseText"
          class="copy-button"
          type="info"
          size="small"
          icon="el-icon-document-copy"
          @click="copyResponseText">
        Copy
      </el-button>
    </div>
  </div>
</template>

<script>
import {callAiChatCompletion} from '@/api/ai'
import util from '@/util/util'
import kiwiConsts from "@/const/kiwiConsts";
import MarkdownIt from 'markdown-it';
import {getStore} from '@/util/store'

const md = new MarkdownIt();

export default {
  data() {
    return {
      aiResponseVO: {},
      selectedMode: this.$route.query.selectedMode,
      apiLoading: false,
      copySuccess: false
    }
  },
  async mounted() {
    console.log('DirectlyTranslation component mounted')
    this.init();
  },
  watch: {
    '$route'() {
      console.log('DirectlyTranslation component watch')
      this.init()
    }
  },
  computed: {
    getTitle() {
      const mode = Object.values(kiwiConsts.SEARCH_MODES).find(mode => mode.value === this.selectedMode);
      return mode ? mode.label : value; // Fallback to the value if not found
    },
    parsedResponseText() {
      if (this.aiResponseVO.responseText) {
        return md.render(this.aiResponseVO.responseText);
      }
      return '';
    },
    rawResponseText() {
      return this.aiResponseVO.responseText || '';
    },
    defaultSelectedLanguage() {
      if (this.$route.query.language) {
        return this.$route.query.language
      }
      return getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) ? getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) : kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
    }
  },
  methods: {
    async init() {
      let originalText = this.$route.query.originalText;
      let language = this.$route.query.language ? this.$route.query.language : this.defaultSelectedLanguage;
      let urlPrefix = this.$route.query.selectedMode
      console.log('original text: ' + originalText + ' language: ' + language)
      if (!util.isEmptyStr(originalText) && !util.isEmptyStr(language)) {
        this.apiLoading = true;
        callAiChatCompletion(urlPrefix, language, encodeURIComponent(originalText))
            .then(response => {
              console.log('ai response', response)
              this.aiResponseVO = response.data.data
              this.apiLoading = false;
            })
      }
    },
    copyResponseText() {
      // We want to copy the raw text, not the HTML-rendered version
      const textToCopy = this.rawResponseText;

      navigator.clipboard.writeText(textToCopy)
          .then(() => {
            this.$message({
              message: 'Text copied to clipboard!',
              type: 'success',
              duration: 2000
            });
          })
          .catch(err => {
            this.$message({
              message: 'Failed to copy text: ' + err,
              type: 'error',
              duration: 2000
            });
          });
    }
  }
}
</script>

<style scoped>
.response-container {
  position: relative;
}

.copy-button {
  position: absolute;
  top: 0;
  right: 0;
}
</style>