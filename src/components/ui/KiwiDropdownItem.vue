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
  line-height: 1.4;
  padding: 10px 14px;
  margin: 2px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);

    // Icon glow on hover
    i {
      text-shadow: 0 0 8px var(--color-primary);
    }
  }

  &:active {
    background: rgba(var(--color-primary-rgb), 0.15);
    transform: scale(0.98);
  }

  &.is-disabled {
    cursor: not-allowed;
    color: var(--text-muted);
    opacity: 0.5;
    pointer-events: none;
  }

  &.is-divided {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color-light);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  // Icon styling
  i {
    font-size: 16px;
    transition: var(--transition-fast);
  }
}
</style>
