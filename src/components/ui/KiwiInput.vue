<template>
  <div class="kiwi-input" :class="{ 'kiwi-input--group': $slots.append || $slots.prepend, 'kiwi-input--prefix': $slots.prefix || prefixIcon, 'kiwi-input--suffix': $slots.suffix || suffixIcon || clearable || showPassword, 'kiwi-input--textarea': type === 'textarea' }">
    <div v-if="$slots.prepend" class="kiwi-input__prepend" @click="$emit('prepend-click', $event)">
      <slot name="prepend"></slot>
    </div>
    <div class="kiwi-input__prefix" v-if="type !== 'textarea' && ($slots.prefix || prefixIcon)">
      <slot name="prefix">
        <i :class="prefixIcon" v-if="prefixIcon"></i>
      </slot>
    </div>
    <textarea
      v-if="type === 'textarea'"
      class="kiwi-input__inner kiwi-input__textarea"
      v-bind="$attrs"
      :value="value"
      :disabled="disabled"
      :readonly="readonly"
      @input="$emit('input', $event.target.value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      @change="$emit('change', $event.target.value)"
    ></textarea>
    <input
      v-else
      class="kiwi-input__inner"
      v-bind="$attrs"
      :value="value"
      :type="inputType"
      :disabled="disabled"
      :readonly="readonly"
      @input="$emit('input', $event.target.value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      @change="$emit('change', $event.target.value)"
      @keyup.enter="$emit('keyup.enter', $event)"
    />
    <div class="kiwi-input__suffix" v-if="type !== 'textarea' && ($slots.suffix || suffixIcon || showClear || showPassword)">
      <slot name="suffix">
        <i class="kiwi-input__icon el-icon-circle-close kiwi-input__clear" v-if="showClear" @click="clear"></i>
        <i class="kiwi-input__icon el-icon-view kiwi-input__pwd-toggle" v-if="showPassword" @click="togglePasswordVisible"></i>
        <i class="kiwi-input__icon" :class="suffixIcon" v-if="suffixIcon && !showClear && !showPassword"></i>
      </slot>
    </div>
    <div v-if="$slots.append" class="kiwi-input__append" @click="$emit('append-click', $event)">
      <slot name="append"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KiwiInput',
  props: {
    value: [String, Number],
    type: {
      type: String,
      default: 'text'
    },
    disabled: Boolean,
    readonly: Boolean,
    clearable: Boolean,
    showPassword: Boolean,
    prefixIcon: String,
    suffixIcon: String
  },
  data() {
    return {
      passwordVisible: false
    }
  },
  computed: {
    inputType() {
      if (this.showPassword) {
        return this.passwordVisible ? 'text' : 'password'
      }
      return this.type
    },
    showClear() {
      return this.clearable && !this.disabled && !this.readonly && this.value
    }
  },
  methods: {
    clear() {
      this.$emit('input', '')
      this.$emit('change', '')
      this.$emit('clear')
    },
    togglePasswordVisible() {
      this.passwordVisible = !this.passwordVisible
    },
    focus() {
      const input = this.$el.querySelector('input, textarea')
      if (input) {
        input.focus()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-input {
  display: inline-flex;
  width: 100%;
  position: relative;
  font-size: 14px;

  &__inner {
    -webkit-appearance: none;
    appearance: none;
    background-color: var(--bg-card);
    background-image: none;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color-light);
    box-sizing: border-box;
    color: var(--text-primary);
    display: inline-block;
    font-size: inherit;
    height: 40px;
    line-height: 40px;
    outline: none;
    padding: 0 15px;
    transition: var(--transition-normal);
    width: 100%;

    &::placeholder {
      color: var(--text-placeholder);
    }

    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
    }

    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2),
                  0 0 15px rgba(var(--color-primary-rgb), 0.15);
    }
  }

  &--prefix .kiwi-input__inner {
    padding-left: 36px;
  }

  &--suffix .kiwi-input__inner {
    padding-right: 36px;
  }

  &__prefix, &__suffix {
    position: absolute;
    top: 0;
    height: 100%;
    color: var(--text-placeholder);
    text-align: center;
    transition: var(--transition-fast);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
  }

  &__prefix {
    left: 0;
  }

  &__suffix {
    right: 0;
    pointer-events: auto;
  }

  // When input is focused, highlight icons
  &:focus-within {
    .kiwi-input__prefix,
    .kiwi-input__suffix {
      color: var(--color-primary);
    }
  }

  &__icon {
    height: 100%;
    width: 25px;
    text-align: center;
    transition: var(--transition-fast);
    line-height: 40px;

    &:after {
      content: '';
      height: 100%;
      width: 0;
      display: inline-block;
      vertical-align: middle;
    }
  }

  &__clear, &__pwd-toggle {
    cursor: pointer;
    border-radius: var(--radius-sm);

    &:hover {
      color: var(--color-primary);
      text-shadow: 0 0 8px var(--color-primary);
    }
  }

  &--group {
    display: inline-table;
    line-height: normal;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;

    .kiwi-input__inner {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      display: table-cell;
    }
  }

  &__prepend {
    background: var(--bg-container);
    border: 1px solid var(--border-color-light);
    border-right: 0;
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    color: var(--text-secondary);
    display: table-cell;
    padding: 0 16px;
    position: relative;
    vertical-align: middle;
    white-space: nowrap;
    width: 1px;
    cursor: pointer;
    transition: var(--transition-fast);

    &:hover {
      color: var(--color-primary);
      background: var(--bg-highlight);
    }
  }

  &__append {
    background: var(--bg-container);
    border: 1px solid var(--border-color-light);
    border-left: 0;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    color: var(--text-secondary);
    display: table-cell;
    padding: 0 16px;
    position: relative;
    vertical-align: middle;
    white-space: nowrap;
    width: 1px;
    cursor: pointer;
    transition: var(--transition-fast);

    &:hover {
      color: var(--color-primary);
      background: var(--bg-highlight);
    }
  }

  &__textarea {
    height: auto;
    min-height: 80px;
    padding: 12px 15px;
    line-height: 1.6;
    resize: vertical;
    border-radius: var(--radius-md);
  }
}
</style>
