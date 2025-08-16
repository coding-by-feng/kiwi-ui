import router from '@/router/router'
import {getStore} from '@/util/store'
import website from '@/const/website'

// Single consolidated router guard to prevent conflicts
router.beforeEach((to, from, next) => {
  // First check if route exists to prevent navigation to non-existent routes
  if (to.matched.length === 0) {
    console.error('Route does not exist:', to.path)
    next(new Error('This route does not exist'))
    return
  }

  // Get access token for authentication check
  let accessToken = getStore({
    name: 'access_token'
  })

  // If no access token, handle authentication logic
  if (!accessToken) {
    // Check if trying to access a protected route
    if (to.path !== website.noAuthPath?.detail) {
      // Check if current path is in auth whitelist
      if (website.auth?.path && website.auth.path.indexOf(to.path) < 0) {
        // Redirect to login if not in whitelist
        if (website.auth?.login && to.path !== website.auth.login) {
          console.log('Redirecting to login:', website.auth.login)
          next({ path: website.auth.login })
          return
        }
      }
    }
  }

  // Allow navigation
  next()
})
