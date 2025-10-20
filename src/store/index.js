import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import common from "./modules/common";
import tags from "./modules/tags";
import getters from "./getters";
import todo from './modules/todo'

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        user,
        common,
        tags,
        todo
    },
    getters
})

export default store
