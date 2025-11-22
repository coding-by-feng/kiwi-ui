<template>
  <div class="kiwi-dropdown" v-click-outside="close">
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
  color: var(--text-primary);
  font-size: 14px;

  .kiwi-dropdown-trigger {
    cursor: pointer;
    display: inline-block;
  }

  .kiwi-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    margin: 5px 0;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color-light);
    border-radius: 4px;
    box-shadow: var(--shadow-card);
    padding: 10px 0;
    min-width: 100px;
    transform-origin: center top;
    max-height: 300px;
    overflow-y: auto;
  }
}

.kiwi-zoom-in-top-enter-active,
.kiwi-zoom-in-top-leave-active {
  opacity: 1;
  transform: scaleY(1);
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  transform-origin: center top;
}
.kiwi-zoom-in-top-enter,
.kiwi-zoom-in-top-leave-active {
  opacity: 0;
  transform: scaleY(0);
}
</style>
