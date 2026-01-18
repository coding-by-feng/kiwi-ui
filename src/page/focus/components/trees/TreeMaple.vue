<template>
  <svg :viewBox="viewBox" :style="svgStyle" class="tree-maple">
    <defs>
      <radialGradient :id="gradientId" cx="35%" cy="35%" r="65%">
        <stop offset="0%" :stop-color="lightenColor(color, 20)" />
        <stop offset="100%" :stop-color="color" />
      </radialGradient>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="32" cy="62" rx="20" ry="4" fill="rgba(0,0,0,0.15)"/>
    <!-- Trunk -->
    <path d="M28 38 L26 62 L38 62 L36 38 Z" fill="#5D4037"/>
    <path d="M29 40 L28 60 L31 60 L31 40" fill="rgba(255,255,255,0.1)"/>
    <!-- Branches -->
    <path d="M28 46 L16 38" stroke="#5D4037" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 46 L48 38" stroke="#5D4037" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Main crown - maple shape -->
    <path :d="mapleCrownPath" :fill="`url(#${gradientId})`"/>
    <!-- Left cluster -->
    <ellipse cx="14" cy="32" rx="12" ry="14" :fill="color" opacity="0.85"/>
    <!-- Right cluster -->
    <ellipse cx="50" cy="32" rx="12" ry="14" :fill="color" opacity="0.85"/>
    <!-- Top -->
    <ellipse cx="32" cy="12" rx="14" ry="12" :fill="lightenColor(color, 15)"/>
    <!-- Maple leaf details -->
    <path d="M32 8 L34 14 L40 12 L36 18 L42 22 L34 22 L32 28 L30 22 L22 22 L28 18 L24 12 L30 14 Z"
          :fill="lightenColor(color, 30)" opacity="0.4"/>
    <!-- Highlights -->
    <ellipse cx="24" cy="16" rx="6" ry="5" fill="rgba(255,255,255,0.15)"/>
    <ellipse cx="10" cy="28" rx="4" ry="5" fill="rgba(255,255,255,0.1)"/>
    <!-- Falling leaves -->
    <path d="M52 48 L54 50 L56 48 L54 52 Z" :fill="lightenColor(color, 10)" opacity="0.7"/>
    <path d="M8 52 L10 54 L12 52 L10 56 Z" :fill="color" opacity="0.6"/>
  </svg>
</template>

<script>
export default {
  name: 'TreeMaple',
  props: {
    color: { type: String, default: '#FF5722' },
    size: { type: Number, default: 80 }
  },
  computed: {
    viewBox() { return '0 0 64 64' },
    svgStyle() { return { width: this.size + 'px', height: this.size + 'px' } },
    gradientId() { return 'maple-grad-' + this._uid },
    mapleCrownPath() {
      return 'M32 6 Q42 10 48 20 Q56 28 52 38 Q48 32 40 36 Q44 44 38 48 L32 42 L26 48 Q20 44 24 36 Q16 32 12 38 Q8 28 16 20 Q22 10 32 6 Z'
    }
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
.tree-maple {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
