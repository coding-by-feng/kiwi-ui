export async function clearWebsiteData() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage && window.localStorage.clear()
  } catch (error) {
    console.warn('Failed to clear localStorage', error)
  }

  try {
    window.sessionStorage && window.sessionStorage.clear()
  } catch (error) {
    console.warn('Failed to clear sessionStorage', error)
  }

  if (typeof document !== 'undefined' && document.cookie) {
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
  }

  const clearIndexedDb = async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }

    if (typeof indexedDB.databases === 'function') {
      try {
        const databases = await indexedDB.databases()
        await Promise.all(databases.map(dbInfo => {
          if (!dbInfo || !dbInfo.name) {
            return Promise.resolve()
          }
          return new Promise(resolve => {
            const request = indexedDB.deleteDatabase(dbInfo.name)
            request.onsuccess = request.onerror = request.onblocked = () => resolve()
          })
        }))
      } catch (error) {
        console.warn('Failed to enumerate indexedDB databases', error)
      }
    }
  }

  const clearCaches = () => {
    if (typeof caches === 'undefined') {
      return Promise.resolve()
    }
    return caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).catch(error => {
      console.warn('Failed to clear Cache API storage', error)
    })
  }

  const tasks = [clearIndexedDb(), clearCaches()]
  await Promise.all(tasks)

  if (typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({ action: 'clearCache' })
    } catch (error) {
      console.warn('Failed to notify service worker to clear cache', error)
    }
  }
}

export default clearWebsiteData
