<template>
  <div class="kiwi-collapse" role="tablist" aria-multiselectable="true">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'KiwiCollapse',
  props: {
    accordion: Boolean,
    value: {
      type: [String, Number, Array],
      default: () => []
    }
  },
  data() {
    return {
      activeNames: [].concat(this.value)
    }
  },
  watch: {
    value(val) {
      this.activeNames = [].concat(val)
    }
  },
  methods: {
    setActiveNames(activeNames) {
      activeNames = [].concat(activeNames)
      let value = this.accordion ? activeNames[0] : activeNames
      this.activeNames = activeNames
      this.$emit('input', value)
      this.$emit('change', value)
    },
    handleItemClick(item) {
      if (this.accordion) {
        this.setActiveNames(
          (this.activeNames[0] || this.activeNames[0] === 0) &&
          this.activeNames[0] === item.name
            ? '' : item.name
        )
      } else {
        let activeNames = this.activeNames.slice(0)
        const index = activeNames.indexOf(item.name)

        if (index > -1) {
          activeNames.splice(index, 1)
        } else {
          activeNames.push(item.name)
        }
        this.setActiveNames(activeNames)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-collapse {
  border-top: 1px solid var(--border-color-light);
  border-bottom: 1px solid var(--border-color-light);
}
</style>
