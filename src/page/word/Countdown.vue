<template>
  <span style="color: #333333">{{ this.time }}</span>
</template>

<script>
export default {
  name: 'Countdown',
  props: {
    endTime: {
      type: [Number, String],
      default: null
    },
    endFun: Function,
    onlySec: {
      type: [Boolean],
      default: false
    }
  },
  data () {
    return {
      time: '',
      flag: false,
      isTimeout: false,
      countdownFun: null
    }
  },
  mounted () {
    this.init()
  },
  destroyed () {
    clearInterval(this.countdownFun)
  },
  methods: {
    init () {
      if (!this.endTime) {
        this.time = '0天0小时0分0秒'
        return
      }
      this.countdownFun = setInterval(() => {
        if (this.flag) {
          clearInterval(this.countdownFun)
        }
        this.timeDown()
      }, 200)
    },
    timeDown () {
      const end = new Date(this.endTime)
      const now = new Date()
      let leftTime = parseInt((end.getTime() - now.getTime()) / 1000)
      if (leftTime <= 0) {
        this.flag = true
        this.time = '倒计时已关闭'
        this.isTimeout = true
        this.$emit('endFun')
        this.$destroy()
      } else {
        if (!this.onlySec) {
          let d = parseInt(leftTime / (24 * 60 * 60))
          let h = parseInt(leftTime / (60 * 60) % 24)
          let m = parseInt(leftTime / 60 % 60)
          let s = parseInt(leftTime % 60)
          // let h = this.format(parseInt(leftTime / (60 * 60) % 24))
          // let m = this.format(parseInt(leftTime / 60 % 60))
          // let s = this.format(parseInt(leftTime % 60))
          this.time = `${d}天${h}小时${m}分${s}秒`
        } else {
          let s = parseInt(leftTime % 60)
          this.time = `${s}秒`
        }
      }
    },
    format (time) {
      if (time >= 10) {
        return time
      }
      return 0
    }
  }
}
</script>

