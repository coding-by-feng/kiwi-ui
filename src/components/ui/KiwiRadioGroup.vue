<template>
  <div class="kiwi-radio-group" role="radiogroup">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'KiwiRadioGroup',
  props: {
    value: {},
    size: String,
    fill: String,
    textColor: String,
    disabled: Boolean
  },
  watch: {
    value(value) {
      this.$emit('change', value)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-radio-group {
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
  font-size: 0;
}
</style>
