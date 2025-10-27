<template>
  <div
    v-if="isVisible"
    class="help-tour-button"
    :style="computedStyle"
    @mousedown="startDrag($event)"
    @touchstart.passive="startDrag($event)"
  >
    <el-dropdown ref="menu" trigger="click" @command="onCommand">
      <el-button
        type="primary"
        circle
        icon="el-icon-help"
        :title="$t('about.runGuidedTour')"
        aria-label="Help and Tour"
        :style="{ pointerEvents: isDragging ? 'none' : 'auto' }"
        @click.native="onButtonClick"
      ></el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="run">{{ $t('about.runGuidedTour') }}</el-dropdown-item>
        <el-dropdown-item command="reset">{{ $t('about.resetGuidedTour') || 'Reset Guided Tour' }}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { startTourNow, resetOnboardingTour, getHelpIconVisible } from '@/util/tour'

const STORAGE_KEY = 'kiwi.tour.button.pos'
const SUPPRESS_CLICK_MS = 180
const MOVE_THRESHOLD = 3

export default {
  name: 'HelpTourButton',
  props: {
    right: { type: Number, default: 16 },
    bottom: { type: Number, default: 16 },
    visible: { type: Boolean, default: true },
    draggable: { type: Boolean, default: true }
  },
  data() {
    return {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      startLeft: null,
      startTop: null,
      posLeft: null,
      posTop: null,
      suppressClickUntil: 0,
      moved: false,
      btnWidth: 48,
      btnHeight: 48,
      internalVisible: true
    }
  },
  computed: {
    computedStyle() {
      const style = {
        position: 'fixed',
        zIndex: 2000
      }
      if (this.posLeft != null && this.posTop != null) {
        style.left = this.posLeft + 'px'
        style.top = this.posTop + 'px'
      } else {
        style.right = this.right + 'px'
        style.bottom = this.bottom + 'px'
      }
      return style
    },
    isVisible() {
      return this.visible && this.internalVisible
    }
  },
  mounted() {
    this.$nextTick(() => {
      try {
        const rect = this.$el.getBoundingClientRect()
        this.btnWidth = rect.width || this.btnWidth
        this.btnHeight = rect.height || this.btnHeight
      } catch (_) {}
      this.loadPositionOrDefault()
      window.addEventListener('resize', this.onResize)
      // sync visibility from storage flag managed by tour.js
      try { this.internalVisible = getHelpIconVisible() } catch (_) {}
      try { window.addEventListener('tour-settings-updated', this.syncVisibility) } catch (_) {}
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    this.detachDrag()
    try { window.removeEventListener('tour-settings-updated', this.syncVisibility) } catch (_) {}
  },
  methods: {
    syncVisibility() {
      try { this.internalVisible = getHelpIconVisible() } catch (_) {}
    },
    onCommand(cmd) {
      try {
        if (cmd === 'run') return void startTourNow(this.$router)
        if (cmd === 'reset') return void resetOnboardingTour()
      } catch (_) {}
    },
    onButtonClick(e) {
      if (Date.now() < this.suppressClickUntil) {
        e.stopPropagation()
        e.preventDefault()
        return false
      }
      return true
    },
    loadPositionOrDefault() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
        if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
          this.posLeft = saved.left
          this.posTop = saved.top
          this.clampToViewport()
          return
        }
      } catch (_) {}
      // default: bottom-right using props
      const vw = window.innerWidth
      const vh = window.innerHeight
      this.posLeft = Math.max(0, vw - this.right - this.btnWidth)
      this.posTop = Math.max(0, vh - this.bottom - this.btnHeight)
    },
    savePosition() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: this.posLeft, top: this.posTop }))
      } catch (_) {}
    },
    clampToViewport() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const pad = 4
      const maxLeft = Math.max(0, vw - this.btnWidth - pad)
      const maxTop = Math.max(0, vh - this.btnHeight - pad)
      this.posLeft = Math.min(Math.max(pad, this.posLeft), maxLeft)
      this.posTop = Math.min(Math.max(pad, this.posTop), maxTop)
    },
    onResize() {
      this.clampToViewport()
      this.savePosition()
    },
    startDrag(evt) {
      if (!this.draggable) return
      const isTouch = evt.type === 'touchstart'
      const point = isTouch ? (evt.touches[0] || evt.changedTouches[0]) : evt
      // Do not set isDragging here; wait until movement exceeds threshold
      this.moved = false
      this.isDragging = false
      this.dragStartX = point.clientX
      this.dragStartY = point.clientY
      this.startLeft = this.posLeft
      this.startTop = this.posTop
      window.addEventListener('mousemove', this.onDragMove)
      window.addEventListener('mouseup', this.stopDrag, { once: true })
      window.addEventListener('touchmove', this.onDragMove, { passive: true })
      window.addEventListener('touchend', this.stopDrag, { once: true })
    },
    onDragMove(evt) {
      const isTouch = evt.type === 'touchmove'
      const point = isTouch ? (evt.touches[0] || (evt.changedTouches && evt.changedTouches[0])) : evt
      if (!point) return
      const dx = point.clientX - this.dragStartX
      const dy = point.clientY - this.dragStartY
      if (!this.moved) {
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < MOVE_THRESHOLD) return
        this.moved = true
        this.isDragging = true
      }
      this.posLeft = this.startLeft + dx
      this.posTop = this.startTop + dy
      this.clampToViewport()
    },
    stopDrag() {
      // Only act if a drag listener was attached
      this.detachDrag()
      if (this.isDragging) {
        this.isDragging = false
        if (this.moved) {
          this.savePosition()
          this.suppressClickUntil = Date.now() + SUPPRESS_CLICK_MS
        }
      }
    },
    detachDrag() {
      window.removeEventListener('mousemove', this.onDragMove)
      window.removeEventListener('mouseup', this.stopDrag)
      window.removeEventListener('touchmove', this.onDragMove)
      window.removeEventListener('touchend', this.stopDrag)
    }
  }
}
</script>

<style scoped>
.help-tour-button {
  /* Slight shadow so button stands out over content */
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2));
}
</style>
