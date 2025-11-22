<template>
  <span
    class="kiwi-tag"
    :class="[
      `kiwi-tag--${type}`,
      `kiwi-tag--${size}`,
      { 'is-hit': hit }
    ]"
    :style="{ backgroundColor: color }"
  >
    <slot></slot>
  </span>
</template>

<script>
export default {
  name: 'KiwiTag',
  props: {
    text: String,
    closable: Boolean,
    type: {
      type: String,
      default: ''
    },
    hit: Boolean,
    disableTransitions: Boolean,
    color: String,
    size: {
      type: String,
      default: 'medium'
    },
    effect: {
      type: String,
      default: 'light',
      validator(val) {
        return ['dark', 'light', 'plain'].indexOf(val) !== -1
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-tag {
  background-color: var(--bg-card);
  border-color: var(--border-color-light);
  color: var(--text-primary);
  display: inline-block;
  height: 32px;
  padding: 0 10px;
  line-height: 30px;
  font-size: 12px;
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  box-sizing: border-box;
  white-space: nowrap;

  &--success {
    background-color: rgba(103, 194, 58, 0.1);
    border-color: rgba(103, 194, 58, 0.2);
    color: var(--color-success);
  }
  &--info {
    background-color: rgba(144, 147, 153, 0.1);
    border-color: rgba(144, 147, 153, 0.2);
    color: var(--color-info);
  }
  &--warning {
    background-color: rgba(230, 162, 60, 0.1);
    border-color: rgba(230, 162, 60, 0.2);
    color: var(--color-warning);
  }
  &--danger {
    background-color: rgba(245, 108, 108, 0.1);
    border-color: rgba(245, 108, 108, 0.2);
    color: var(--color-danger);
  }

  &--mini {
    height: 20px;
    padding: 0 5px;
    line-height: 19px;
  }
  &--small {
    height: 24px;
    padding: 0 8px;
    line-height: 22px;
  }
}
</style>
