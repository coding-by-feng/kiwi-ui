import Index from '@/page/index/Index'
import IndexLazy from '@/page/index/IndexLazy'
import Search from '@/page/word/Search'
import Detail from '@/page/word/Detail'
import StarList from '@/page/word/StarList'
import GrammarListener from '@/page/word/GrammarListener'
import UserLogin from '@/page/login/UserLogin'
import UserCenter from '@/page/user/UserCenter'
import About from '@/page/about/Index'
import Bgm from '@/page/bgm/Index'
import AiResponseDetail from '@/page/ai/AiResponseDetail.vue'
import AiCallHistory from '@/page/ai/AiCallHistory.vue' // Import the new AI call history component
import Youtube from '@/page/ai/Youtube.vue'
import YoutubePlayer from "@/page/ai/YoutubePlayer.vue"; // Import the new component


export default [{
    path: '/',
    name: '主页',
    redirect: '/index/vocabulary/detail'
}, {
    path: '/lazy',
    name: '懒加载',
    redirect: '/lazy/vocabulary/detail'
}, {
    path: '/index',
    component: Index,
    query: {active: 'search'},
    children: [{
        path: 'vocabulary',
        components: {
            search: Search,
            starList: StarList,
            grammarListener: GrammarListener,
            userLogin: UserLogin,
            userCenter: UserCenter,
            about: About,
            bgm: Bgm,
            aiResponseDetail: AiResponseDetail,
            aiCallHistory: AiCallHistory, // Add the AI call history component
            youtube: Youtube,// Use the new component here
            youtubePlayer: YoutubePlayer// Use the new component here
        },
        children: [{
            path: 'detail',
            components: {detail: Detail}
        }, {
            path: 'aiResponseDetail',
            components: {aiResponseDetail: AiResponseDetail}
        }, {
            path: 'aiCallHistory',
            components: {aiCallHistory: AiCallHistory} // Add the AI call history route
        }]
    }]
}, {
    path: '/lazy',
    component: IndexLazy,
    query: {active: 'search'},
    children: [{
        path: 'vocabulary',
        components: {
            search: Search
        },
        children: [{
            path: 'detail',
            components: {detail: Detail}
        }]
    }]
}]