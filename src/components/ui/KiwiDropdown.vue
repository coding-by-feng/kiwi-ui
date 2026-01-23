<template>
  <div class="kiwi-dropdown" :class="dropdownClasses" v-click-outside="close" ref="dropdown">
    <div class="kiwi-dropdown-trigger" @click="toggle">
      <slot></slot>
    </div>
    <transition name="kiwi-zoom-in-top">
      <div
        class="kiwi-dropdown-menu"
        v-show="visible"
        ref="menu"
        :style="menuStyle"
        @wheel.stop="handleWheel"
        @touchmove.stop="handleTouchMove"
      >
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
  props: {
    placement: {
      type: String,
      default: 'bottom-start',
      validator: (val) => ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'auto'].includes(val)
    }
  },
  data() {
    return {
      visible: false,
      actualPlacement: 'bottom-start',
      menuStyle: {}
    }
  },
  computed: {
    dropdownClasses() {
      return {
        'is-active': this.visible,
        [`placement-${this.actualPlacement}`]: true
      }
    }
  },
  watch: {
    visible(val) {
      this.$emit('visible-change', val)
    }
  },
  methods: {
    toggle() {
      if (!this.visible) {
        this.visible = true
        this.$nextTick(() => {
          this.updatePosition()
          this.scrollToInitialPosition()
        })
      } else {
        this.visible = false
      }
    },
    scrollToInitialPosition() {
      const menu = this.$refs.menu
      if (!menu) return
      // For top placements, scroll to bottom so items closest to trigger are visible first
      if (this.actualPlacement.startsWith('top')) {
        menu.scrollTop = menu.scrollHeight
      } else {
        menu.scrollTop = 0
      }
    },
    close() {
      this.visible = false
    },
    handleItemClick(command) {
      this.$emit('command', command)
      this.close()
    },
    handleWheel(event) {
      const menu = this.$refs.menu
      if (!menu) return

      const { scrollTop, scrollHeight, clientHeight } = menu
      const delta = event.deltaY

      // At top and trying to scroll up
      if (scrollTop === 0 && delta < 0) {
        event.preventDefault()
        return
      }

      // At bottom and trying to scroll down
      if (scrollTop + clientHeight >= scrollHeight && delta > 0) {
        event.preventDefault()
        return
      }
    },
    handleTouchMove(event) {
      const menu = this.$refs.menu
      if (!menu) return

      const { scrollTop, scrollHeight, clientHeight } = menu

      // If content is not scrollable, prevent all touch scroll
      if (scrollHeight <= clientHeight) {
        event.preventDefault()
        return
      }

      // At boundaries, prevent default to stop page scroll
      if (scrollTop === 0 || scrollTop + clientHeight >= scrollHeight) {
        // Allow the scroll within the menu but this prevents page scroll
        // The .stop modifier already prevents propagation
      }
    },
    updatePosition() {
      if (!this.$refs.dropdown || !this.$refs.menu) return

      const trigger = this.$refs.dropdown
      const menu = this.$refs.menu
      const triggerRect = trigger.getBoundingClientRect()
      const menuRect = menu.getBoundingClientRect()

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const scrollY = window.scrollY || window.pageYOffset
      const scrollX = window.scrollX || window.pageXOffset
      const isMobile = viewportWidth <= 768
      const padding = isMobile ? 12 : 8 // More padding on mobile

      // Calculate available space
      const spaceBelow = viewportHeight - triggerRect.bottom
      const spaceAbove = triggerRect.top
      const spaceRight = viewportWidth - triggerRect.left
      const spaceLeft = triggerRect.right

      let placement = this.placement

      // Auto placement logic
      if (placement === 'auto') {
        // Determine vertical placement - prefer the side that can fit the menu
        let verticalPlacement
        if (spaceBelow >= menuRect.height) {
          // Enough space below - use bottom
          verticalPlacement = 'bottom'
        } else if (spaceAbove >= menuRect.height) {
          // Enough space above - use top
          verticalPlacement = 'top'
        } else {
          // Neither side has enough space - use the side with more space
          verticalPlacement = spaceBelow >= spaceAbove ? 'bottom' : 'top'
        }
        // Determine horizontal placement
        const horizontalPlacement = spaceRight >= menuRect.width || spaceRight >= spaceLeft ? 'start' : 'end'
        placement = `${verticalPlacement}-${horizontalPlacement}`
      } else {
        // Only adjust horizontal placement if needed, keep vertical placement as requested
        if (placement.endsWith('start') && spaceRight < menuRect.width && spaceLeft > spaceRight) {
          placement = placement.replace('start', 'end')
        } else if (placement.endsWith('end') && spaceLeft < menuRect.width && spaceRight > spaceLeft) {
          placement = placement.replace('end', 'start')
        }
      }

      this.actualPlacement = placement

      // Calculate menu style for proper positioning
      const style = {}

      // On mobile, ensure dropdown stays within viewport with proper margins
      if (isMobile) {
        // Calculate where the menu would be positioned
        const menuLeft = placement.endsWith('start') ? triggerRect.left : triggerRect.right - menuRect.width
        const menuRight = menuLeft + menuRect.width

        // Check if menu overflows right edge
        if (menuRight > viewportWidth - padding) {
          const overflow = menuRight - (viewportWidth - padding)
          style.left = `${-overflow}px`
        }

        // Check if menu overflows left edge
        if (menuLeft < padding) {
          const overflow = padding - menuLeft
          if (placement.endsWith('start')) {
            style.left = `${overflow}px`
          } else {
            style.right = `${-overflow}px`
          }
        }

        // Limit menu width on mobile to prevent overflow
        const maxMenuWidth = viewportWidth - (padding * 2)
        if (menuRect.width > maxMenuWidth) {
          style.maxWidth = `${maxMenuWidth}px`
          style.minWidth = 'auto'
        }
      } else {
        // Desktop: existing logic
        if (placement.endsWith('start')) {
          const rightOverflow = triggerRect.left + menuRect.width - viewportWidth
          if (rightOverflow > 0) {
            style.left = `${-rightOverflow - padding}px`
          }
        } else {
          const leftOverflow = triggerRect.right - menuRect.width
          if (leftOverflow < 0) {
            style.right = `${leftOverflow - padding}px`
          }
        }
      }

      // Set max-height based on available space, capped at 320px
      const availableSpace = placement.startsWith('bottom') ? spaceBelow - 16 : spaceAbove - 16
      const maxHeight = Math.min(320, Math.max(120, availableSpace))
      style.maxHeight = `${maxHeight}px`

      this.menuStyle = style
    }
  },
  mounted() {
    window.addEventListener('resize', this.updatePosition)
    window.addEventListener('scroll', this.updatePosition, true)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updatePosition)
    window.removeEventListener('scroll', this.updatePosition, true)
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
    z-index: 9999;
    margin: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg),
                0 0 30px rgba(var(--color-primary-rgb), 0.08);
    padding: 8px;
    min-width: 140px;
    max-height: 320px;
    overflow-y: auto;
    overflow-x: hidden;
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

  // Placement variations
  &.placement-bottom-start .kiwi-dropdown-menu {
    top: calc(100% + 4px);
    left: 0;
    transform-origin: top left;
  }

  &.placement-bottom-end .kiwi-dropdown-menu {
    top: calc(100% + 4px);
    right: 0;
    left: auto;
    transform-origin: top right;
  }

  &.placement-top-start .kiwi-dropdown-menu {
    bottom: calc(100% + 4px);
    top: auto;
    left: 0;
    transform-origin: bottom left;
  }

  &.placement-top-end .kiwi-dropdown-menu {
    bottom: calc(100% + 4px);
    top: auto;
    right: 0;
    left: auto;
    transform-origin: bottom right;
  }
}

// Enhanced animation for bottom placements
.placement-bottom-start,
.placement-bottom-end {
  .kiwi-zoom-in-top-enter-active,
  .kiwi-zoom-in-top-leave-active {
    opacity: 1;
    transform: scaleY(1) translateY(0);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.2s ease;
  }

  .kiwi-zoom-in-top-enter,
  .kiwi-zoom-in-top-leave-active {
    opacity: 0;
    transform: scaleY(0.9) translateY(-8px);
  }
}

// Enhanced animation for top placements
.placement-top-start,
.placement-top-end {
  .kiwi-zoom-in-top-enter-active,
  .kiwi-zoom-in-top-leave-active {
    opacity: 1;
    transform: scaleY(1) translateY(0);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.2s ease;
  }

  .kiwi-zoom-in-top-enter,
  .kiwi-zoom-in-top-leave-active {
    opacity: 0;
    transform: scaleY(0.9) translateY(8px);
  }
}

// Default animation fallback
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
