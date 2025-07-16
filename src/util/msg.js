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
            title: that.$t('common.error'),
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

    notifySuccess: (that, title, msg, duration) => {
        if (enableMsgHint === kiwiConst.ENABLE_MSG_HINT.DISABLE) {
            return
        }

        that.$notify({
            title: title,
            message: msg ? msg : that.$t('messages.dataLoadException'), // Using a generic fallback message
            type: 'success',
            duration: duration ? duration : 3000,
            position: 'top-right'
        });
    },

    operateSuccess: that => {
        that.$message.success({
            duration: 2000,
            center: true,
            offset: 200,
            message: that.$t('messages.operationSuccess')
        })
    },

    // Additional utility methods for common message scenarios
    showLoginRequired: (that) => {
        that.$message.warning({
            duration: 3000,
            center: true,
            offset: 200,
            message: that.$t('messages.loginRequired')
        })
    },

    showSystemError: (that) => {
        that.$notify.error({
            title: that.$t('common.error'),
            message: that.$t('messages.systemError'),
            duration: 0
        });
    },

    showOperationTooFrequent: (that) => {
        that.$message.warning({
            duration: 3000,
            center: true,
            offset: 200,
            message: that.$t('messages.operationTooFrequent')
        })
    },

    showNoPermission: (that) => {
        that.$message.warning({
            duration: 3000,
            center: true,
            offset: 200,
            message: that.$t('messages.noPermission')
        })
    },

    showResourceNotFound: (that) => {
        that.$message.warning({
            duration: 3000,
            center: true,
            offset: 200,
            message: that.$t('messages.resourceNotFound')
        })
    },

    // Confirmation dialogs
    confirmDelete: (that, callback) => {
        that.$confirm(that.$t('messages.confirmDelete'), that.$t('collections.deleteOperation'), {
            confirmButtonText: that.$t('common.confirm'),
            cancelButtonText: that.$t('common.cancel'),
            type: 'warning'
        }).then(() => {
            callback && callback();
        }).catch(() => {
            // User cancelled
        });
    },

    confirmClear: (that, callback) => {
        that.$confirm(that.$t('messages.confirmClear'), that.$t('messages.clearOperation'), {
            confirmButtonText: that.$t('common.confirm'),
            cancelButtonText: that.$t('common.cancel'),
            type: 'warning'
        }).then(() => {
            callback && callback();
        }).catch(() => {
            // User cancelled
        });
    }

}