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
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    vertical-align: middle;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    font-weight: 500;
    border-left: 0;
    color: var(--text-regular);
    -webkit-appearance: none;
    appearance: none;
    text-align: center;
    box-sizing: border-box;
    outline: none;
    margin: 0;
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(.645,.045,.355,1);
    padding: 12px 20px;
    font-size: 14px;
    border-radius: 0;

    &:hover {
      color: var(--color-primary);
    }
  }

  &:first-child {
    .kiwi-radio-button__inner {
      border-left: 1px solid var(--border-color);
      border-radius: 4px 0 0 4px;
      box-shadow: none !important;
    }
  }

  &:last-child {
    .kiwi-radio-button__inner {
      border-radius: 0 4px 4px 0;
    }
  }

  &__orig-radio {
    opacity: 0;
    outline: none;
    position: absolute;
    z-index: -1;
  }

  &.is-active {
    .kiwi-radio-button__inner {
      color: #fff;
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      box-shadow: -1px 0 0 0 var(--color-primary);
    }
  }

  &--mini {
    .kiwi-radio-button__inner {
      padding: 7px 15px;
      font-size: 12px;
      border-radius: 0;
    }
    &:first-child .kiwi-radio-button__inner {
      border-radius: 3px 0 0 3px;
    }
    &:last-child .kiwi-radio-button__inner {
      border-radius: 0 3px 3px 0;
    }
  }
}
</style>
