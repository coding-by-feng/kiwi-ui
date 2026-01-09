<template>
  <div class="kiwi-tabs">
    <div class="kiwi-tabs__header">
      <div class="kiwi-tabs__nav-wrap">
        <div class="kiwi-tabs__nav-scroll">
          <div class="kiwi-tabs__nav">
            <div
              v-for="pane in panes"
              :key="pane.name"
              class="kiwi-tabs__item"
              :class="{
                'is-active': value === pane.name,
                'is-disabled': pane.disabled
              }"
              @click="handleTabClick(pane)"
            >
              {{ pane.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="kiwi-tabs__content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KiwiTabs',
  props: {
    value: String,
    type: String
  },
  data() {
    return {
      panes: []
    }
  },
  methods: {
    handleTabClick(pane) {
      if (pane.disabled) return
      this.$emit('input', pane.name)
      this.$emit('tab-click', pane)
    },
    addPane(pane) {
      this.panes.push(pane)
    },
    removePane(pane) {
      const index = this.panes.indexOf(pane)
      if (index > -1) {
        this.panes.splice(index, 1)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-tabs {
  &__header {
    margin: 0 0 20px;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;
  }

  &__nav-wrap {
    overflow: hidden;
    margin-bottom: -1px;
    position: relative;
  }

  &__nav-scroll {
    overflow-x: auto;
    overflow-y: hidden;

    // Hide scrollbar
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  &__nav {
    white-space: nowrap;
    position: relative;
    transition: transform 0.3s ease;
    display: inline-flex;
    gap: 4px;
  }

  &__item {
    padding: 0 20px;
    height: 44px;
    box-sizing: border-box;
    line-height: 44px;
    display: inline-block;
    list-style: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    position: relative;
    cursor: pointer;
    transition: var(--transition-fast);
    border-radius: var(--radius-md) var(--radius-md) 0 0;

    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: var(--gradient-primary);
      transition: var(--transition-normal);
      transform: translateX(-50%);
      border-radius: var(--radius-full);
    }

    &:hover {
      color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.05);

      &::before {
        width: 50%;
      }
    }

    &.is-active {
      color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.08);
      font-weight: 600;

      &::before {
        width: 100%;
        box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.5);
      }
    }

    &.is-disabled {
      color: var(--text-placeholder);
      cursor: not-allowed;
      opacity: 0.5;

      &:hover {
        background: transparent;

        &::before {
          width: 0;
        }
      }
    }
  }

  &__content {
    padding: 4px 0;
  }
}
</style>
