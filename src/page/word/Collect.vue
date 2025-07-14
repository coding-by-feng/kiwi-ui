<template>
  <div>
    <el-dialog
        :title="$t('collections.selectList')"
        :visible.sync="listSelectDialogVisible"
        width="30%"
        center
        :before-close="listSelectDialogHandleClose">
      <el-table
          :data="starListData"
          style="width: 100%">
        <el-table-column
            width="180">
          <template slot-scope="scope">
            <div slot="reference" class="name-wrapper">
              <el-button type="info" @click="selectOneWordList(scope.row.id)">{{scope.row.listName}}
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

</style>