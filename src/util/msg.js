export default {

    msgWarning: (that, msg) => {
        that.$message.warning({
            duration: 2500,
            center: true,
            offset: 200,
            message: msg
        })
    },

    msgError: (that, msg) => {
        that.$message.error({
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
        that.$message.success({
            duration: 2000,
            center: true,
            offset: 200,
            message: '操作成功'
        })
    }

}