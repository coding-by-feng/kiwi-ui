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
          <el-button slot="append" icon="el-icon-search" @click="onSubmit()"></el-button>
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
  data () {
    return {
      word: this.$route.query.word ? this.$route.query.word : '',
      searchInputWidth: document.body.clientWidth / 1.5 + 'px',
      lazy: this.$route.query.lazy === 'y'
    }
  },
  mounted () {},
  watch: {
    $route: function () {
      this.word = this.$route.query.word
      this.lazy = this.$route.query.lazy
    }
  },
  methods: {
    ...wordSearch,
    querySearch (queryString, callback) {
      // var results = fuzzyQueryWord(queryString);
      this.fuzzyQueryWord(queryString, 1, 20).then(response => {
        callback(response.data.data)
      }).catch(e => {
        console.error(e)
      })
      // var results = queryString ? restaurants.filter(this.createFilter(queryString)) : restaurants;
      // 调用 callback 返回建议列表的数据
      // cb(results);
    },
    querySelect (item) {
      this.$router.push({ path: '/index/vocabulary/detail', query: { active: 'search', word: item.value } })
    },
    onSubmit () {
      this.$refs.auto.close()
      this.$router.push({ path: '/index/vocabulary/detail', query: { active: 'search', word: this.word } })
    },
    handleOpen (key, keyPath) {
      // console.log(key, keyPath)
    },
    handleClose (key, keyPath) {
      // console.log(key, keyPath)
    },
    closeLazy () {
      let queryTmp = {}
      if (this.word) {
        queryTmp = { word: this.word }
      }
      let query = {
        active: 'search',
        ...queryTmp
      }
      this.$router.push({ path: '/index/vocabulary/detail', query: query })
    }
  }
}
</script>

<style scoped>
</style>