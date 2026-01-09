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
        website: website,
        // API loading state management
        apiLoading: false,
        apiCancelCallback: null
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
        },
        setApiLoading:(state, { loading, cancelCallback }) => {
            state.apiLoading = loading;
            state.apiCancelCallback = cancelCallback || null;
        },
        cancelApiRequest:(state) => {
            if (state.apiCancelCallback && typeof state.apiCancelCallback === 'function') {
                try {
                    state.apiCancelCallback();
                } catch (e) {
                    console.warn('Error cancelling API request:', e);
                }
            }
            state.apiLoading = false;
            state.apiCancelCallback = null;
        }
    }
}
export default common

