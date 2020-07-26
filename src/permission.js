import router from '@/router/router'
import { getStore } from '@/util/store'
import website from '@/const/website'

router.beforeEach(((to, from, next) => {
  let accessToken = getStore({
    name: 'access_token'
  })
  if (!accessToken) {
    if (to.path !== website.noAuthPath.detail) {
      if (website.auth.path.indexOf(to.path) < 0) {
        next({ path: website.auth.login })
        return
      }
    }
  }
  next()
}))

router.beforeEach((to, from, next) => {
  if (to.matched.length > 0) {
    next()
  } else {
    next(new Error(' this route does not exist'))
  }
})
