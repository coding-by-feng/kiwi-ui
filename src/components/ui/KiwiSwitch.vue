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
  line-height: 20px;
  height: 20px;
  vertical-align: middle;
  cursor: pointer;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
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
    width: 40px;
    height: 20px;
    border: 1px solid var(--border-color);
    outline: none;
    border-radius: 10px;
    box-sizing: border-box;
    background: var(--bg-card);
    transition: border-color .3s, background-color .3s;

    &:after {
      content: "";
      position: absolute;
      top: 1px;
      left: 1px;
      border-radius: 100%;
      transition: all .3s;
      width: 16px;
      height: 16px;
      background-color: var(--text-secondary);
    }
  }

  &.is-checked {
    .kiwi-switch__core {
      border-color: var(--color-success);
      background-color: var(--color-success);

      &:after {
        left: 100%;
        margin-left: -17px;
        background-color: #fff;
      }
    }
  }
}
</style>
