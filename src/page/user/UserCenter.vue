<script>
import website from '@/const/website'
import { getStore, setStore } from '@/util/store'

export default {
  name: 'userCenter',
  data () {
    return {
      user: {
        userName: getStore({ name: 'user_name' }),
        pronunciationSource: getStore({ name: 'pronunciation_source' }),
        reviewType: getStore({ name: 'review_type' }),
        spellType: getStore({ name: 'spell_type' }),
        enParaType: getStore({ name: 'enPara_type' }),
        bgm: getStore({ name: 'bgm' })
      }
    }
  },
  mounted () {
    if (!this.user.pronunciationSource) {
      setStore({
        name: 'pronunciation_source',
        content: '本地',
        type: 'local'
      })
    }
    if (!this.user.bgm) {
      setStore({
        name: 'bgm',
        content: null,
        type: 'local'
      })
    }
    if (!this.user.reviewType) {
      setStore({
        name: 'review_type',
        content: '1',
        type: 'local'
      })
    }
    if (!this.user.spellType) {
      setStore({
        name: 'spell_type',
        content: '2',
        type: 'local'
      })
    }
  },
  methods: {
    handleLoginOut () {
      this.$store.dispatch('LogOut').then(() => {
        this.$router.push({ path: website.noAuthPath.detail, query: { active: 'search' } })
        window.location.reload()
      }).catch(e => {
        console.error(e)
      })
    },
    pronunciationSourceChange (command) {
      setStore({
        name: 'pronunciation_source',
        content: command,
        type: 'local'
      })
      this.user.pronunciationSource = command
      window.location.reload()
    },
    reviewTypeChange (command) {
      setStore({
        name: 'review_type',
        content: command,
        type: 'local'
      })
      this.user.reviewType = command
      window.location.reload()
    },
    spellTypeChange (command) {
      setStore({
        name: 'spell_type',
        content: command,
        type: 'local'
      })
      this.user.spellType = command
      window.location.reload()
    },
    bgmChange (command) {
      setStore({
        name: 'bgm',
        content: command,
        type: 'local'
      })
      this.user.bgm = command
      window.location.reload()
    },
    enParaTypeChange (command) {
      setStore({
        name: 'enPara_type',
        content: command,
        type: 'local'
      })
      this.user.enParaType = command
      window.location.reload()
    },
    tranReviewType (val) {
      if (undefined === val) {
        setStore({
          name: 'review_type',
          content: '2',
          type: 'local'
        })
      }
      if (val === '1') {
        return '去除中文导播'
      } else if (val === '2') {
        return '附带中文导播'
      }
      return '默认'
    },
    tranEnParaType (val) {
      if (undefined === val) {
        setStore({
          name: 'enPara_type',
          content: '2',
          type: 'local'
        })
      }
      if (val === '1') {
        return '去除英文释义'
      } else if (val === '2') {
        return '附带英文释义'
      }
      return '默认'
    },
    tranSpellType (val) {
      if (undefined === val) {
        setStore({
          name: 'review_type',
          content: '2',
          type: 'local'
        })
      }
      if (val === '1') {
        return '去除单词拼写'
      } else if (val === '2') {
        return '附带单词拼写'
      }
      return '默认'
    },
    tranBGM (val) {
      if (undefined === val) {
        setStore({
          name: 'bgm',
          content: '1',
          type: 'local'
        })
      }
      if (val === '1') {
        return '【白噪音】雨声/小溪/炉火/猫咪'
      } else if (val === '2') {
        return '【白噪音】篝火'
      } else if (val === '3') {
        return '致抑郁轻音乐（慎点）'
      } else if (val === '4') {
        return '粤语老歌'
      } else if (val === null) {
        return '关闭'
      }
      return '默认'
    }
  }
}
</script>

<style>
</style>

<template>
  <div>
    <p>
      {{ user.userName }}
      <el-divider direction="vertical"></el-divider>
      <el-button type="info" size="mini" @click="handleLoginOut">
        <i class="el-icon-switch-button"></i>
      </el-button>
    </p>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="pronunciationSourceChange">
      {{ '发音来源：' + (user.pronunciationSource ? user.pronunciationSource : '默认') }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="Cambridge">Cambridge</el-dropdown-item>
        <el-dropdown-item command="本地">本地</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="bgmChange">
      {{ `背景音乐：${tranBGM(user.bgm)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="'1'">【白噪音】雨声/小溪/炉火/猫咪</el-dropdown-item>
        <el-dropdown-item :command="'2'">【白噪音】篝火</el-dropdown-item>
        <el-dropdown-item :command="'3'"> 致抑郁轻音乐（慎点）</el-dropdown-item>
        <el-dropdown-item :command="'4'"> 粤语老歌</el-dropdown-item>
        <el-dropdown-item :command="null"> 关闭背景音乐</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="reviewTypeChange">
      {{ `复习模式（导播）：${tranReviewType(user.reviewType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="'1'">去除中文导播</el-dropdown-item>
        <el-dropdown-item :command="'2'">附带中文导播</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="spellTypeChange">
      {{ `复习模式（字母拼写播报）：${tranSpellType(user.spellType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="'1'">去除单词拼写</el-dropdown-item>
        <el-dropdown-item :command="'2'">附带单词拼写</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="enParaTypeChange">
      {{ `复习模式（英文释义播报）：${tranEnParaType(user.enParaType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="'1'">去除英文释义</el-dropdown-item>
        <el-dropdown-item :command="'2'">附带英文释义</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

