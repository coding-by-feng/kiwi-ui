import {setStore, getStore, removeStore} from "@/util/store";
import website from "@/const/website";

const common = {
    state: {
        isCollapse: false,
        isFullScreen: false,
        isShade: false,
        screen: -1,
        isLock: getStore({ name: 'isLock' }) || false,
        showTag: true,
        showCollapse: true,
        showFullScren: true,
        website: website
    },
    actions: {},
    mutations:{
        clearLock:(state) => {
            state.isLock = false;
            state.lockPasswd = ''
            removeStore({
                name: 'lockPasswd'
            })
            removeStore({
                name: 'isLock'
            })
        }
    }
}
export default common

