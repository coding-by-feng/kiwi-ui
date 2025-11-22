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
    border-radius: 4px;
    border: 1px solid var(--border-color-light);
    box-sizing: border-box;
    color: var(--text-primary);
    display: inline-block;
    font-size: inherit;
    height: 40px;
    line-height: 40px;
    outline: none;
    padding: 0 15px;
    transition: border-color .2s cubic-bezier(.645,.045,.355,1);
    width: 100%;

    &::placeholder {
      color: var(--text-placeholder);
    }

    &:hover {
      border-color: var(--text-secondary);
    }

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &--prefix .kiwi-input__inner {
    padding-left: 30px;
  }

  &--suffix .kiwi-input__inner {
    padding-right: 30px;
  }

  &__prefix, &__suffix {
    position: absolute;
    top: 0;
    height: 100%;
    color: var(--text-placeholder);
    text-align: center;
    transition: all .3s;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
  }

  &__prefix {
    left: 0;
  }

  &__suffix {
    right: 0;
    pointer-events: auto;
  }

  &__icon {
    height: 100%;
    width: 25px;
    text-align: center;
    transition: all .3s;
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
    &:hover {
      color: var(--text-secondary);
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
    background-color: var(--bg-body);
    border: 1px solid var(--border-color-light);
    border-right: 0;
    border-radius: 4px 0 0 4px;
    color: var(--text-secondary);
    display: table-cell;
    padding: 0 20px;
    position: relative;
    vertical-align: middle;
    white-space: nowrap;
    width: 1px;
    cursor: pointer;
  }

  &__append {
    background-color: var(--bg-body);
    border: 1px solid var(--border-color-light);
    border-left: 0;
    border-radius: 0 4px 4px 0;
    color: var(--text-secondary);
    display: table-cell;
    padding: 0 20px;
    position: relative;
    vertical-align: middle;
    white-space: nowrap;
    width: 1px;
  }

  &__textarea {
    height: auto;
    min-height: 40px;
    padding: 8px 15px;
    line-height: 1.5;
    resize: vertical;
  }
}
</style>
