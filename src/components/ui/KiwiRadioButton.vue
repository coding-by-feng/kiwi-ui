<template>
  <label
    class="kiwi-radio-button"
    :class="[
      size ? 'kiwi-radio-button--' + size : '',
      { 'is-active': value === label },
      { 'is-disabled': isDisabled }
    ]"
    role="radio"
    :aria-checked="value === label"
    :aria-disabled="isDisabled"
    tabindex="-1"
  >
    <input
      class="kiwi-radio-button__orig-radio"
      :value="label"
      type="radio"
      v-model="value"
      :name="name"
      @change="handleChange"
      :disabled="isDisabled"
      tabindex="-1"
    >
    <span class="kiwi-radio-button__inner" :style="value === label ? activeStyle : null" @keydown.stop>
      <slot></slot>
      <template v-if="!$slots.default">{{label}}</template>
    </span>
  </label>
</template>

<script>
export default {
  name: 'KiwiRadioButton',
  props: {
    label: {},
    disabled: Boolean,
    name: String
  },
  computed: {
    value: {
      get() {
        return this._radioGroup.value
      },
      set(value) {
        this._radioGroup.$emit('input', value)
      }
    },
    _radioGroup() {
      let parent = this.$parent
      while (parent) {
        if (parent.$options.name !== 'KiwiRadioGroup') {
          parent = parent.$parent
        } else {
          return parent
        }
      }
      return false
    },
    activeStyle() {
      return {
        backgroundColor: this._radioGroup.fill || '',
        borderColor: this._radioGroup.fill || '',
        boxShadow: this._radioGroup.fill ? `-1px 0 0 0 ${this._radioGroup.fill}` : '',
        color: this._radioGroup.textColor || ''
      }
    },
    size() {
      return this._radioGroup.size
    },
    isDisabled() {
      return this.disabled || this._radioGroup.disabled
    }
  },
  methods: {
    handleChange() {
      this.$nextTick(() => {
        this._radioGroup.$emit('change', this.value)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-radio-button {
  position: relative;
  display: inline-block;
  outline: none;

  &__inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
    white-space: nowrap;
    vertical-align: middle;
    background: var(--bg-container);
    border: 1px solid var(--border-color-light);
    font-weight: 500;
    border-left: 0;
    color: var(--text-secondary);
    -webkit-appearance: none;
    appearance: none;
    text-align: center;
    box-sizing: border-box;
    outline: none;
    margin: 0;
    position: relative;
    cursor: pointer;
    transition: var(--transition-fast);
    padding: 10px 18px;
    font-size: 14px;
    border-radius: 0;

    &:hover {
      color: var(--color-primary);
      background: var(--bg-highlight);
      z-index: 1;
    }
  }

  &:first-child {
    .kiwi-radio-button__inner {
      border-left: 1px solid var(--border-color-light);
      border-radius: var(--radius-md) 0 0 var(--radius-md);
    }
  }

  &:last-child {
    .kiwi-radio-button__inner {
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }
  }

  // Only child - full rounded
  &:only-child {
    .kiwi-radio-button__inner {
      border-radius: var(--radius-md);
      border-left: 1px solid var(--border-color-light);
    }
  }

  &__orig-radio {
    opacity: 0;
    outline: none;
    position: absolute;
    z-index: -1;
  }

  &.is-active {
    z-index: 2;

    .kiwi-radio-button__inner {
      color: #fff;
      background: var(--gradient-primary);
      border-color: var(--color-primary);
      box-shadow: 0 0 12px rgba(var(--color-primary-rgb), 0.4),
                  -1px 0 0 0 var(--color-primary);

      &:hover {
        filter: brightness(1.1);
      }
    }
  }

  &.is-disabled {
    .kiwi-radio-button__inner {
      cursor: not-allowed;
      opacity: 0.5;
      background: var(--bg-container);
      color: var(--text-muted);

      &:hover {
        color: var(--text-muted);
        background: var(--bg-container);
      }
    }
  }

  // Size variants
  &--mini {
    .kiwi-radio-button__inner {
      padding: 6px 12px;
      font-size: 12px;
    }
    &:first-child .kiwi-radio-button__inner {
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    &:last-child .kiwi-radio-button__inner {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
  }

  &--small {
    .kiwi-radio-button__inner {
      padding: 8px 14px;
      font-size: 13px;
    }
  }

  &--large {
    .kiwi-radio-button__inner {
      padding: 12px 24px;
      font-size: 15px;
    }
  }
}
</style>
