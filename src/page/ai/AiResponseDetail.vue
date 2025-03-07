<template>
  <div>
    <h1>{{ getTitle }}</h1>
    <p>{{ aiResponseVO.originalText }}</p>
    <p>{{ aiResponseVO.responseText }}</p>
  </div>
</template>

<script>
import {callAiChatCompletion} from '@/api/ai'
import util from '@/util/util'
import kiwiConsts from "@/const/kiwiConsts";

export default {
  data() {
    return {
      aiResponseVO: {},
      selectedMode: this.$route.query.selectedMode
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
  },
  methods: {
    async init() {
      let originalText = this.$route.query.originalText;
      let language = this.$route.query.language
      let urlPrefix = this.$route.query.selectedMode
      console.log('original text: ' + originalText + ' language: ' + language)
      if (!util.isEmptyStr(originalText) && !util.isEmptyStr(language)) {
        const response = await callAiChatCompletion(urlPrefix, language, originalText)
        console.log('ai response', response)
        this.aiResponseVO = response.data.data
      }
    },
  }
}
</script>