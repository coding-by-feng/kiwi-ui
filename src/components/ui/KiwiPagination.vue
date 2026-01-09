<template>
  <div class="kiwi-pagination" v-if="total > 0">
    <span class="kiwi-pagination__total">Total {{ total }}</span>
    
    <button 
      class="kiwi-pagination__btn" 
      :disabled="currentPage <= 1"
      @click="handleCurrentChange(currentPage - 1)"
    >
      <i class="el-icon-arrow-left"></i>
    </button>
    
    <ul class="kiwi-pagination__pager">
      <li 
        v-if="pageCount > 0" 
        class="number" 
        :class="{ active: currentPage === 1 }"
        @click="handleCurrentChange(1)"
      >1</li>
      
      <li v-if="showPrevMore" class="more btn-quickprev el-icon-more"></li>
      
      <li 
        v-for="pager in pagers" 
        :key="pager" 
        class="number"
        :class="{ active: currentPage === pager }"
        @click="handleCurrentChange(pager)"
      >{{ pager }}</li>
      
      <li v-if="showNextMore" class="more btn-quicknext el-icon-more"></li>
      
      <li 
        v-if="pageCount > 1" 
        class="number"
        :class="{ active: currentPage === pageCount }"
        @click="handleCurrentChange(pageCount)"
      >{{ pageCount }}</li>
    </ul>
    
    <button 
      class="kiwi-pagination__btn"
      :disabled="currentPage >= pageCount"
      @click="handleCurrentChange(currentPage + 1)"
    >
      <i class="el-icon-arrow-right"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'KiwiPagination',
  props: {
    total: {
      type: Number,
      default: 0
    },
    pageSize: {
      type: Number,
      default: 10
    },
    currentPage: {
      type: Number,
      default: 1
    },
    layout: String
  },
  computed: {
    pageCount() {
      return Math.ceil(this.total / this.pageSize)
    },
    pagers() {
      const pagerCount = 7
      const currentPage = this.currentPage
      const pageCount = this.pageCount
      
      let showPrevMore = false
      let showNextMore = false
      
      if (pageCount > pagerCount) {
        if (currentPage > pagerCount - 2) {
          showPrevMore = true
        }
        if (currentPage < pageCount - 2) {
          showNextMore = true
        }
      }
      
      const array = []
      if (showPrevMore && !showNextMore) {
        const startPage = pageCount - (pagerCount - 2)
        for (let i = startPage; i < pageCount; i++) {
          array.push(i)
        }
      } else if (!showPrevMore && showNextMore) {
        for (let i = 2; i < pagerCount; i++) {
          array.push(i)
        }
      } else if (showPrevMore && showNextMore) {
        const offset = Math.floor(pagerCount / 2) - 1
        for (let i = currentPage - offset; i <= currentPage + offset; i++) {
          array.push(i)
        }
      } else {
        for (let i = 2; i < pageCount; i++) {
          array.push(i)
        }
      }
      
      this.showPrevMore = showPrevMore
      this.showNextMore = showNextMore
      
      return array
    }
  },
  data() {
    return {
      showPrevMore: false,
      showNextMore: false
    }
  },
  methods: {
    handleCurrentChange(val) {
      if (val < 1 || val > this.pageCount) return
      this.$emit('current-change', val)
      this.$emit('update:currentPage', val)
    }
  }
}
</script>

<style lang="scss" scoped>
.kiwi-pagination {
  white-space: nowrap;
  padding: 8px 12px;
  color: var(--text-primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  background: var(--bg-container);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color-light);

  &__total {
    margin-right: 12px;
    font-weight: 500;
    font-size: 13px;
    color: var(--text-secondary);
    padding: 0 8px;
  }

  &__btn {
    background: var(--bg-card);
    border: 1px solid var(--border-color-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 14px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    transition: var(--transition-fast);

    &:disabled {
      color: var(--text-placeholder);
      cursor: not-allowed;
      opacity: 0.5;
      background: transparent;
      border-color: transparent;
    }

    &:hover:not(:disabled) {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }
  }

  &__pager {
    user-select: none;
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    margin: 0 4px;

    li {
      padding: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color-light);
      border-radius: var(--radius-md);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
      width: 32px;
      height: 32px;
      cursor: pointer;
      box-sizing: border-box;
      text-align: center;
      color: var(--text-primary);
      transition: var(--transition-fast);

      &:hover:not(.active):not(.more) {
        color: var(--color-primary);
        border-color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.1);
      }

      &.active {
        color: #fff;
        background: var(--gradient-primary);
        border-color: var(--color-primary);
        cursor: default;
        box-shadow: 0 0 12px rgba(var(--color-primary-rgb), 0.4);
      }

      &.more {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: default;
        width: 24px;
      }
    }
  }
}
</style>
