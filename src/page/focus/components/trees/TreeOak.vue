<template>
  <svg :viewBox="viewBox" :style="svgStyle" class="tree-oak">
    <defs>
      <radialGradient :id="gradientId" cx="30%" cy="30%" r="70%">
        <stop offset="0%" :stop-color="lightenColor(color, 20)" />
        <stop offset="100%" :stop-color="color" />
      </radialGradient>
      <filter :id="shadowId">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="32" cy="62" rx="20" ry="4" fill="rgba(0,0,0,0.15)"/>
    <!-- Trunk -->
    <path d="M28 35 L26 62 L38 62 L36 35 Z" fill="#6D4C41"/>
    <path d="M29 38 L28 60 L31 60 L31 38 Z" fill="rgba(255,255,255,0.1)"/>
    <!-- Branches -->
    <path d="M28 45 L18 40 L20 38 L28 42" fill="#5D4037"/>
    <path d="M36 45 L46 40 L44 38 L36 42" fill="#5D4037"/>
    <!-- Main crown -->
    <ellipse cx="32" cy="22" rx="24" ry="22" :fill="`url(#${gradientId})`" :filter="`url(#${shadowId})`"/>
    <!-- Crown details -->
    <ellipse cx="16" cy="30" rx="12" ry="14" :fill="color" opacity="0.9"/>
    <ellipse cx="48" cy="30" rx="12" ry="14" :fill="color" opacity="0.9"/>
    <ellipse cx="32" cy="12" rx="16" ry="12" :fill="lightenColor(color, 10)" opacity="0.8"/>
    <!-- Highlights -->
    <ellipse cx="22" cy="16" rx="8" ry="6" fill="rgba(255,255,255,0.15)"/>
    <ellipse cx="12" cy="26" rx="4" ry="5" fill="rgba(255,255,255,0.1)"/>
    <!-- Texture dots -->
    <circle cx="20" cy="28" r="2" :fill="darkenColor(color, 15)" opacity="0.5"/>
    <circle cx="40" cy="24" r="2" :fill="darkenColor(color, 15)" opacity="0.5"/>
    <circle cx="30" cy="18" r="1.5" :fill="darkenColor(color, 15)" opacity="0.5"/>
  </svg>
</template>

<script>
export default {
  name: 'TreeOak',
  props: {
    color: { type: String, default: '#4CAF50' },
    size: { type: Number, default: 80 }
  },
  computed: {
    viewBox() { return '0 0 64 64' },
    svgStyle() { return { width: this.size + 'px', height: this.size + 'px' } },
    gradientId() { return 'oak-grad-' + this._uid },
    shadowId() { return 'oak-shadow-' + this._uid }
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
.tree-oak {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
