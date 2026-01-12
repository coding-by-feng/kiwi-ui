<template>
  <span
    class="kiwi-tag"
    :class="[
      `kiwi-tag--${type}`,
      `kiwi-tag--${size}`,
      { 'is-hit': hit }
    ]"
    :style="{ backgroundColor: color }"
  >
    <slot></slot>
  </span>
</template>

<script>
export default {
  name: 'KiwiTag',
  props: {
    text: String,
    closable: Boolean,
    type: {
      type: String,
      default: ''
    },
    hit: Boolean,
    disableTransitions: Boolean,
    color: String,
    size: {
      type: String,
      default: 'medium'
    },
    effect: {
      type: String,
      default: 'light',
      validator(val) {
        return ['dark', 'light', 'plain'].indexOf(val) !== -1
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-tag {
  background-color: var(--bg-container);
  border-color: var(--border-color-light);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  border-width: 1px;
  border-style: solid;
  border-radius: var(--radius-full);
  box-sizing: border-box;
  white-space: nowrap;
  transition: var(--transition-fast);
  gap: 4px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  // Primary type
  &--primary {
    background: rgba(var(--color-primary-rgb), 0.15);
    border-color: rgba(var(--color-primary-rgb), 0.3);
    color: var(--color-primary);

    &:hover {
      box-shadow: 0 0 12px rgba(var(--color-primary-rgb), 0.3);
    }
  }

  // Success type with glow
  &--success {
    background: rgba(var(--color-success-rgb), 0.15);
    border-color: rgba(var(--color-success-rgb), 0.3);
    color: var(--color-success);

    &:hover {
      box-shadow: 0 0 12px rgba(var(--color-success-rgb), 0.3);
    }
  }

  // Info type
  &--info {
    background: rgba(var(--color-info-rgb), 0.15);
    border-color: rgba(var(--color-info-rgb), 0.3);
    color: var(--color-info);

    &:hover {
      box-shadow: 0 0 12px rgba(var(--color-info-rgb), 0.3);
    }
  }

  // Warning type with glow
  &--warning {
    background: rgba(var(--color-warning-rgb), 0.15);
    border-color: rgba(var(--color-warning-rgb), 0.3);
    color: var(--color-warning);

    &:hover {
      box-shadow: 0 0 12px rgba(var(--color-warning-rgb), 0.3);
    }
  }

  // Danger type with glow
  &--danger {
    background: rgba(var(--color-danger-rgb), 0.15);
    border-color: rgba(var(--color-danger-rgb), 0.3);
    color: var(--color-danger);

    &:hover {
      box-shadow: 0 0 12px rgba(var(--color-danger-rgb), 0.3);
    }
  }

  // Hit state - emphasized border
  &.is-hit {
    border-width: 2px;
    animation: tag-pulse 1.5s ease-in-out infinite;
  }

  // Size variants
  &--mini {
    height: 20px;
    padding: 0 8px;
    font-size: 10px;
  }

  &--small {
    height: 24px;
    padding: 0 10px;
    font-size: 11px;
  }

  &--large {
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
  }
}

@keyframes tag-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
