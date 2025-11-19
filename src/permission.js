import router from '@/router/router'
import {getStore} from '@/util/store'
import website from '@/const/website'
import kiwiConsts from '@/const/kiwiConsts'

function redirectToLogin() {
  try {
    const target = `${kiwiConsts.ROUTES.DETAIL}?active=login`
    // Prefer router navigation to avoid full reload
    router.push(target).catch(() => {})
  } catch (e) {
    try { window.location.href = `/#${kiwiConsts.ROUTES.DETAIL}?active=login` } catch (_) {}
  }
}

// Single consolidated router guard to prevent conflicts
router.beforeEach((to, from, next) => {
  // First check if route exists to prevent navigation to non-existent routes
  if (to.matched.length === 0) {
    console.error('Route does not exist:', to.path)
    next(new Error('This route does not exist'))
    return
  }

  // Whitelist search tool routes to avoid login loops
  const path = to.path || ''
  const isToolRoute = path.startsWith(kiwiConsts.ROUTE_PREFIX.TOOLS) || path.startsWith(kiwiConsts.ROUTE_PREFIX.TOOLS_LAZY)
  const toolWhitelist = [
    kiwiConsts.ROUTES.DETAIL,
    kiwiConsts.ROUTES.AI_RESPONSE_DETAIL,
    kiwiConsts.ROUTES.AI_CALL_HISTORY,
    kiwiConsts.ROUTES.YOUTUBE,
    kiwiConsts.ROUTES.PDF_READER
  ]
  if (isToolRoute && toolWhitelist.some(p => path.startsWith(p))) {
    next()
    return
  }

  // Get access token for authentication check
  let accessToken = getStore({ name: 'access_token' })
  const expiresIn = parseInt(getStore({ name: 'expires_in' }) || '0', 10)
  const tokenIssueAt = parseInt(getStore({ name: 'token_issue_at' }) || '0', 10)
  let isExpired = false
  try {
    if (accessToken && expiresIn > 0 && tokenIssueAt > 0) {
      const safetyWindowMs = 5000
      const expiryMs = tokenIssueAt + (expiresIn * 1000) - safetyWindowMs
      if (Date.now() >= expiryMs) {
        isExpired = true
      }
    }
  } catch (e) { /* ignore */ }

  if ((!accessToken || isExpired)) {
    if (isExpired) {
      console.warn('Token detected as expired in navigation guard; redirecting to login.')
    }
    if (to.path !== website.noAuthPath?.detail) {
      if (website.auth?.path && website.auth.path.indexOf(to.path) < 0) {
        if (website.auth?.login && to.path !== website.auth.login) {
          console.log('Redirecting to login:', website.auth.login)
          redirectToLogin()
          return
        }
      }
    }
  }

  // Allow navigation
  next()
})
