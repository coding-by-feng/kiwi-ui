<template>
  <svg :viewBox="viewBox" :style="svgStyle" class="tree-willow">
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="lightenColor(color, 15)" />
        <stop offset="100%" :stop-color="darkenColor(color, 10)" />
      </linearGradient>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="32" cy="62" rx="22" ry="4" fill="rgba(0,0,0,0.15)"/>
    <!-- Trunk -->
    <path d="M28 30 L26 62 L38 62 L36 30 Q32 28 28 30" fill="#6D4C41"/>
    <path d="M29 32 L28 60 L31 60 L31 32" fill="rgba(255,255,255,0.1)"/>
    <!-- Main crown top -->
    <ellipse cx="32" cy="18" rx="18" ry="14" :fill="`url(#${gradientId})`"/>
    <!-- Drooping branches - left -->
    <path d="M18 20 Q8 30 6 50" stroke-width="3" :stroke="color" fill="none" stroke-linecap="round"/>
    <path d="M14 22 Q6 34 4 48" stroke-width="2" :stroke="lightenColor(color, 10)" fill="none" stroke-linecap="round"/>
    <path d="M22 24 Q14 36 12 52" stroke-width="2" :stroke="color" fill="none" stroke-linecap="round"/>
    <!-- Drooping branches - right -->
    <path d="M46 20 Q56 30 58 50" stroke-width="3" :stroke="color" fill="none" stroke-linecap="round"/>
    <path d="M50 22 Q58 34 60 48" stroke-width="2" :stroke="lightenColor(color, 10)" fill="none" stroke-linecap="round"/>
    <path d="M42 24 Q50 36 52 52" stroke-width="2" :stroke="color" fill="none" stroke-linecap="round"/>
    <!-- Center drooping -->
    <path d="M28 26 Q24 40 22 56" stroke-width="2" :stroke="lightenColor(color, 5)" fill="none" stroke-linecap="round"/>
    <path d="M36 26 Q40 40 42 56" stroke-width="2" :stroke="lightenColor(color, 5)" fill="none" stroke-linecap="round"/>
    <path d="M32 28 Q32 42 32 58" stroke-width="2" :stroke="color" fill="none" stroke-linecap="round"/>
    <!-- Leaf clusters on branches -->
    <ellipse cx="6" cy="48" rx="4" ry="6" :fill="lightenColor(color, 10)" opacity="0.8"/>
    <ellipse cx="58" cy="48" rx="4" ry="6" :fill="lightenColor(color, 10)" opacity="0.8"/>
    <ellipse cx="12" cy="52" rx="3" ry="5" :fill="color" opacity="0.7"/>
    <ellipse cx="52" cy="52" rx="3" ry="5" :fill="color" opacity="0.7"/>
    <!-- Highlights -->
    <ellipse cx="26" cy="14" rx="6" ry="4" fill="rgba(255,255,255,0.15)"/>
  </svg>
</template>

<script>
export default {
  name: 'TreeWillow',
  props: {
    color: { type: String, default: '#8BC34A' },
    size: { type: Number, default: 80 }
  },
  computed: {
    viewBox() { return '0 0 64 64' },
    svgStyle() { return { width: this.size + 'px', height: this.size + 'px' } },
    gradientId() { return 'willow-grad-' + this._uid }
  },
  methods: {
    lightenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = Math.min(255, (num >> 16) + amt)
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
      const B = Math.min(255, (num & 0x0000FF) + amt)
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    },
    darkenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = Math.max(0, (num >> 16) - amt)
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
      const B = Math.max(0, (num & 0x0000FF) - amt)
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    }
  }
}
</script>

<style scoped>
.tree-willow {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
