<script>
import db, {cleanDb} from "@/util/db";
import kiwiConst from "@/const/kiwiConsts";
import {getStore} from "@/util/store";
import it from "element-ui/src/locale/lang/it";
import msgUtil from '@/util/msg'

let that

export default {
  name: 'bgmPage',
  computed: {
    it() {
      return it
    }
  },
  data() {
    return {
      loading: false,
      allDataSize: 0,
      bgmData: [
        {id: 1, name: 'opus'},
        {id: 4010190, name: 'Death'},
      ],
      currentPlayBgmIndex: null,
      currentPlayBgm: null,
      bgm: getStore({name: 'bgm'})
    }
  },
  beforeCreate: function () {
    that = this
  },
  mounted() {
    this.currentPlayBgm = new Audio()
    this.currentPlayBgm.volume = 0.6
    this.currentPlayBgm.loop = false
    this.currentPlayBgm.addEventListener('ended', async function () {
      that.nextBgm()
    })
    if (this.bgm) {
      this.playBgm(0)
    }
    this.countDbAudio()
  },
  methods: {
    countDbAudio() {
      db.openDB(kiwiConst.DB_NAME, kiwiConst.DB_VERSION).then(dbObject => {
        db.cursorGetData(dbObject, kiwiConst.DB_STORE_NAME)
            .then(allDataSize => {
              that.allDataSize = allDataSize
            })
      })
    },
    cleanDb() {
      this.loading = true
      db.cleanDbData(kiwiConst.DB_NAME, kiwiConst.DB_VERSION, kiwiConst.DB_STORE_NAME)
          .then(() => {
            that.countDbAudio()
            that.loading = false
          })
          .catch($ => {
            that.loading = false
            msgUtil.msgError(that, 'handling error, please refresh and try again')
          })
    },
    playBgm(index) {
      console.log('playBgm accepted')
      console.log('this.currentPlayBgm.paused', this.currentPlayBgm.paused)
      if (this.currentPlayBgm.paused) {
        this.currentPlayBgm.src = `bgm/${this.bgmData[index].id}.mp3`
        this.currentPlayBgm.play()
        this.currentPlayBgmIndex = index
      }
    },
    playAudioData(index) {
      if (this.currentPlayBgmIndex === index) {
        this.currentPlayBgm.pause()
        this.currentPlayBgmIndex = null
        return
      }
      this.playBgm(index)
    },
    nextBgm() {
      ++this.currentPlayBgmIndex
      if (this.currentPlayBgmIndex >= this.bgmData.length) {
        this.currentPlayBgmIndex = 0
      }
      this.playBgm(this.currentPlayBgmIndex)
    }
  }
}
</script>

<style>
.box-card {
  width: 100%;
}
</style>

<template>
  <div>
    <el-card class="box-card" v-loading="loading">
      <el-button type="info" @click="cleanDb">
        Clean all data, totally {{ allDataSize }}
      </el-button>
      <el-divider></el-divider>
      <div v-for="(item, index) in bgmData" :key="index">
        <el-tag style="margin-bottom: 10px;" type="info" @click="playAudioData(index)">{{ item.name }}
          <i class="el-icon-loading" v-if="currentPlayBgmIndex===index"/>
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

