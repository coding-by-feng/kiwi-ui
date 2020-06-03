import Search from '@/page/word/Search'
import Detail from '@/page/word/Detail'
import StarList from '@/page/word/StarList'
import UserLogin from '@/page/login/UserLogin'
import UserCenter from '@/page/user/UserCenter'
import About from '@/page/about/Index'

export default [{
  path: '/',
  name: '主页',
  redirect: '/index/vocabulary'
}, {
  path: '/index',
  component: $ => import('@/page/index/Index'),
  query: { active: 'search' },
  children: [{
    path: 'vocabulary',
    components: {
      search: Search,
      starList: StarList,
      userLogin: UserLogin,
      userCenter: UserCenter,
      about: About
    },
    children: [{
      path: 'detail',
      components: { detail: Detail }
    }]
  }]
}]

