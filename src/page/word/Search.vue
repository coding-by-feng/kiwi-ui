<template>
  <div>
    <el-row type="flex" justify="center">
      <el-col>
        <el-autocomplete
            ref="auto"
            :type="getInputType"
            v-model="originalText"
            :style="{width: searchInputWidth}"
            :fetch-suggestions="disableSuggestions ? noSuggestions : querySearch"
            placeholder="input anything"
            size="mini"
            :trigger-on-focus="false"
            @keyup.enter.native="onSubmit"
            :clearable="true"
            :autosize="true"
            :autocomplete="VocabularyModeOnOrOff"
            @select="querySelect">
          <el-button slot="prepend"
                     size="mini"
                     v-if="lazy"
                     icon="el-icon-switch-button"
                     @click="closeLazy"></el-button>
          <!-- Use predefined width for each label -->
          <el-select v-if="!lazy" v-model="selectedMode" slot="prepend"
                     size="mini"
                     :style="selectWidthStyle"
                     @change="selectedModeChange">
            <el-option
                v-for="item in searchModes"
                :key="item.value"
                :label="item.label"
                :value="item.value">
            </el-option>
          </el-select>
          <el-button slot="append" size="mini" icon="el-icon-search"
                     @click="onSubmit()"></el-button>
        </el-autocomplete>
      </el-col>
    </el-row>
    <el-row>
      <!-- Add el-select for language selection -->
      <el-select v-if="!ifVocabularyMode" v-model="selectedLanguage" size="mini" placeholder="Select Language"
                 :style="'margin-right: 10px;'" @change="selectedLanguageChange">
        <el-option
            v-for="(code, language) in languageCodes"
            :key="code"
            :label="language"
            :value="code">
        </el-option>
      </el-select>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-back" type="info" plain
                 size="mini" @click="onBack()"></el-button>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-search" type="info" plain
                 size="mini" @click="onSubmit()"></el-button>
    </el-row>
    <el-divider></el-divider>
    <el-row justify="center">
      <router-view :name="getRouterView"></router-view>
    </el-row>
  </div>
</template>

<script>
import wordSearch from '@/api/wordSearch'
import kiwiConsts from "@/const/kiwiConsts";
import util from '@/util/util'

const AI_MODES = [kiwiConsts.SEARCH_MODES.DIRECTLY_TRANSLATION.value, kiwiConsts.SEARCH_MODES.TRANSLATION_AND_EXPLANATION.value,
  kiwiConsts.SEARCH_MODES.GRAMMAR_EXPLANATION.value, kiwiConsts.SEARCH_MODES.GRAMMAR_CORRECTION.value, kiwiConsts.SEARCH_MODES.VOCABULARY_EXPLANATION.value]

export default {
  data() {
    return {
      originalText: this.$route.query.originalText ? decodeURI(this.$route.query.originalText) : '',
      searchInputWidth: document.body.clientWidth / 1.3 + 'px',
      lazy: this.$route.path.indexOf('lazy') > -1,
      selectedMode: kiwiConsts.SEARCH_DEFAULT_MODE, // Default value for el-select
      searchModes: Object.values(kiwiConsts.SEARCH_MODES_DATA),
      selectedLanguage: kiwiConsts.TRANSLATION_LANGUAGE_CODE.English,
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,
    }
  },
  computed: {
    getWindowWidth() {
      return window.innerWidth
    },
    // Compute the style object using predefined width
    selectWidthStyle() {
      const selectedOption = this.searchModes.find(mode => mode.value === this.selectedMode)
      const width = selectedOption ? selectedOption.width : '140px' // Fallback to default width
      return {width}
    },
    getRouterView() {
      console.log('getRouterView', this.$route.query.selectedMode)
      let previouslySelectedMode = this.$route?.query?.selectedMode;
      if (util.isEmptyStr(previouslySelectedMode) || previouslySelectedMode === kiwiConsts.SEARCH_DEFAULT_MODE) {
        return kiwiConsts.ROUTER_VIEW_DEFAULT_MODE
      } else {
        return kiwiConsts.ROUTER_VIEW_AI_MODE
      }
    },
    VocabularyModeOnOrOff() {
      if (util.isEmptyStr(this.$route.query.selectedMode) || this.$route.query.selectedMode === kiwiConsts.SEARCH_DEFAULT_MODE) {
        return kiwiConsts.TOGGLE.ON
      } else {
        console.log('the value of this.$route.query.selectedMode', this.$route.query.selectedMode)
        return kiwiConsts.TOGGLE.OFF
      }
    },
    ifVocabularyMode() {
      return util.isEmptyStr(this.$route.query.selectedMode) || this.$route.query.selectedMode === kiwiConsts.SEARCH_DEFAULT_MODE
    },
    getInputType() {
      if (util.isEmptyStr(this.$route.query.selectedMode) || this.$route.query.selectedMode === kiwiConsts.SEARCH_DEFAULT_MODE) {
        return kiwiConsts.INPUT_TYPE.TEXT
      } else {
        console.log('the value of this.$route.query.selectedMode', this.$route.query.selectedMode)
        return kiwiConsts.INPUT_TYPE.TEXTAREA
      }
    },
    disableSuggestions() {
      return !this.ifVocabularyMode; // Disable suggestions for translation modes
    }
  },
  mounted() {
    console.log('Search component mounted')
  },
  watch: {
    $route: function () {
      this.updateFromRoute()
    }
  },
  methods: {
    ...wordSearch,
    updateFromRoute() {
      console.log('this.$route', this.$route);
      this.originalText = this.$route.query.originalText ? decodeURI(this.$route.query.originalText) : this.originalText;
      this.lazy = this.$route.path.indexOf('lazy') > -1;
      this.selectedMode = this.$route.query.selectedMode || this.selectedMode;
      this.selectedLanguage = this.$route.query.language || this.selectedLanguage;
    },
    querySearch(queryString, callback) {
      let real = queryString.trimLeft()
      if (real === '' || /.*[\u4e00-\u9fa5]+.*$/.test(real)) {
        callback([{value: '请按回车或搜索按钮'}])
        return
      }
      // var results = fuzzyQueryWord(queryString);
      this.fuzzyQueryWord(real.toLowerCase(), 1, 50).then(response => {
        callback(response.data.data)
      }).catch(e => {
        console.error(e)
      })
    },
    querySelect(item) {
      let real = item.value.trimLeft()
      if (real === '') {
        return
      }
      this.$router.push({
        path: this.$route.path,
        query: {active: 'search', originalText: encodeURI(real.toLowerCase()), now: new Date().getTime()}
      })
    },
    selectedModeChange(item) {
      console.log('selectedModeChange', item)
      this.$router.push({
        path: this.$route.path,
        query: {
          active: 'search',
          selectedMode: item,
          originalText: this.originalText,
          now: new Date().getTime()
        }
      })
    },
    selectedLanguageChange(item) {
      console.log('selectedLanguageChange', item)
      this.$router.push({
        path: this.$route.path,
        query: {
          active: 'search',
          selectedMode: this.selectedMode,
          language: item,
          originalText: this.originalText,
          now: new Date().getTime()
        }
      })
    },
    onBack() {
      this.selectedMode = kiwiConsts.SEARCH_DEFAULT_MODE
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_DEFAULT_MODE,
          originalText: '',
          now: new Date().getTime()
        }
      })
    },
    onSubmit() {
      let real = this.originalText.trim()
      if (util.isEmptyStr(real)) {
        return
      }
      this.$refs.auto.close()

      if (AI_MODES.includes(this.selectedMode)) {
        this.$router.push({
          path: '/index/vocabulary/aiResponseDetail',
          query: {
            active: 'search',
            selectedMode: this.selectedMode,
            language: this.selectedLanguage,
            originalText: encodeURI(real.toLowerCase()),
            now: new Date().getTime()
          }
        })
      } else {
        this.$router.push({
          path: '/index/vocabulary/detail',
          query: {active: 'search', originalText: encodeURI(real.toLowerCase()), now: new Date().getTime()}
        })
      }
    },
    handleOpen(key, keyPath) {
      // console.log(key, keyPath)
    },
    handleClose(key, keyPath) {
      // console.log(key, keyPath)
    },
    brush() {
      this.originalText = ''
      this.$refs.auto.focus()
    },
    closeLazy() {
      let queryTmp = {}
      if (this.originalText) {
        queryTmp = {originalText: this.originalText}
      }
      let query = {
        active: 'search',
        ...queryTmp
      }
      this.$router.push({path: '/index/vocabulary/detail', query: query})
    },
    noSuggestions(queryString, callback) {
      callback([]) // Return an empty array to disable suggestions
    },
  }
}
</script>

<style scoped>
</style>