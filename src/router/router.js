import Vue from "vue";
import VueRouter from "vue-router";
import PageRouter from "./page";
import AvueRouter from './avue-router'
import Store from "../store";
import NProgress from 'nprogress' // progress bar

Vue.use(VueRouter);

let Router = new VueRouter({
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            if (from.meta.keepAlive) {
                from.meta.savedPosition = document.body.scrollTop
            }
            return {
                x: 0,
                y: to.meta.savedPosition || 0
            }
        }
    },
    routes: [].concat([])
})

AvueRouter.install(Router, Store)
Router.$avueRouter.formatRoutes(Store.state.user.menu, true)
Router.addRoutes([...PageRouter])

export default Router
