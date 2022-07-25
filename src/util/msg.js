export default {

    msgWarning: (that, msg) => {
        that.$message.warning({
            duration: 2000,
            center: true,
            offset: 200,
            message: msg
        })
    },

    msgSuccess: (that, msg) => {
        that.$message.success({
            duration: 2000,
            center: true,
            offset: 200,
            message: msg
        })
    },

    operateSuccess: that => {
        this.msgSuccess(that, '操作成功')
    }

}