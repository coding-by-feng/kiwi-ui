<template>
  <div>
    <h1>{{ getTitle }}</h1>
    <div v-html="parsedResponseText" style="text-align: justify; margin-bottom: 40px;" v-loading="apiLoading"></div>
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
      defaultSelectedLanguage: getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) ? getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) : kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
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
  }
}
</script>