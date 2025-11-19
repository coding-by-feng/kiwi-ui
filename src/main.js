import Vue from 'vue'
import axios from './router/axios'
import VueAxios from "vue-axios"
import App from './App.vue'
import ElementUI from "element-ui"
import 'element-ui/lib/theme-chalk/index.css'
import router from './router/router'
import store from './store'
import * as urls from "@/config/env"
import '@/styles/common.scss'
import '@/permission'
import VueTouch from 'vue-touch'
import {i18n, setLanguage} from '@/i18n'
import kiwiConsts from '@/const/kiwiConsts'
import messageCenter from '@/util/msg'

Vue.config.devtools = true

// iOS Safari specific error handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    window.addEventListener('error', (e) => {
        console.error('iOS Error:', e.error?.message || e.message, e.filename, e.lineno);
        if (navigator.sendBeacon) {
            navigator.sendBeacon(kiwiConsts.API_BASE.LOG_ERROR, JSON.stringify({
                error: e.error?.message || e.message,
                file: e.filename,
                line: e.lineno,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }));
        }
    });
    window.addEventListener('unhandledrejection', (e) => {
        console.error('iOS Promise Rejection:', e.reason);
    });
}

Vue.use(VueAxios, axios)
Vue.use(VueTouch, {name: 'v-touch'})
Vue.use(ElementUI, {
    size: 'medium',
    menuType: 'text',
    i18n: (key, value) => i18n.t(key, value)
})

const wrappedMessage = (payload, overrides) => messageCenter.toast(payload, overrides)
wrappedMessage.success = (payload, overrides) => messageCenter.success(payload, overrides)
wrappedMessage.warning = (payload, overrides) => messageCenter.warning(payload, overrides)
wrappedMessage.info = (payload, overrides) => messageCenter.info(payload, overrides)
wrappedMessage.error = (payload, overrides) => messageCenter.error(payload, overrides)
wrappedMessage.closeAll = () => messageCenter.closeMessages()

const wrappedNotify = (payload, overrides) => messageCenter.popup(payload, overrides)
wrappedNotify.success = (payload, overrides) => messageCenter.popupSuccess(payload, overrides)
wrappedNotify.warning = (payload, overrides) => messageCenter.popupWarning(payload, overrides)
wrappedNotify.info = (payload, overrides) => messageCenter.popupInfo(payload, overrides)
wrappedNotify.error = (payload, overrides) => messageCenter.popupError(payload, overrides)
wrappedNotify.closeAll = () => messageCenter.closeNotifications()

Vue.prototype.$message = wrappedMessage
Vue.prototype.$notify = wrappedNotify
// Keep $notify in case components use it (suppress warning by referencing once)
if (!Vue.prototype.$notify) { console.log('Notify initialized') }
Vue.config.productionTip = false
Object.keys(urls).forEach(key => { Vue.prototype[key] = urls[key] })
Vue.prototype.$setLanguage = setLanguage
if (!Vue.prototype.$setLanguage) { /* reference to avoid tree-shake */ }

if (isIOS) {
    setInterval(() => { if (window.gc) window.gc(); }, 30000);
}

const vueInstance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
    mounted() {
        setTimeout(() => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    const appDiv = document.getElementById('app');
                    if (appDiv && appDiv.children.length > 1) {
                        appDiv.removeChild(appDiv.firstChild);
                    }
                }, 500);
            }
        }, 100);
        if (isIOS) console.log('✅ Vue app mounted successfully on iOS');
    },
    beforeDestroy() {
    },
    errorCaptured(err, vm, info) {
        console.error('Vue Error Captured:', err, info);
        if (isIOS) {
            this.$nextTick(() => { console.log('Attempting iOS error recovery...'); });
        }
        return false;
    }
});

vueInstance.$mount('#app')
