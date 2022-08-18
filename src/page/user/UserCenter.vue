<script>
import website from '@/const/website'
import {getStore, setStore} from '@/util/store'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'

const TTS_API_KEY = 'tts_api_key';
const USER_NAME = 'user_name';

export default {
  name: 'userCenter',
  data() {
    return {
      user: {
        userName: getStore({name: USER_NAME}),
        pronunciationSource: getStore({name: 'pronunciation_source'}),

        /**
         * 导播模式，是否附带中文导播
         * 1：去除中文导播
         * 2：附带中文导播
         */
        reviewType: getStore({name: 'review_type'}),
        spellType: getStore({name: 'spell_type'}),
        /**
         * 是否播报英文释义
         * 1：去除英文释义
         * 2：附带英文释义
         */
        enParaType: getStore({name: 'enPara_type'}),
        /**
         * 是否播报例句
         * 1：去除英文释义
         * 2：附带英文释义
         */
        isPlayExample: getStore({name: 'is_play_example'}),
        ttsApiKey: getStore({name: 'tts_api_key'}),
        bgm: getStore({name: 'bgm'}),
        keepInMindCount: 0,
        rememberCount: 0,
        reviewCount: 0,
      },
      API_KEY_VOICE_RSS: kiwiConst.API_KEY_VOICE_RSS
    }
  },
  mounted() {
    if (!this.user.pronunciationSource) {
      setStore({
        name: 'pronunciation_source',
        content: kiwiConst.PRONUNCIATION_SOURCE.LOCAL,
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
        content: kiwiConst.REVIEW_TYPE.ONLY_ENGLISH,
        type: 'local'
      })
    }
    if (!this.user.spellType) {
      setStore({
        name: 'spell_type',
        content: kiwiConst.SPELL_TYPE.ENABLE,
        type: 'local'
      })
    }
    if (!this.user.isPlayExample) {
      setStore({
        name: 'is_play_example',
        content: kiwiConst.IS_PLAY_EXAMPLE.ENABLE,
        type: 'local'
      })
    }
    if (!this.user.ttsApiKey) {
      setStore({
        name: 'tts_api_key',
        content: kiwiConst.API_KEY_VOICE_RSS.KEY1,
        type: 'local'
      })
    }

    this.refresh();
  },
  watch: {
    $route: function () {
      let active = this.$route.query.active
      if (active === 'userCenter') {
        this.refresh()
      }
    }
  },
  methods: {
    handleLoginOut() {
      this.$store.dispatch('LogOut').then(() => {
        this.$router.push({path: website.noAuthPath.detail, query: {active: 'search'}})
        window.location.reload()
      }).catch(e => {
        console.error(e)
      })
    },
    pronunciationSourceChange(command) {
      setStore({
        name: 'pronunciation_source',
        content: command,
        type: 'local'
      })
      this.user.pronunciationSource = command
    },
    reviewTypeChange(command) {
      setStore({
        name: 'review_type',
        content: command,
        type: 'local'
      })
      this.user.reviewType = command
    },
    spellTypeChange(command) {
      setStore({
        name: 'spell_type',
        content: command,
        type: 'local'
      })
      this.user.spellType = command
    },
    bgmChange(command) {
      setStore({
        name: 'bgm',
        content: command,
        type: 'local'
      })
      this.user.bgm = command
      window.location.reload()
    },
    enParaTypeChange(command) {
      setStore({
        name: 'enPara_type',
        content: command,
        type: 'local'
      })
      this.user.enParaType = command
    },
    isPlayExampleChange(command) {
      setStore({
        name: 'is_play_example',
        content: command,
        type: 'local'
      })
      this.user.isPlayExample = command
    },
    ttsApiKeyChange(command) {
      setStore({
        name: TTS_API_KEY,
        content: command,
        type: 'local'
      })
      this.user.ttsApiKey = command
    },
    tranReviewType(val) {
      if (undefined === val) {
        setStore({
          name: 'review_type',
          content: kiwiConst.REVIEW_TYPE.WITH_CHINESE,
          type: 'local'
        })
      }
      if (val === kiwiConst.REVIEW_TYPE.ONLY_ENGLISH) {
        return '去除中文导播'
      } else if (val === kiwiConst.REVIEW_TYPE.WITH_CHINESE) {
        return '附带中文导播'
      }
      return '默认'
    },
    tranEnParaType(val) {
      if (undefined === val) {
        setStore({
          name: 'enPara_type',
          content: kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE,
          type: 'local'
        })
      }
      if (val === kiwiConst.ENGLISH_PARAPHRASE_TYPE.DISABLE) {
        return '去除英文释义'
      } else if (val === kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE) {
        return '附带英文释义'
      }
      return '附带英文释义'
    },
    tranIsPlayExample(val) {
      if (undefined === val) {
        setStore({
          name: 'is_play_example',
          content: kiwiConst.IS_PLAY_EXAMPLE.ENABLE,
          type: 'local'
        })
      }
      if (val === kiwiConst.IS_PLAY_EXAMPLE.ENABLE) {
        return '开启'
      } else if (val === kiwiConst.IS_PLAY_EXAMPLE.DISABLE) {
        return '关闭'
      }
      return '开启'
    },
    tranSpellType(val) {
      if (undefined === val) {
        setStore({
          name: 'review_type',
          content: kiwiConst.SPELL_TYPE.ENABLE,
          type: 'local'
        })
      }
      if (val === kiwiConst.SPELL_TYPE.DISABLE) {
        return '去除单词拼写'
      } else if (val === kiwiConst.SPELL_TYPE.ENABLE) {
        return '附带单词拼写'
      }
      return '附带单词拼写'
    },
    tranBGM(val) {
      if (undefined === val) {
        setStore({
          name: 'bgm',
          content: 1,
          type: 'local'
        })
      }
      if (val === 1) {
        return '【轻音乐】我的世界'
      } else if (val === 2) {
        return '【白噪音】篝火'
      } else if (val === 3) {
        return '【ASMR】颂钵疗愈'
      } else {
        return '关闭'
      }
    },
    refresh() {
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.KEEP_IN_MIND)
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.KEEP_IN_MIND)
          .then(response => {
            this.user.keepInMindCount = response.data.data.reviewCount
          })
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REMEMBER)
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REMEMBER)
          .then(response => {
            this.user.rememberCount = response.data.data.reviewCount
          })
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
          .then(response => {
            this.user.reviewCount = response.data.data.reviewCount
          })
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
        Logout
      </el-button>
    </p>
    <el-divider></el-divider>
    <span>今日已记住单词个数：</span>
    <el-tag type="info" size="mini">{{ user.rememberCount }}</el-tag>
    <br>
    <span>今日已复习单词次数：</span>
    <el-tag type="info" size="mini">{{ user.reviewCount }}</el-tag>
    <br>
    <span>今日已牢记单词个数：</span>
    <el-tag type="info" size="mini">{{ user.keepInMindCount }}</el-tag>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="pronunciationSourceChange">
      {{ '发音来源：' + (user.pronunciationSource ? user.pronunciationSource : '默认') }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="Cambridge">Cambridge</el-dropdown-item>
        <el-dropdown-item command="Local">Local</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="bgmChange">
      {{ `背景音乐：${tranBGM(user.bgm)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="1">【轻音乐】我的世界</el-dropdown-item>
        <el-dropdown-item :command="2">【白噪音】篝火</el-dropdown-item>
        <el-dropdown-item :command="3">【ASMR】颂钵疗愈</el-dropdown-item>
        <el-dropdown-item :command="null"> 关闭背景音乐</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="reviewTypeChange">
      {{ `导播：${tranReviewType(user.reviewType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="1">去除中文导播</el-dropdown-item>
        <el-dropdown-item :command="2">附带中文导播</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="spellTypeChange">
      {{ `字母拼写播报：${tranSpellType(user.spellType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="1">去除单词拼写</el-dropdown-item>
        <el-dropdown-item :command="2">附带单词拼写</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="enParaTypeChange">
      {{ `英文释义播报：${tranEnParaType(user.enParaType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="1">去除英文释义</el-dropdown-item>
        <el-dropdown-item :command="2">附带英文释义</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="isPlayExampleChange">
      {{ `是否播放例句：${tranIsPlayExample(user.isPlayExample)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="1">开启</el-dropdown-item>
        <el-dropdown-item :command="2">关闭</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="ttsApiKeyChange">
      {{ `TTS KEY：${user.ttsApiKey}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="'自动选择'">自动选择</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY1">{{API_KEY_VOICE_RSS.KEY1}}</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY2">{{API_KEY_VOICE_RSS.KEY2}}</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY3">{{API_KEY_VOICE_RSS.KEY3}}</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY4">{{API_KEY_VOICE_RSS.KEY4}}</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY5">{{API_KEY_VOICE_RSS.KEY5}}</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY6">{{API_KEY_VOICE_RSS.KEY6}}</el-dropdown-item>
        <el-dropdown-item :command="API_KEY_VOICE_RSS.KEY7">{{API_KEY_VOICE_RSS.KEY7}}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>


