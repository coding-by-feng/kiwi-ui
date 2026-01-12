<template>
  <li class="kiwi-dropdown-item" :class="itemClasses" @click="handleClick" :title="title">
    <i v-if="icon" :class="icon" class="item-icon"></i>
    <span class="item-content">
      <slot></slot>
    </span>
    <i v-if="selected" class="el-icon-check item-check"></i>
  </li>
</template>

<script>
export default {
  name: 'KiwiDropdownItem',
  inject: ['dropdown'],
  props: {
    command: {},
    disabled: Boolean,
    divided: Boolean,
    icon: String,
    selected: Boolean,
    title: String
  },
  computed: {
    itemClasses() {
      return {
        'is-disabled': this.disabled,
        'is-divided': this.divided,
        'is-selected': this.selected,
        'has-icon': this.icon
      }
    }
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
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0; // Allow flex shrinking

  .item-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-icon {
    flex-shrink: 0;
    font-size: 16px;
    width: 18px;
    text-align: center;
    transition: var(--transition-fast);
  }

  .item-check {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--color-primary);
    margin-left: auto;
  }

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);

    // Icon glow on hover
    .item-icon {
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

  &.is-selected {
    background: rgba(var(--color-primary-rgb), 0.08);
    color: var(--color-primary);
    font-weight: 600;
  }

  &.has-icon {
    padding-left: 12px;
  }

  // Legacy icon support (direct i elements in slot)
  ::v-deep > i:not(.item-icon):not(.item-check) {
    flex-shrink: 0;
    font-size: 16px;
    transition: var(--transition-fast);
  }
}

// Responsive adjustments
@media (max-width: 480px) {
  .kiwi-dropdown-item {
    padding: 12px 14px;
    font-size: 15px; // Slightly larger for touch
  }
}
</style>
