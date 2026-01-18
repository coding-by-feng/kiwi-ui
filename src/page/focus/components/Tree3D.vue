<template>
  <div class="tree-3d-container" :style="containerStyle">
    <!-- Seed Stage -->
    <div v-if="stage === 'seed'" class="tree-stage seed">
      <svg viewBox="0 0 64 64" :style="{ width: actualSize + 'px', height: actualSize + 'px' }">
        <ellipse cx="32" cy="52" rx="16" ry="6" :fill="color" opacity="0.2"/>
        <ellipse cx="32" cy="44" rx="10" ry="8" :fill="color" opacity="0.4"/>
        <circle cx="32" cy="38" r="10" :fill="color"/>
        <ellipse cx="28" cy="36" rx="3" ry="4" fill="rgba(255,255,255,0.2)"/>
      </svg>
    </div>

    <!-- Sprout Stage -->
    <div v-else-if="stage === 'sprout'" class="tree-stage sprout">
      <svg viewBox="0 0 64 64" :style="{ width: actualSize + 'px', height: actualSize + 'px' }">
        <ellipse cx="32" cy="58" rx="14" ry="5" :fill="color" opacity="0.2"/>
        <!-- Stem -->
        <rect x="30" y="38" width="4" height="20" rx="2" :fill="darkenColor(color, 20)"/>
        <!-- Leaves -->
        <ellipse cx="32" cy="30" rx="12" ry="14" :fill="color"/>
        <ellipse cx="24" cy="34" rx="6" ry="8" :fill="lightenColor(color, 10)"/>
        <ellipse cx="40" cy="34" rx="6" ry="8" :fill="lightenColor(color, 10)"/>
        <!-- Highlight -->
        <ellipse cx="28" cy="26" rx="4" ry="5" fill="rgba(255,255,255,0.15)"/>
      </svg>
    </div>

    <!-- Growing Stage -->
    <div v-else-if="stage === 'growing'" class="tree-stage growing">
      <svg viewBox="0 0 64 64" :style="{ width: actualSize + 'px', height: actualSize + 'px' }">
        <ellipse cx="32" cy="60" rx="18" ry="5" :fill="color" opacity="0.2"/>
        <!-- Trunk -->
        <rect x="28" y="32" width="8" height="28" rx="3" :fill="'#8B4513'"/>
        <rect x="29" y="34" width="2" height="24" rx="1" fill="rgba(255,255,255,0.1)"/>
        <!-- Main Crown -->
        <ellipse cx="32" cy="24" rx="18" ry="20" :fill="color"/>
        <!-- Side branches -->
        <ellipse cx="18" cy="32" rx="10" ry="12" :fill="lightenColor(color, 5)"/>
        <ellipse cx="46" cy="32" rx="10" ry="12" :fill="lightenColor(color, 5)"/>
        <!-- Highlights -->
        <ellipse cx="26" cy="18" rx="6" ry="8" fill="rgba(255,255,255,0.1)"/>
        <ellipse cx="14" cy="28" rx="3" ry="4" fill="rgba(255,255,255,0.1)"/>
      </svg>
    </div>

    <!-- Full Tree Stage -->
    <div v-else class="tree-stage tree" :class="type">
      <component :is="treeComponent" :color="color" :size="actualSize" />
    </div>
  </div>
</template>

<script>
import TreeOak from './trees/TreeOak.vue'
import TreePine from './trees/TreePine.vue'
import TreeCherry from './trees/TreeCherry.vue'
import TreeMaple from './trees/TreeMaple.vue'
import TreeWillow from './trees/TreeWillow.vue'
import TreeSakura from './trees/TreeSakura.vue'

export default {
  name: 'Tree3D',
  components: {
    TreeOak,
    TreePine,
    TreeCherry,
    TreeMaple,
    TreeWillow,
    TreeSakura
  },
  props: {
    stage: {
      type: String,
      default: 'seed',
      validator: v => ['seed', 'sprout', 'growing', 'tree'].includes(v)
    },
    type: {
      type: String,
      default: 'oak'
    },
    color: {
      type: String,
      default: '#4CAF50'
    },
    size: {
      type: Number,
      default: 80
    }
  },
  computed: {
    actualSize() {
      return this.size
    },
    containerStyle() {
      return {
        width: this.actualSize + 'px',
        height: this.actualSize + 'px'
      }
    },
    treeComponent() {
      const components = {
        oak: 'TreeOak',
        pine: 'TreePine',
        cherry: 'TreeCherry',
        maple: 'TreeMaple',
        willow: 'TreeWillow',
        sakura: 'TreeSakura'
      }
      return components[this.type] || 'TreeOak'
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
.tree-3d-container {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
}

.tree-stage {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-stage svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transition: all 0.3s ease;
}

.seed svg {
  animation: seed-bounce 2s ease-in-out infinite;
}

@keyframes seed-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.sprout svg {
  animation: sprout-sway 3s ease-in-out infinite;
}

@keyframes sprout-sway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(2deg); }
  75% { transform: rotate(-2deg); }
}

.growing svg {
  animation: growing-sway 4s ease-in-out infinite;
}

@keyframes growing-sway {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(1deg) scale(1.02); }
  75% { transform: rotate(-1deg) scale(0.98); }
}

.tree svg {
  animation: tree-breathe 5s ease-in-out infinite;
}

@keyframes tree-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
</style>
