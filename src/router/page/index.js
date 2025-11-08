import Index from '@/page/index/Index'
import IndexLazy from '@/page/index/IndexLazy'
import Search from '@/page/word/Search'
import Detail from '@/page/word/Detail'
import StarList from '@/page/word/StarList'
import GrammarListener from '@/page/word/GrammarListener'
import UserLogin from '@/page/login/UserLogin'
import UserCenter from '@/page/user/UserCenter'
import About from '@/page/about/Index'
import AiResponseDetail from '@/page/ai/AiResponseDetail.vue'
import AiCallHistory from '@/page/ai/AiCallHistory.vue' // Import the new AI call history component
import Youtube from '@/page/ai/Youtube.vue'
import YoutubePlayer from "@/page/ai/YoutubePlayer.vue"; // Import the new component
import TodoView from '@/page/todo/TodoView.vue' // Import the TodoView component (moved)
import PdfReader from '@/page/pdf/PdfReader.vue'
import kiwiConsts from '@/const/kiwiConsts'

export default [{
    path: '/',
    name: '主页',
    redirect: kiwiConsts.ROUTES.DETAIL
}, {
    path: '/lazy',
    name: '懒加载',
    redirect: kiwiConsts.ROUTE_PREFIX.TOOLS_LAZY + 'detail'
}, {
    path: '/index',
    component: Index,
    query: {active: 'search'},
    children: [{
        path: 'tools',
        components: {
            search: Search,
            starList: StarList,
            grammarListener: GrammarListener,
            userLogin: UserLogin,
            userCenter: UserCenter,
            about: About,
            youtube: Youtube,// Use the new component here
            youtubePlayer: YoutubePlayer, // Use the new component here
            todo: TodoView, // Add the todo component
            aiHistory: AiCallHistory, // Expose AiCallHistory as a top-level named view for the Index tab
            pdfReader: PdfReader
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
        path: 'tools',
        components: {
            search: Search
        },
        children: [{
            path: 'detail',
            components: {detail: Detail}
        }]
    }]
}]