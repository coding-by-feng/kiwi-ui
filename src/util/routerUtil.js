/**
 * Navigate to the provided target only if it differs from the current route.
 * Defaults to using router.replace to avoid polluting history. Falls back to
 * push if replace throws an unexpected error.
 *
 * @param {Vue['$router']} router - The vue-router instance used for navigation.
 * @param {Vue['$route']} currentRoute - The current route object.
 * @param {{ path: string, query?: Record<string, any> }} target - Target route.
 * @param {{ ignoreKeys?: string[] }} [options] - Optional comparison settings.
 * @returns {Promise<void>} A promise resolving once navigation completes.
 */
export function navigateIfChanged(router, currentRoute, target, { ignoreKeys = [] } = {}) {
  if (!router || !target) {
    return Promise.resolve()
  }

  const currentPath = currentRoute?.path || ''
  const currentQuery = { ...(currentRoute?.query || {}) }
  const targetPath = target.path || ''
  const targetQuery = { ...(target.query || {}) }

  ignoreKeys.forEach(key => {
    if (currentQuery[key] !== undefined) delete currentQuery[key]
    if (targetQuery[key] !== undefined) delete targetQuery[key]
  })

  const samePath = currentPath === targetPath
  let sameQuery = true
  const keys = new Set([...Object.keys(currentQuery), ...Object.keys(targetQuery)])
  for (const key of keys) {
    const currentValue = currentQuery[key]
    const targetValue = targetQuery[key]
    if (String(currentValue ?? '') !== String(targetValue ?? '')) {
      sameQuery = false
      break
    }
  }

  if (samePath && sameQuery) {
    return Promise.resolve()
  }

  return router.replace(target).catch(error => {
    if (error && error.name === 'NavigationDuplicated') {
      return Promise.resolve()
    }
    console.warn('[routerUtil] replace failed, falling back to push', error)
    return router.push(target)
  })
}

export default {
  navigateIfChanged
}
