<template>
  <!-- Headless component: no UI, only side-effect to run first-visit tour -->
  <div style="display:none" aria-hidden="true"></div>
</template>

<script>
// Keep tour CSS and logic self-contained in this component
import 'driver.js/dist/driver.css'
import { maybeStartOnboardingTour } from '@/util/tour'

export default {
  name: 'TourSteps',
  props: {
    enabled: { type: Boolean, default: true },
    delay: { type: Number, default: 0 } // extra delay before starting, if needed
  },
  mounted() {
    if (!this.enabled) return
    const start = () => { try { maybeStartOnboardingTour(this.$router) } catch (_) {} }
    if (this.delay > 0) {
      setTimeout(start, this.delay)
    } else {
      // Let the initial route and children render first
      this.$nextTick(() => setTimeout(start, 0))
    }
  }
}
</script>

