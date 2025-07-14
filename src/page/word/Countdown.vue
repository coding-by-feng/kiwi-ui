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
  data() {
    return {
      time: '',
      flag: false,
      isTimeout: false,
      countdownFun: null
    }
  },
  mounted() {
    this.init()
  },
  destroyed() {
    clearInterval(this.countdownFun)
  },
  methods: {
    init() {
      if (!this.endTime) {
        this.time = `0${this.$t('time.days')}0${this.$t('time.hours')}0${this.$t('time.minutes')}0${this.$t('time.seconds')}`
        return
      }
      this.countdownFun = setInterval(() => {
        if (this.flag) {
          clearInterval(this.countdownFun)
        }
        this.timeDown()
      }, 200)
    },
    timeDown() {
      const end = new Date(this.endTime)
      const now = new Date()
      let leftTime = parseInt((end.getTime() - now.getTime()) / 1000)
      if (leftTime <= 0) {
        this.flag = true
        this.time = this.$t('review.countdownClosed')
        this.isTimeout = true
        this.$emit('endFun')
        this.$destroy()
      } else {
        if (!this.onlySec) {
          let d = parseInt(leftTime / (24 * 60 * 60))
          let h = parseInt(leftTime / (60 * 60) % 24)
          let m = parseInt(leftTime / 60 % 60)
          let s = parseInt(leftTime % 60)
          this.time = `${d}${this.$t('time.days')}${h}${this.$t('time.hours')}${m}${this.$t('time.minutes')}${s}${this.$t('time.seconds')}`
        } else {
          let s = parseInt(leftTime % 60)
          this.time = `${s}${this.$t('time.seconds')}`
        }
      }
    },
    format(time) {
      if (time >= 10) {
        return time
      }
      return 0
    }
  }
}
</script>