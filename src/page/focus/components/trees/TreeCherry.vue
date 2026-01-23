<template>
  <svg :viewBox="viewBox" :style="svgStyle" class="tree-cherry">
    <defs>
      <radialGradient :id="gradientId" cx="40%" cy="30%" r="60%">
        <stop offset="0%" :stop-color="lightenColor(color, 25)" />
        <stop offset="100%" :stop-color="color" />
      </radialGradient>
    </defs>
    <!-- Ground shadow -->
    <ellipse cx="32" cy="62" rx="18" ry="4" fill="rgba(0,0,0,0.15)"/>
    <!-- Trunk -->
    <path d="M28 40 L26 62 L38 62 L36 40 Q32 38 28 40" fill="#4E342E"/>
    <path d="M29 42 L28 60 L31 60 L31 42" fill="rgba(255,255,255,0.1)"/>
    <!-- Branch left -->
    <path d="M28 48 Q18 44 14 36" stroke="#4E342E" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Branch right -->
    <path d="M36 48 Q46 44 50 36" stroke="#4E342E" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Main crown with cherries -->
    <ellipse cx="32" cy="24" rx="20" ry="18" :fill="`url(#${gradientId})`"/>
    <!-- Side clusters -->
    <ellipse cx="14" cy="32" rx="10" ry="12" :fill="color" opacity="0.9"/>
    <ellipse cx="50" cy="32" rx="10" ry="12" :fill="color" opacity="0.9"/>
    <!-- Top cluster -->
    <ellipse cx="32" cy="12" rx="14" ry="10" :fill="lightenColor(color, 10)"/>
    <!-- Cherries -->
    <circle cx="18" cy="38" r="3" fill="#C62828"/>
    <circle cx="20" cy="42" r="3" fill="#E53935"/>
    <circle cx="46" cy="38" r="3" fill="#C62828"/>
    <circle cx="44" cy="42" r="3" fill="#E53935"/>
    <circle cx="32" cy="36" r="3" fill="#C62828"/>
    <circle cx="28" cy="34" r="2.5" fill="#E53935"/>
    <circle cx="36" cy="34" r="2.5" fill="#E53935"/>
    <!-- Cherry highlights -->
    <circle cx="17" cy="37" r="1" fill="rgba(255,255,255,0.4)"/>
    <circle cx="45" cy="37" r="1" fill="rgba(255,255,255,0.4)"/>
    <circle cx="31" cy="35" r="1" fill="rgba(255,255,255,0.4)"/>
    <!-- Leaf highlights -->
    <ellipse cx="24" cy="18" rx="6" ry="5" fill="rgba(255,255,255,0.15)"/>
  </svg>
</template>

<script>
export default {
  name: 'TreeCherry',
  props: {
    color: { type: String, default: '#E91E63' },
    size: { type: Number, default: 80 }
  },
  computed: {
    viewBox() { return '0 0 64 64' },
    svgStyle() { return { width: this.size + 'px', height: this.size + 'px' } },
    gradientId() { return 'cherry-grad-' + this._uid }
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
.tree-cherry {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
