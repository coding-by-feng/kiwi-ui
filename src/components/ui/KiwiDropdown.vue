<template>
  <div class="kiwi-dropdown" :class="{ 'is-active': visible }" v-click-outside="close">
    <div class="kiwi-dropdown-trigger" @click="toggle">
      <slot></slot>
    </div>
    <transition name="kiwi-zoom-in-top">
      <div class="kiwi-dropdown-menu" v-show="visible">
        <slot name="dropdown"></slot>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'KiwiDropdown',
  directives: {
    'click-outside': {
      bind(el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el == event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event)
          }
        }
        document.body.addEventListener('click', el.clickOutsideEvent)
      },
      unbind(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent)
      }
    }
  },
  data() {
    return {
      visible: false
    }
  },
  methods: {
    toggle() {
      this.visible = !this.visible
    },
    close() {
      this.visible = false
    },
    handleItemClick(command) {
      this.$emit('command', command)
      this.close()
    }
  },
  provide() {
    return {
      dropdown: this
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-dropdown {
  display: inline-block;
  position: relative;
  z-index: 1;
  color: var(--text-primary);
  font-size: 14px;

  &.is-active {
    z-index: 9999;
  }

  .kiwi-dropdown-trigger {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: var(--transition-fast);

    &:hover {
      color: var(--color-primary);
    }
  }

  .kiwi-dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 9999;
    margin: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg),
                0 0 30px rgba(var(--color-primary-rgb), 0.08);
    padding: 8px;
    min-width: 140px;
    transform-origin: center top;
    max-height: 320px;
    overflow-y: auto;
    backdrop-filter: blur(10px);

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: var(--radius-full);

      &:hover {
        background: var(--color-primary);
      }
    }
  }
}

// Enhanced animation
.kiwi-zoom-in-top-enter-active,
.kiwi-zoom-in-top-leave-active {
  opacity: 1;
  transform: scaleY(1) translateY(0);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.2s ease;
  transform-origin: center top;
}

.kiwi-zoom-in-top-enter,
.kiwi-zoom-in-top-leave-active {
  opacity: 0;
  transform: scaleY(0.9) translateY(-8px);
}
</style>
