<template>
  <div class="kiwi-collapse-item" :class="{'is-active': isActive, 'is-disabled': disabled}">
    <div
      role="tab"
      :aria-expanded="isActive"
      :aria-controls="`kiwi-collapse-content-${id}`"
      :aria-describedby="`kiwi-collapse-content-${id}`"
    >
      <div
        class="kiwi-collapse-item__header"
        @click="handleHeaderClick"
        :class="{'is-active': isActive}"
        role="button"
        :tabindex="disabled ? undefined : 0"
        @keyup.space.enter.stop="handleHeaderClick"
      >
        <slot name="title">{{ title }}</slot>
        <i
          class="kiwi-collapse-item__arrow el-icon-arrow-right"
          :class="{'is-active': isActive}"
        >
        </i>
      </div>
    </div>
    <div
      class="kiwi-collapse-item__wrap"
      v-show="isActive"
      role="tabpanel"
      :aria-hidden="!isActive"
      :aria-labelledby="`kiwi-collapse-head-${id}`"
      :id="`kiwi-collapse-content-${id}`"
    >
      <div class="kiwi-collapse-item__content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KiwiCollapseItem',
  props: {
    title: String,
    name: {
      type: [String, Number],
      default() {
        return this._uid
      }
    },
    disabled: Boolean
  },
  data() {
    return {
      id: this._uid
    }
  },
  computed: {
    isActive() {
      return this.$parent.activeNames.indexOf(this.name) > -1
    }
  },
  methods: {
    handleHeaderClick() {
      if (this.disabled) return
      this.$parent.handleItemClick(this)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-collapse-item {
  &__header {
    display: flex;
    align-items: center;
    height: 48px;
    line-height: 48px;
    background-color: var(--bg-card);
    color: var(--text-primary);
    cursor: pointer;
    border-bottom: 1px solid var(--border-color-light);
    font-size: 13px;
    font-weight: 500;
    transition: border-bottom-color .3s;
    outline: none;
    padding-right: 8px;
    justify-content: space-between;

    &.is-active {
      border-bottom-color: transparent;
    }
  }

  &__arrow {
    margin: 0 8px 0 auto;
    transition: transform .3s;
    font-weight: 300;
    color: var(--text-secondary);

    &.is-active {
      transform: rotate(90deg);
    }
  }

  &__wrap {
    will-change: height;
    background-color: var(--bg-card);
    overflow: hidden;
    box-sizing: border-box;
    border-bottom: 1px solid var(--border-color-light);
  }

  &__content {
    padding-bottom: 25px;
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.769230769230769;
  }

  &:last-child {
    margin-bottom: -1px;
  }
}
</style>
