<template>
  <div
    class="kiwi-switch"
    :class="{ 'is-checked': value, 'is-disabled': disabled }"
    @click="toggle"
    role="switch"
    :aria-checked="value"
  >
    <input
      class="kiwi-switch__input"
      type="checkbox"
      @change="toggle"
      :name="name"
      :true-value="activeValue"
      :false-value="inactiveValue"
      :disabled="disabled"
      @keydown.enter="toggle"
    >
    <span class="kiwi-switch__core" ref="core">
      <span class="kiwi-switch__button"></span>
    </span>
  </div>
</template>

<script>
export default {
  name: 'KiwiSwitch',
  props: {
    value: {
      type: [Boolean, String, Number],
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 40
    },
    activeIconClass: {
      type: String,
      default: ''
    },
    inactiveIconClass: {
      type: String,
      default: ''
    },
    activeText: String,
    inactiveText: String,
    activeColor: {
      type: String,
      default: ''
    },
    inactiveColor: {
      type: String,
      default: ''
    },
    activeValue: {
      type: [Boolean, String, Number],
      default: true
    },
    inactiveValue: {
      type: [Boolean, String, Number],
      default: false
    },
    name: {
      type: String,
      default: ''
    }
  },
  methods: {
    toggle() {
      if (this.disabled) return
      this.$emit('input', !this.value ? this.activeValue : this.inactiveValue)
      this.$emit('change', !this.value ? this.activeValue : this.inactiveValue)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-switch {
  display: inline-flex;
  align-items: center;
  position: relative;
  font-size: 14px;
  line-height: 22px;
  height: 22px;
  vertical-align: middle;
  cursor: pointer;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;

    .kiwi-switch__core {
      &:hover {
        box-shadow: none;
      }
    }
  }

  &__input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    margin: 0;
  }

  &__core {
    margin: 0;
    display: inline-block;
    position: relative;
    width: 44px;
    height: 22px;
    border: 1px solid var(--border-color-light);
    outline: none;
    border-radius: 11px;
    box-sizing: border-box;
    background: var(--bg-container);
    transition: var(--transition-normal);

    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
    }

    // The toggle button
    &:after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      border-radius: 50%;
      transition: var(--transition-normal);
      width: 16px;
      height: 16px;
      background: var(--text-muted);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  // Checked state with gradient and glow
  &.is-checked {
    .kiwi-switch__core {
      border-color: var(--color-success);
      background: var(--gradient-success);
      box-shadow: 0 0 12px rgba(var(--color-success-rgb), 0.4);

      &:hover {
        box-shadow: 0 0 20px rgba(var(--color-success-rgb), 0.5);
      }

      &:after {
        left: calc(100% - 18px);
        background: #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      }
    }
  }

  // Focus state
  &:focus-within .kiwi-switch__core {
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
  }
}
</style>
