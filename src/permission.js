import router from '@/router/router'
import { getStore } from '@/util/store'
import website from '@/const/website'

router.beforeEach(((to, from, next) => {
  let accessToken = getStore({
    name: 'access_token'
  })
  console.log('to.path=' + to.path + ', from.path=' + from.path + ', accessToken=' + accessToken)
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
    console.log('exist to.path = ' + to.path)
    console.log('exist from.path = ' + from.path)
    next()
  } else {
    console.log(' this route does not exist to.path=' + to.path + ', from.path=' + from.path)
    next(new Error(' this route does not exist'))
  }
})
