<template>
  <div class="kiwi-tabs">
    <div class="kiwi-tabs__header">
      <div class="kiwi-tabs__nav-wrap">
        <div class="kiwi-tabs__nav-scroll">
          <div class="kiwi-tabs__nav">
            <div
              v-for="pane in panes"
              :key="pane.name"
              class="kiwi-tabs__item"
              :class="{
                'is-active': value === pane.name,
                'is-disabled': pane.disabled
              }"
              @click="handleTabClick(pane)"
            >
              {{ pane.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="kiwi-tabs__content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KiwiTabs',
  props: {
    value: String,
    type: String
  },
  data() {
    return {
      panes: []
    }
  },
  methods: {
    handleTabClick(pane) {
      if (pane.disabled) return
      this.$emit('input', pane.name)
      this.$emit('tab-click', pane)
    },
    addPane(pane) {
      this.panes.push(pane)
    },
    removePane(pane) {
      const index = this.panes.indexOf(pane)
      if (index > -1) {
        this.panes.splice(index, 1)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-tabs {
  &__header {
    margin: 0 0 15px;
    border-bottom: 1px solid var(--border-color-light);
  }

  &__nav-wrap {
    overflow: hidden;
    margin-bottom: -1px;
    position: relative;
  }

  &__nav-scroll {
    overflow: hidden;
  }

  &__nav {
    white-space: nowrap;
    position: relative;
    transition: transform .3s;
    float: left;
    z-index: 2;
  }

  &__item {
    padding: 0 20px;
    height: 40px;
    box-sizing: border-box;
    line-height: 40px;
    display: inline-block;
    list-style: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    position: relative;
    cursor: pointer;
    transition: color .3s cubic-bezier(.645,.045,.355,1);

    &:hover {
      color: var(--color-primary);
    }

    &.is-active {
      color: var(--color-primary);
      border-bottom: 2px solid var(--color-primary);
    }

    &.is-disabled {
      color: var(--text-placeholder);
      cursor: not-allowed;
    }
  }
}
</style>
