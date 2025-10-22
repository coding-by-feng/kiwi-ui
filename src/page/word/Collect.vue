<template>
  <div class="collect-container">
    <el-dialog
        class="collect-dialog"
        :title="$t('collections.selectList')"
        :visible.sync="listSelectDialogVisible"
        width="30%"
        center
        :before-close="listSelectDialogHandleClose">
      <el-table
          :data="starListData"
          class="collect-table"
          style="width: 100%">
        <el-table-column
            width="180">
          <template slot-scope="scope">
            <div slot="reference" class="name-wrapper">
              <el-button type="info" class="list-name-button" @click="selectOneWordList(scope.row.id)">{{scope.row.listName}}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import wordStarList from '@/api/wordStarList'

export default {
  name: 'Collect',
  prop: {
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
  watch: {
    'listSelectDialogVisible' (newVal) {
      // console.log('listSelectDialogVisible' + this.listSelectDialogVisible)
    }
  },
  methods: {
    ...wordStarList,
    listSelectDialogHandleClose () {
      this.listSelectDialogVisible = false
      // console.log('listSelectDialogHandleClose')
    }
  }
}
</script>

<style scoped>
.collect-container {
  /* reserved for future layout-specific spacing */
}

/* Dialog aesthetics aligned with AiResponseDetail */
::v-deep .collect-dialog .el-dialog__header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  padding: 12px 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

::v-deep .collect-dialog .el-dialog__title {
  color: #fff;
  font-weight: 600;
}

::v-deep .collect-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #fff;
}

::v-deep .collect-dialog .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.collect-table {
  margin-top: 6px;
}

::v-deep .collect-table .el-table__body-wrapper {
  border-radius: 8px;
}

/* Consistent list button style */
::v-deep .list-name-button.el-button--info {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  color: #fff !important;
  border-radius: 6px !important;
}

@media (max-width: 768px) {
  ::v-deep .collect-dialog .el-dialog {
    width: 90% !important;
  }
}
</style>