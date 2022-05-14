<template>
  <div>
    <el-row type="flex" justify="center" style="padding-top:25px;">
      <el-col>
        <el-autocomplete
            ref="auto"
            v-model="word"
            :style="{width: searchInputWidth}"
            :fetch-suggestions="querySearch"
            placeholder="输入单词"
            size="mini"
            :trigger-on-focus="false"
            @keyup.enter.native="onSubmit"
            @select="querySelect">
          <el-button slot="prepend"
                     size="mini"
                     v-if="lazy"
                     icon="el-icon-switch-button"
                     @click="closeLazy"></el-button>
          <el-button slot="prepend"
                     size="mini"
                     v-if="!lazy"
                     icon="el-icon-brush"
                     @click="brush"></el-button>
          <el-button v-if="getWindowWidth > 400" slot="append" icon="el-icon-search" @click="onSubmit()"></el-button>
        </el-autocomplete>
      </el-col>
    </el-row>
    <el-divider></el-divider>
    <el-row justify="center">
      <router-view name="detail"></router-view>
    </el-row>
  </div>
</template>

<script>
import wordSearch from '@/api/wordSearch'

export default {
  data() {
    return {
      word: this.$route.query.word ? decodeURI(this.$route.query.word) : '',
      searchInputWidth: document.body.clientWidth / 1.5 + 'px',
      lazy: this.$route.path.indexOf('lazy') > -1
    }
  },
  computed: {
    getWindowWidth() {
      return window.innerWidth
    }
  },
  mounted() {
  },
  watch: {
    $route: function () {
      this.word = this.$route.query.word ? decodeURI(this.$route.query.word) : ''
      this.lazy = this.$route.query.lazy
    }
  },
  methods: {
    ...wordSearch,
    querySearch(queryString, callback) {
      let real = queryString.trimLeft()
      if (real === '' || /.*[\u4e00-\u9fa5]+.*$/.test(real)) {
        callback([{value: '请按回车或搜索按钮'}])
        return
      }
      // var results = fuzzyQueryWord(queryString);
      this.fuzzyQueryWord(real, 1, 20).then(response => {
        callback(response.data.data)
      }).catch(e => {
        console.error(e)
      })
      // var results = queryString ? restaurants.filter(this.createFilter(queryString)) : restaurants;
      // 调用 callback 返回建议列表的数据
      // cb(results);
    },
    querySelect(item) {
      let real = item.value.trimLeft()
      if (real === '') {
        return
      }
      this.$router.push({
        path: this.$route.path,
        query: {active: 'search', word: encodeURI(real), now: new Date().getTime()}
      })
    },
    onSubmit() {
      let real = this.word.trimLeft()
      if (real === '') {
        return
      }
      this.$refs.auto.close()
      this.$router.push({
        path: this.$route.path,
        query: {active: 'search', word: encodeURI(real), now: new Date().getTime()}
      })
    },
    handleOpen(key, keyPath) {
      // console.log(key, keyPath)
    },
    handleClose(key, keyPath) {
      // console.log(key, keyPath)
    },
    brush() {
      this.word = ''
      this.$refs.auto.focus()
    },
    closeLazy() {
      let queryTmp = {}
      if (this.word) {
        queryTmp = {word: this.word}
      }
      let query = {
        active: 'search',
        ...queryTmp
      }
      this.$router.push({path: '/index/vocabulary/detail', query: query})
    }
  }
}
</script>

<style scoped>
</style>