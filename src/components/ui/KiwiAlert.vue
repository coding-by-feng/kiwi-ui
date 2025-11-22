<template>
  <div class="kiwi-alert" :class="[`kiwi-alert--${type}`, { 'is-center': center }]">
    <div class="kiwi-alert__content">
      <span class="kiwi-alert__title" v-if="title || $slots.title">
        <slot name="title">{{ title }}</slot>
      </span>
      <p class="kiwi-alert__description" v-if="description || $slots.default">
        <slot>{{ description }}</slot>
      </p>
      <i class="kiwi-alert__icon" :class="iconClass" v-if="showIcon"></i>
    </div>
    <i class="kiwi-alert__closebtn el-icon-close" v-if="closable" @click="close"></i>
  </div>
</template>

<script>
export default {
  name: 'KiwiAlert',
  props: {
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info'
    },
    closable: {
      type: Boolean,
      default: true
    },
    center: Boolean,
    showIcon: Boolean
  },
  computed: {
    iconClass() {
      const TYPE_CLASSES = {
        success: 'el-icon-success',
        warning: 'el-icon-warning',
        error: 'el-icon-error',
        info: 'el-icon-info'
      }
      return TYPE_CLASSES[this.type] || 'el-icon-info'
    }
  },
  methods: {
    close() {
      this.$emit('close')
      this.$el.parentNode.removeChild(this.$el)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-alert {
  width: 100%;
  padding: 8px 16px;
  margin: 0;
  box-sizing: border-box;
  border-radius: 4px;
  position: relative;
  background-color: var(--bg-card);
  color: var(--text-primary);
  overflow: hidden;
  opacity: 1;
  display: flex;
  align-items: center;
  transition: opacity .2s;
  border: 1px solid var(--border-color-light);

  &--success {
    background-color: rgba(var(--color-success-rgb), 0.1);
    border-color: rgba(var(--color-success-rgb), 0.2);
    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-success);
    }
  }

  &--info {
    background-color: rgba(var(--color-info-rgb), 0.1);
    border-color: rgba(var(--color-info-rgb), 0.2);
    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-info);
    }
  }

  &--warning {
    background-color: rgba(var(--color-warning-rgb), 0.1);
    border-color: rgba(var(--color-warning-rgb), 0.2);
    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-warning);
    }
  }

  &--error {
    background-color: rgba(var(--color-danger-rgb), 0.1);
    border-color: rgba(var(--color-danger-rgb), 0.2);
    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-danger);
    }
  }

  &__content {
    display: table-cell;
    padding: 0 8px;
  }

  &__icon {
    font-size: 16px;
    width: 16px;
    margin-right: 8px;
  }

  &__title {
    font-size: 13px;
    line-height: 18px;
    font-weight: 700;
  }

  &__description {
    font-size: 12px;
    margin: 5px 0 0 0;
    line-height: 18px;
  }

  &__closebtn {
    font-size: 12px;
    opacity: 1;
    position: absolute;
    top: 12px;
    right: 15px;
    cursor: pointer;
    color: var(--text-secondary);
    
    &:hover {
      color: var(--text-primary);
    }
  }

  &.is-center {
    justify-content: center;
    text-align: center;
  }
}
</style>
