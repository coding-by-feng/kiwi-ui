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
        that.$notify.error({
            title: '错误提示',
            message: msg,
            duration: 0
        });
    },

    msgSuccess: (that, msg) => {
        that.$message.success({
            duration: 2000,
            center: true,
            offset: 200,
            message: msg
        })
    },

    notifySuccess: (that, title, msg) => {
        that.$notify({
            title: title,
            message: msg,
            type: 'success'
        });
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