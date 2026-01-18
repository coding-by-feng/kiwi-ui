<template>
  <svg :viewBox="viewBox" :style="svgStyle" class="tree-sakura">
    <defs>
      <radialGradient :id="gradientId" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#FFEBEE" />
        <stop offset="50%" :stop-color="lightenColor(color, 20)" />
        <stop offset="100%" :stop-color="color" />
      </radialGradient>
      <filter :id="glowId">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="32" cy="62" rx="20" ry="4" fill="rgba(0,0,0,0.12)"/>
    <!-- Fallen petals -->
    <circle cx="12" cy="60" r="1.5" :fill="lightenColor(color, 30)" opacity="0.6"/>
    <circle cx="20" cy="61" r="1" :fill="color" opacity="0.5"/>
    <circle cx="48" cy="60" r="1.5" :fill="lightenColor(color, 20)" opacity="0.6"/>
    <circle cx="54" cy="61" r="1" :fill="color" opacity="0.5"/>
    <!-- Trunk - curved Japanese style -->
    <path d="M30 36 Q26 42 26 62 L38 62 Q38 42 34 36 Q32 34 30 36" fill="#5D4037"/>
    <path d="M31 38 Q28 44 28 60 L31 60 Q31 44 32 38" fill="rgba(255,255,255,0.1)"/>
    <!-- Branches -->
    <path d="M30 42 Q20 36 12 32" stroke="#5D4037" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M34 42 Q44 36 52 32" stroke="#5D4037" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M32 38 Q32 30 32 24" stroke="#5D4037" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Main blossom clusters -->
    <ellipse cx="32" cy="18" rx="16" ry="14" :fill="`url(#${gradientId})`" :filter="`url(#${glowId})`"/>
    <ellipse cx="12" cy="28" rx="12" ry="10" :fill="color" opacity="0.9"/>
    <ellipse cx="52" cy="28" rx="12" ry="10" :fill="color" opacity="0.9"/>
    <!-- Smaller clusters -->
    <ellipse cx="22" cy="14" rx="8" ry="7" :fill="lightenColor(color, 15)" opacity="0.85"/>
    <ellipse cx="42" cy="14" rx="8" ry="7" :fill="lightenColor(color, 15)" opacity="0.85"/>
    <!-- Individual blossoms (5-petal sakura flowers) -->
    <g :fill="lightenColor(color, 35)" opacity="0.9">
      <circle cx="32" cy="10" r="3"/>
      <circle cx="28" cy="8" r="2"/>
      <circle cx="36" cy="8" r="2"/>
      <circle cx="26" cy="12" r="2"/>
      <circle cx="38" cy="12" r="2"/>
    </g>
    <g :fill="lightenColor(color, 30)" opacity="0.85">
      <circle cx="8" cy="26" r="2.5"/>
      <circle cx="16" cy="24" r="2"/>
      <circle cx="12" cy="32" r="2"/>
      <circle cx="48" cy="24" r="2"/>
      <circle cx="56" cy="26" r="2.5"/>
      <circle cx="52" cy="32" r="2"/>
    </g>
    <!-- Flower centers -->
    <circle cx="32" cy="10" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="8" cy="26" r="0.8" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="56" cy="26" r="0.8" fill="#FFEB3B" opacity="0.8"/>
    <!-- Floating petals -->
    <circle cx="6" cy="44" r="1.2" :fill="lightenColor(color, 25)" opacity="0.7">
      <animate attributeName="cy" values="44;50;44" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="6;8;6" dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="58" cy="42" r="1" :fill="color" opacity="0.6">
      <animate attributeName="cy" values="42;52;42" dur="4s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="58;56;58" dur="4s" repeatCount="indefinite"/>
    </circle>
    <!-- Highlights -->
    <ellipse cx="26" cy="14" rx="5" ry="4" fill="rgba(255,255,255,0.2)"/>
  </svg>
</template>

<script>
export default {
  name: 'TreeSakura',
  props: {
    color: { type: String, default: '#F48FB1' },
    size: { type: Number, default: 80 }
  },
  computed: {
    viewBox() { return '0 0 64 64' },
    svgStyle() { return { width: this.size + 'px', height: this.size + 'px' } },
    gradientId() { return 'sakura-grad-' + this._uid },
    glowId() { return 'sakura-glow-' + this._uid }
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
.tree-sakura {
  filter: drop-shadow(0 4px 10px rgba(244, 143, 177, 0.3));
}
</style>
