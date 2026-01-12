<template>
  <div
    v-show="active"
    class="kiwi-tab-pane"
    role="tabpanel"
    :aria-hidden="!active"
    :id="`pane-${name}`"
    :aria-labelledby="`tab-${name}`"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'KiwiTabPane',
  props: {
    label: String,
    name: String,
    disabled: Boolean
  },
  computed: {
    active() {
      return this.$parent.value === this.name
    }
  },
  mounted() {
    this.$parent.addPane(this)
  },
  destroyed() {
    this.$parent.removePane(this)
  }
}
</script>
