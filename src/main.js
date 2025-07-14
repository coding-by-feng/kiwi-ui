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

Vue.use(VueAxios, axios)
Vue.use(VueTouch, {name: 'v-touch'})

// Configure ElementUI with i18n
Vue.use(ElementUI, {
    size: 'medium',
    menuType: 'text',
    i18n: (key, value) => i18n.t(key, value)
})

Vue.use(router)

Vue.config.productionTip = false

Object.keys(urls).forEach(key => {
    Vue.prototype[key] = urls[key]
})

// Add global method for language switching
Vue.prototype.$setLanguage = setLanguage

new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
}).$mount('#app')