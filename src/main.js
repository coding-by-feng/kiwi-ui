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
import '@/permission' // 权限
import VueTouch from 'vue-touch'

// Import i18n
import {i18n, setLanguage} from '@/i18n'

Vue.config.devtools = true

// iOS Safari specific error handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOS) {
    // Capture iOS-specific errors
    window.addEventListener('error', (e) => {
        console.error('iOS Error:', e.error?.message || e.message, e.filename, e.lineno);
        // Send error info to your server for debugging
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/log-error', JSON.stringify({
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

// Configure ElementUI with i18n
Vue.use(ElementUI, {
    size: 'medium',
    menuType: 'text',
    i18n: (key, value) => i18n.t(key, value)
})

Vue.config.productionTip = false

Object.keys(urls).forEach(key => {
    Vue.prototype[key] = urls[key]
})

// Add global method for language switching
Vue.prototype.$setLanguage = setLanguage

// iOS Safari memory management
if (isIOS) {
    // Force garbage collection periodically
    setInterval(() => {
        if (window.gc) window.gc();
    }, 30000);
}

const vueInstance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
    mounted() {
        // Clear loading screen when Vue is ready
        setTimeout(() => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    const appDiv = document.getElementById('app');
                    if (appDiv && appDiv.children.length > 1) {
                        // Remove loading content
                        appDiv.removeChild(appDiv.firstChild);
                    }
                }, 500);
            }
        }, 100);

        if (isIOS) {
            console.log('✅ Vue app mounted successfully on iOS');
        }
    },
    errorCaptured(err, vm, info) {
        console.error('Vue Error Captured:', err, info);
        if (isIOS) {
            // iOS-specific error handling
            this.$nextTick(() => {
                console.log('Attempting iOS error recovery...');
            });
        }
        return false; // Prevent the error from propagating
    }
});

vueInstance.$mount('#app')
