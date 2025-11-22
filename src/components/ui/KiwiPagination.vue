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
  padding: 2px 5px;
  color: var(--text-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  &__total {
    margin-right: 10px;
    font-weight: 400;
    color: var(--text-regular);
  }

  &__btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 13px;
    min-width: 35.5px;
    height: 28px;
    line-height: 28px;
    color: var(--text-primary);
    
    &:disabled {
      color: var(--text-placeholder);
      cursor: not-allowed;
    }
    
    &:hover:not(:disabled) {
      color: var(--color-primary);
    }
  }

  &__pager {
    user-select: none;
    list-style: none;
    display: inline-block;
    vertical-align: top;
    font-size: 0;
    padding: 0;
    margin: 0;

    li {
      padding: 0 4px;
      background: var(--bg-card);
      vertical-align: top;
      display: inline-block;
      font-size: 13px;
      min-width: 35.5px;
      height: 28px;
      line-height: 28px;
      cursor: pointer;
      box-sizing: border-box;
      text-align: center;
      margin: 0 5px;
      border-radius: 2px;
      color: var(--text-primary);
      
      &.active {
        color: var(--color-primary);
        cursor: default;
      }
      
      &:hover:not(.active) {
        color: var(--color-primary);
      }
      
      &.more {
        background: transparent;
      }
    }
  }
}
</style>
