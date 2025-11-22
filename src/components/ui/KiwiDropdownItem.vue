<template>
  <li class="kiwi-dropdown-item" :class="{ 'is-disabled': disabled, 'is-divided': divided }" @click="handleClick">
    <slot></slot>
  </li>
</template>

<script>
export default {
  name: 'KiwiDropdownItem',
  inject: ['dropdown'],
  props: {
    command: {},
    disabled: Boolean,
    divided: Boolean
  },
  methods: {
    handleClick() {
      if (this.disabled) return
      this.dropdown.handleItemClick(this.command)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-dropdown-item {
  list-style: none;
  line-height: 36px;
  padding: 0 20px;
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
  cursor: pointer;
  outline: none;
  white-space: nowrap;

  &:hover {
    background-color: var(--bg-body);
    color: var(--color-primary);
  }

  &.is-disabled {
    cursor: default;
    color: #bbb;
    pointer-events: none;
  }

  &.is-divided {
    margin-top: 6px;
    border-top: 1px solid var(--divider-color);
  }
}
</style>
