// filepath: /src/util/auth.js
// # Stage 2: Nginx to serve static files
// Lightweight auth helpers to decide storage mode (API vs local cache)
import {getStore} from '@/util/store'

// Returns true if an access token is present in storage
export function isLoggedIn() {
  try {
    const token = getStore({ name: 'access_token' })
    return !!token
  } catch (_) {
    try {
      // Fallback check (unlikely needed because getStore prefixes keys)
      if (typeof localStorage !== 'undefined') {
        return !!localStorage.getItem('access_token')
      }
    } catch (_) {}
    return false
  }
}

// Returns 'api' when logged in (use server APIs), otherwise 'local' (use browser cache)
export function getStorageMode() {
  return isLoggedIn() ? 'api' : 'local'
}

