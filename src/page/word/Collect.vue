<template>
  <div class="collect-container">
    <KiwiDialog
        :title="$t('collections.selectList')"
        :visible="listSelectDialogVisible"
        width="400px"
        center
        @update:visible="val => $emit('update:listSelectDialogVisible', val)"
        @close="listSelectDialogHandleClose">
      <div class="list-container">
        <div v-for="item in starListData" :key="item.id" class="list-item">
          <KiwiButton
            type="primary"
            class="list-name-button"
            style="width: 100%; justify-content: center;"
            @click="selectOneWordList(item.id)">
            {{ item.listName }}
          </KiwiButton>
        </div>
      </div>
    </KiwiDialog>
  </div>
</template>

<script>
import wordStarList from '@/api/wordStarList'
import KiwiDialog from '@/components/ui/KiwiDialog'
import KiwiButton from '@/components/ui/KiwiButton'

export default {
  name: 'Collect',
  components: { KiwiDialog, KiwiButton },
  props: {
    id: [String, Number],
    listSelectDialogVisible: [Boolean],
    type: [String],
    starListData: Array,
  },
  data () {
    return {
      wordIsCollect: false
    }
  },
  methods: {
    ...wordStarList,
    listSelectDialogHandleClose () {
      this.$emit('update:listSelectDialogVisible', false)
    }
  }
}
</script>

<style scoped>
/* .collect-container {
   reserved for future layout-specific spacing
} */

.list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.list-item {
  width: 100%;
}

/* Consistent list button style */
.list-name-button {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: var(--color-white) !important;
  border-radius: 6px !important;
  height: 40px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.list-name-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  opacity: 0.9;
}
</style>