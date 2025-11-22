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
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: .1s;
  font-weight: 500;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 4px;
  gap: 8px;

  &:hover,
  &:focus {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background-color: rgba(64, 158, 255, 0.1);
  }

  &:active {
    filter: brightness(0.9);
    transform: translateY(1px);
  }

  &.is-disabled,
  &.is-loading {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Sizes */
  &--medium {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 4px;
  }
  &--small {
    padding: 9px 15px;
    font-size: 12px;
    border-radius: 3px;
  }
  &--mini {
    padding: 7px 15px;
    font-size: 12px;
    border-radius: 3px;
  }

  /* Types */
  &--primary {
    color: #fff;
    background: var(--color-primary);
    border-color: var(--color-primary);
    &:hover, &:focus {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
      opacity: 0.8;
    }
  }
  &--success {
    color: #fff;
    background: var(--color-success);
    border-color: var(--color-success);
    &:hover, &:focus {
      background: var(--color-success);
      border-color: var(--color-success);
      color: #fff;
      opacity: 0.8;
    }
  }
  &--warning {
    color: #fff;
    background: var(--color-warning);
    border-color: var(--color-warning);
    &:hover, &:focus {
      background: var(--color-warning);
      border-color: var(--color-warning);
      color: #fff;
      opacity: 0.8;
    }
  }
  &--danger {
    color: #fff;
    background: var(--color-danger);
    border-color: var(--color-danger);
    &:hover, &:focus {
      background: var(--color-danger);
      border-color: var(--color-danger);
      color: #fff;
      opacity: 0.8;
    }
  }
  &--info {
    color: #fff;
    background: var(--color-info);
    border-color: var(--color-info);
    &:hover, &:focus {
      background: var(--color-info);
      border-color: var(--color-info);
      color: #fff;
      opacity: 0.8;
    }
  }
  &--text {
    border-color: transparent;
    color: var(--color-primary);
    background: transparent;
    padding-left: 0;
    padding-right: 0;

    &:hover, &:focus {
      color: var(--text-secondary);
      border-color: transparent;
      background-color: transparent;
    }
  }
  &.is-plain {
    background: transparent;
    
    &.kiwi-button--primary {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);
      
      &:hover, &:focus {
        background: var(--color-primary);
        color: #fff;
      }
    }
    
    &.kiwi-button--success {
      color: var(--color-success);
      border-color: var(--color-success);
      background: rgba(var(--color-success-rgb), 0.1);
      
      &:hover, &:focus {
        background: var(--color-success);
        color: #fff;
      }
    }
    
    &.kiwi-button--warning {
      color: var(--color-warning);
      border-color: var(--color-warning);
      background: rgba(var(--color-warning-rgb), 0.1);
      
      &:hover, &:focus {
        background: var(--color-warning);
        color: #fff;
      }
    }
    
    &.kiwi-button--danger {
      color: var(--color-danger);
      border-color: var(--color-danger);
      background: rgba(var(--color-danger-rgb), 0.1);
      
      &:hover, &:focus {
        background: var(--color-danger);
        color: #fff;
      }
    }
    
    &.kiwi-button--info {
      color: var(--text-secondary);
      border-color: var(--border-color);
      background: transparent;
      
      &:hover, &:focus {
        color: var(--color-primary);
        border-color: var(--color-primary);
      }
    }
  }
}
</style>
