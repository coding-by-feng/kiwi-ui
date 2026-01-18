import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import common from "./modules/common";
import tags from "./modules/tags";
import getters from "./getters";
import todo from './modules/todo'
import focus from './modules/focus'

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        user,
        common,
        tags,
        todo,
        focus
    },
    getters
})

export default store
