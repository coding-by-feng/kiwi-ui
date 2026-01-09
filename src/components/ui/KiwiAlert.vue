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
  padding: 14px 18px;
  margin: 0;
  box-sizing: border-box;
  border-radius: var(--radius-lg);
  position: relative;
  background-color: var(--bg-card);
  color: var(--text-primary);
  overflow: hidden;
  opacity: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: var(--transition-normal);
  border: 1px solid var(--border-color-light);

  // Gradient accent on left
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--gradient-info);
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  }

  &--success {
    background: linear-gradient(135deg, rgba(var(--color-success-rgb), 0.1) 0%, rgba(var(--color-success-rgb), 0.05) 100%);
    border-color: rgba(var(--color-success-rgb), 0.25);

    &::before {
      background: var(--gradient-success);
    }

    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-success);
    }

    &:hover {
      box-shadow: 0 0 20px rgba(var(--color-success-rgb), 0.15);
    }
  }

  &--info {
    background: linear-gradient(135deg, rgba(var(--color-info-rgb), 0.1) 0%, rgba(var(--color-info-rgb), 0.05) 100%);
    border-color: rgba(var(--color-info-rgb), 0.25);

    &::before {
      background: var(--gradient-info);
    }

    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-info);
    }

    &:hover {
      box-shadow: 0 0 20px rgba(var(--color-info-rgb), 0.15);
    }
  }

  &--warning {
    background: linear-gradient(135deg, rgba(var(--color-warning-rgb), 0.1) 0%, rgba(var(--color-warning-rgb), 0.05) 100%);
    border-color: rgba(var(--color-warning-rgb), 0.25);

    &::before {
      background: var(--gradient-warning);
    }

    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-warning);
    }

    &:hover {
      box-shadow: 0 0 20px rgba(var(--color-warning-rgb), 0.15);
    }
  }

  &--error {
    background: linear-gradient(135deg, rgba(var(--color-danger-rgb), 0.1) 0%, rgba(var(--color-danger-rgb), 0.05) 100%);
    border-color: rgba(var(--color-danger-rgb), 0.25);

    &::before {
      background: var(--gradient-danger);
    }

    .kiwi-alert__title, .kiwi-alert__description, .kiwi-alert__icon {
      color: var(--color-danger);
    }

    &:hover {
      box-shadow: 0 0 20px rgba(var(--color-danger-rgb), 0.15);
    }
  }

  &__content {
    flex: 1;
    padding: 0 4px;
    min-width: 0;
  }

  &__icon {
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    background: rgba(var(--color-info-rgb), 0.1);
  }

  &__title {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 600;
    margin-bottom: 2px;
  }

  &__description {
    font-size: 13px;
    margin: 4px 0 0 0;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  &__closebtn {
    font-size: 14px;
    position: absolute;
    top: 14px;
    right: 14px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);

    &:hover {
      color: var(--text-primary);
      background: var(--bg-highlight);
    }
  }

  &.is-center {
    justify-content: center;
    text-align: center;

    &::before {
      display: none;
    }
  }
}
</style>
