<template>
  <svg :viewBox="viewBox" :style="svgStyle" class="tree-pine">
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" :stop-color="lightenColor(color, 15)" />
        <stop offset="100%" :stop-color="color" />
      </linearGradient>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="32" cy="62" rx="16" ry="3" fill="rgba(0,0,0,0.15)"/>
    <!-- Trunk -->
    <rect x="29" y="48" width="6" height="14" rx="1" fill="#5D4037"/>
    <rect x="30" y="50" width="2" height="10" fill="rgba(255,255,255,0.1)"/>
    <!-- Bottom layer -->
    <polygon :points="'8,52 32,38 56,52'" :fill="color"/>
    <polygon :points="'10,52 32,40 54,52'" :fill="lightenColor(color, 5)"/>
    <!-- Middle layer -->
    <polygon :points="'12,42 32,26 52,42'" :fill="color"/>
    <polygon :points="'14,42 32,28 50,42'" :fill="lightenColor(color, 8)"/>
    <!-- Top layer -->
    <polygon :points="'18,32 32,14 46,32'" :fill="color"/>
    <polygon :points="'20,32 32,16 44,32'" :fill="lightenColor(color, 10)"/>
    <!-- Tip -->
    <polygon :points="'26,20 32,6 38,20'" :fill="lightenColor(color, 5)"/>
    <!-- Snow/Highlights -->
    <polygon :points="'28,18 32,10 36,18'" fill="rgba(255,255,255,0.2)"/>
    <polygon :points="'22,30 32,20 42,30'" fill="rgba(255,255,255,0.1)"/>
  </svg>
</template>

<script>
export default {
  name: 'TreePine',
  props: {
    color: { type: String, default: '#1B5E20' },
    size: { type: Number, default: 80 }
  },
  computed: {
    viewBox() { return '0 0 64 64' },
    svgStyle() { return { width: this.size + 'px', height: this.size + 'px' } },
    gradientId() { return 'pine-grad-' + this._uid }
  },
  methods: {
    lightenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = Math.min(255, (num >> 16) + amt)
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
      const B = Math.min(255, (num & 0x0000FF) + amt)
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    }
  }
}
</script>

<style scoped>
.tree-pine {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
