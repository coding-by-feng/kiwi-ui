import {getStore} from '@/util/store'
import kiwiConst from '@/const/kiwiConsts'

const enableMsgHint = getStore({name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT})

export default {

    msgWarning: (that, msg) => {
        that.$message.warning({
            duration: 3000,
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

    msgSuccess: (that, msg, duration) => {
        that.$message.success({
            duration: duration ? duration : 3000,
            center: true,
            offset: 200,
            message: msg
        })
    },

    notifySuccess: (that, title, msg) => {
        if (enableMsgHint === kiwiConst.ENABLE_MSG_HINT.DISABLE) {
            return
        }

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