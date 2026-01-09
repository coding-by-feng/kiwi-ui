<template>
  <button
    class="kiwi-button"
    :class="[
      `kiwi-button--${type}`,
      `kiwi-button--${size}`,
      { 'is-loading': loading, 'is-disabled': disabled, 'is-plain': plain }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <i class="el-icon-loading" v-if="loading"></i>
    <i :class="icon" v-if="icon && !loading"></i>
    <span v-if="$slots.default"><slot></slot></span>
  </button>
</template>

<script>
export default {
  name: 'KiwiButton',
  props: {
    type: {
      type: String,
      default: 'default'
    },
    size: {
      type: String,
      default: 'medium'
    },
    icon: {
      type: String,
      default: ''
    },
    loading: Boolean,
    disabled: Boolean,
    plain: Boolean
  },
  methods: {
    handleClick(evt) {
      this.$emit('click', evt)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: var(--transition-fast);
  font-weight: 500;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: var(--radius-md);
  gap: 8px;
  position: relative;
  overflow: hidden;

  // Shimmer effect on hover
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover::after {
    left: 100%;
  }

  &:hover,
  &:focus {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background-color: var(--bg-highlight);
    box-shadow: var(--shadow-sm);
  }

  &:active {
    filter: brightness(0.95);
    transform: translateY(1px);
    transition: var(--transition-fast);
  }

  &.is-disabled,
  &.is-loading {
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: none;

    &::after {
      display: none;
    }
  }

  /* Sizes */
  &--medium {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: var(--radius-md);
  }
  &--small {
    padding: 9px 15px;
    font-size: 12px;
    border-radius: var(--radius-sm);
  }
  &--mini {
    padding: 7px 15px;
    font-size: 12px;
    border-radius: var(--radius-sm);
  }

  /* Types - Enhanced with gradients and glow */
  &--primary {
    color: #fff;
    background: var(--gradient-primary);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);

    &:hover, &:focus {
      background: var(--gradient-primary);
      border-color: var(--color-primary);
      color: #fff;
      box-shadow: var(--shadow-glow);
      filter: brightness(1.1);
    }
  }

  &--success {
    color: #fff;
    background: var(--gradient-success);
    border-color: var(--color-success);
    box-shadow: 0 2px 8px rgba(var(--color-success-rgb), 0.2);

    &:hover, &:focus {
      background: var(--gradient-success);
      border-color: var(--color-success);
      color: #fff;
      box-shadow: 0 0 20px rgba(var(--color-success-rgb), 0.4);
      filter: brightness(1.1);
    }
  }

  &--warning {
    color: #fff;
    background: var(--gradient-warning);
    border-color: var(--color-warning);
    box-shadow: 0 2px 8px rgba(var(--color-warning-rgb), 0.2);

    &:hover, &:focus {
      background: var(--gradient-warning);
      border-color: var(--color-warning);
      color: #fff;
      box-shadow: 0 0 20px rgba(var(--color-warning-rgb), 0.4);
      filter: brightness(1.1);
    }
  }

  &--danger {
    color: #fff;
    background: var(--gradient-danger);
    border-color: var(--color-danger);
    box-shadow: 0 2px 8px rgba(var(--color-danger-rgb), 0.2);

    &:hover, &:focus {
      background: var(--gradient-danger);
      border-color: var(--color-danger);
      color: #fff;
      box-shadow: 0 0 20px rgba(var(--color-danger-rgb), 0.4);
      filter: brightness(1.1);
    }
  }

  &--info {
    color: #fff;
    background: var(--gradient-info);
    border-color: var(--color-info);
    box-shadow: 0 2px 8px rgba(var(--color-info-rgb), 0.2);

    &:hover, &:focus {
      background: var(--gradient-info);
      border-color: var(--color-info);
      color: #fff;
      box-shadow: 0 0 20px rgba(var(--color-info-rgb), 0.4);
      filter: brightness(1.1);
    }
  }

  &--text {
    border-color: transparent;
    color: var(--color-primary);
    background: transparent;
    padding-left: 0;
    padding-right: 0;
    box-shadow: none;

    &::after {
      display: none;
    }

    &:hover, &:focus {
      color: var(--color-primary-light);
      border-color: transparent;
      background-color: transparent;
      box-shadow: none;
      text-shadow: 0 0 10px var(--color-primary);
    }
  }

  &.is-plain {
    background: transparent;

    &.kiwi-button--primary {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);

      &:hover, &:focus {
        background: var(--gradient-primary);
        color: #fff;
        box-shadow: var(--shadow-glow);
      }
    }

    &.kiwi-button--success {
      color: var(--color-success);
      border-color: var(--color-success);
      background: rgba(var(--color-success-rgb), 0.1);

      &:hover, &:focus {
        background: var(--gradient-success);
        color: #fff;
        box-shadow: 0 0 20px rgba(var(--color-success-rgb), 0.4);
      }
    }

    &.kiwi-button--warning {
      color: var(--color-warning);
      border-color: var(--color-warning);
      background: rgba(var(--color-warning-rgb), 0.1);

      &:hover, &:focus {
        background: var(--gradient-warning);
        color: #fff;
        box-shadow: 0 0 20px rgba(var(--color-warning-rgb), 0.4);
      }
    }

    &.kiwi-button--danger {
      color: var(--color-danger);
      border-color: var(--color-danger);
      background: rgba(var(--color-danger-rgb), 0.1);

      &:hover, &:focus {
        background: var(--gradient-danger);
        color: #fff;
        box-shadow: 0 0 20px rgba(var(--color-danger-rgb), 0.4);
      }
    }

    &.kiwi-button--info {
      color: var(--text-secondary);
      border-color: var(--border-color);
      background: transparent;

      &:hover, &:focus {
        color: var(--color-primary);
        border-color: var(--color-primary);
        box-shadow: var(--shadow-sm);
      }
    }
  }

  // Loading spinner animation
  .el-icon-loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
