<template>
  <div class="planted-tree-3d" :style="containerStyle">
    <component :is="treeComponent" :color="color" :size="actualSize" />
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
  name: 'PlantedTree3D',
  components: {
    TreeOak,
    TreePine,
    TreeCherry,
    TreeMaple,
    TreeWillow,
    TreeSakura
  },
  props: {
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
      default: 1
    }
  },
  computed: {
    actualSize() {
      // Scale based on cell size (base ~40px)
      return Math.round(36 * this.size)
    },
    containerStyle() {
      return {
        transform: `scale(${this.size})`,
        transformOrigin: 'bottom center'
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
  }
}
</script>

<style scoped>
.planted-tree-3d {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: transform 0.3s ease;
}

.planted-tree-3d:hover {
  transform: scale(1.1) !important;
}
</style>
