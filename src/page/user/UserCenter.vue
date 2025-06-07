<script>
import website from '@/const/website'
import {getStore, setStore} from '@/util/store'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'
import util from '@/util/util'

const USER_NAME = 'user_name';

export default {
  name: 'userCenter',
  data() {
    return {
      user: {
        userName: getStore({name: USER_NAME}),
        pronunciationSource: getStore({name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE}),

        /**
         * 导播模式，是否附带中文导播
         * 1：去除中文导播
         * 2：附带中文导播
         */
        reviewType: getStore({name: kiwiConst.CONFIG_KEY.REVIEW_TYPE}),
        spellType: getStore({name: kiwiConst.CONFIG_KEY.SPELL_TYPE}),
        /**
         * 是否播报英文释义
         * 1：去除英文释义
         * 2：附带英文释义
         */
        enParaType: getStore({name: kiwiConst.CONFIG_KEY.EN_PARA_TYPE}),
        enableMsgHint: getStore({name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT}),
        /**
         * 是否播报例句
         * 1：去除英文释义
         * 2：附带英文释义
         */
        isPlayExample: getStore({name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE}),
        isEnToEn: getStore({name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN}),
        bgm: getStore({name: kiwiConst.CONFIG_KEY.BGM}),
        nativeLang: getStore({name: kiwiConst.CONFIG_KEY.NATIVE_LANG}), // Add native language
        keepInMindCount: 0,
        rememberCount: 0,
        reviewCount: 0,
      },
      // Add language codes for native language selection
      languageCodes: kiwiConst.TRANSLATION_LANGUAGE_CODE,
    }
  },
  mounted() {
    if (util.isEmptyStr(this.user.pronunciationSource)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE,
        content: kiwiConst.PRONUNCIATION_SOURCE.LOCAL,
        type: 'local'
      })
    }
    if (util.isEmptyStr(this.user.bgm)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.BGM,
        content: kiwiConst.ENABLE_BGM.ENABLE,
        type: 'local'
      })
    }
    if (util.isEmptyStr(this.user.reviewType)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.REVIEW_TYPE,
        content: kiwiConst.REVIEW_TYPE.ONLY_ENGLISH,
        type: 'local'
      })
    }
    if (util.isEmptyStr(this.user.spellType)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.SPELL_TYPE,
        content: kiwiConst.SPELL_TYPE.ENABLE,
        type: 'local'
      })
    }
    if (util.isEmptyStr(this.user.isPlayExample)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE,
        content: kiwiConst.IS_PLAY_EXAMPLE.ENABLE,
        type: 'local'
      })
    }
    if (util.isEmptyStr(this.user.isEnToEn)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN,
        content: kiwiConst.IS_EN_TO_EN.ENABLE,
        type: 'local'
      })
    }
    // Initialize native language with default value
    if (util.isEmptyStr(this.user.nativeLang)) {
      setStore({
        name: kiwiConst.CONFIG_KEY.NATIVE_LANG,
        content: kiwiConst.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
        type: 'local'
      })
      this.user.nativeLang = kiwiConst.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
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
        name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE,
        content: command,
        type: 'local'
      })
      this.user.pronunciationSource = command
    },
    reviewTypeChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.REVIEW_TYPE,
        content: command,
        type: 'local'
      })
      this.user.reviewType = command
    },
    spellTypeChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.SPELL_TYPE,
        content: command,
        type: 'local'
      })
      this.user.spellType = command
    },
    bgmChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.BGM,
        content: command,
        type: 'local'
      })
      this.user.bgm = command
      window.location.reload()
    },
    enParaTypeChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.EN_PARA_TYPE,
        content: command,
        type: 'local'
      })
      this.user.enParaType = command
    },
    enableMsgHintChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT,
        content: command,
        type: 'local'
      })
      this.user.enableMsgHint = command
    },
    isPlayExampleChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE,
        content: command,
        type: 'local'
      })
      this.user.isPlayExample = command
    },
    isEnToEnChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN,
        content: command,
        type: 'local'
      })
      this.user.isEnToEn = command
    },
    // Add native language change handler
    nativeLangChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.NATIVE_LANG,
        content: command,
        type: 'local'
      })
      this.user.nativeLang = command
    },
    tranReviewType(val) {
      if (undefined === val) {
        setStore({
          name: kiwiConst.CONFIG_KEY.REVIEW_TYPE,
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
          name: kiwiConst.CONFIG_KEY.EN_PARA_TYPE,
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
    tranEnableMsgHint(val) {
      if (undefined === val) {
        setStore({
          name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT,
          content: kiwiConst.ENABLE_MSG_HINT.ENABLE,
          type: 'local'
        })
      }
      if (val === kiwiConst.ENABLE_MSG_HINT.DISABLE) {
        return '关闭'
      } else if (val === kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE) {
        return '开启'
      }
      return '默认'
    },
    tranIsPlayExample(val) {
      if (undefined === val) {
        setStore({
          name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE,
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
    tranIsEnToEn(val) {
      if (undefined === val) {
        setStore({
          name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN,
          content: kiwiConst.IS_EN_TO_EN.ENABLE,
          type: 'local'
        })
      }
      if (val === kiwiConst.IS_EN_TO_EN.ENABLE) {
        return '开启'
      } else if (val === kiwiConst.IS_EN_TO_EN.DISABLE) {
        return '关闭'
      }
      return '开启'
    },
    tranSpellType(val) {
      if (undefined === val) {
        setStore({
          name: kiwiConst.CONFIG_KEY.REVIEW_TYPE,
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
      if (undefined === val || null === val) {
        setStore({
          name: 'bgm',
          content: kiwiConst.ENABLE_BGM.DISABLE,
          type: 'local'
        })
      }
      if (val === kiwiConst.ENABLE_BGM.ENABLE) {
        return '开启'
      } else {
        return '关闭'
      }
    },
    // Add translation method for native language
    tranNativeLang(val) {
      if (util.isEmptyStr(val)) {
        return '默认语言'
      }
      // Find the language name from the code
      for (const [language, code] of Object.entries(this.languageCodes)) {
        if (code === val) {
          return language.replaceAll('_', ' ')
        }
      }
      return '未知语言'
    },
    refresh() {
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.KEEP_IN_MIND)
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.KEEP_IN_MIND)
          .then(response => {
            if (response.data.data) {
              this.user.keepInMindCount = response.data.data.reviewCount;
            }
          })
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REMEMBER)
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REMEMBER)
          .then(response => {
            if (response.data.data) {
              this.user.rememberCount = response.data.data.reviewCount;
            }
          })
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
          .then(response => {
            if (response.data.data) {
              this.user.reviewCount = response.data.data.reviewCount;
            }
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
    <!-- Add Native Language Dropdown -->
    <el-dropdown size="mini"
                 split-button type="info" @command="nativeLangChange">
      {{ `母语设置：${tranNativeLang(user.nativeLang)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
            v-for="(code, language) in languageCodes"
            :key="code"
            :command="code">
          {{ language.replaceAll('_', ' ') }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="bgmChange">
      {{ `背景音乐：${tranBGM(user.bgm)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="1">开启</el-dropdown-item>
        <el-dropdown-item :command="0">关闭</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="spellTypeChange">
      {{ `字母拼写播报：${tranSpellType(user.spellType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="0">去除单词拼写</el-dropdown-item>
        <el-dropdown-item :command="1">附带单词拼写</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="enParaTypeChange">
      {{ `英文释义播报：${tranEnParaType(user.enParaType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="0">去除英文释义</el-dropdown-item>
        <el-dropdown-item :command="1">附带英文释义</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="enableMsgHintChange">
      {{ `消息提醒：${tranEnableMsgHint(user.enableMsgHint)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="0">关闭</el-dropdown-item>
        <el-dropdown-item :command="1">开启</el-dropdown-item>
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
                 split-button type="info" @command="isEnToEnChange">
      {{ `是否英英模式：${tranIsEnToEn(user.isEnToEn)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="true">开启</el-dropdown-item>
        <el-dropdown-item :command="false">关闭</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>