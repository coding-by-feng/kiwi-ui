// src/util/oauth.js - Enhanced OAuth utility for mobile compatibility
import {getStore, setStore} from '@/util/store'
import {Message} from 'element-ui'

// Flag to prevent multiple OAuth processing
let isProcessingOAuth = false

// Detect if running on mobile Safari
const isMobileSafari = () => {
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)
}

export const handleGoogleOAuthCallback = () => {
    // Prevent multiple processing
    if (isProcessingOAuth) {
        console.log('OAuth callback already being processed, skipping...')
        return false
    }

    console.log(' [OAUTH] Starting OAuth callback processing')
    console.log(' [OAUTH] Current URL:', window.location.href)
    console.log(' [OAUTH] Mobile Safari:', isMobileSafari())

    const urlParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash

    console.log(' [OAUTH] URL search params:', window.location.search)
    console.log(' [OAUTH] URL hash:', hash)

    // Extract parameters from both query string and hash
    let token = urlParams.get('token')
    let user = urlParams.get('user')
    let error = urlParams.get('error')

    // Also check hash parameters (in case URL has # before ?)
    if (hash && hash.includes('?')) {
        try {
            const hashQueryString = hash.split('?')[1]
            console.log(' [OAUTH] Hash query string:', hashQueryString)

            const hashParams = new URLSearchParams(hashQueryString)
            token = token || hashParams.get('token')
            user = user || hashParams.get('user')
            error = error || hashParams.get('error')

            console.log(' [OAUTH] Extracted from hash - token:', !!token, 'user:', user, 'error:', error)
        } catch (e) {
            console.error(' [OAUTH] Error parsing hash parameters:', e)
        }
    }

    if (error) {
        console.error(' [OAUTH] Google OAuth error:', error)
        Message({
            message: `Login failed: ${error}`,
            type: 'error',
            center: true,
            showClose: true,
            duration: 5000
        })
        return false
    }

    if (token && user) {
        console.log(' [OAUTH] OAuth parameters found - token:', !!token, 'user:', user)

        // Set processing flag
        isProcessingOAuth = true

        try {
            // Check if already logged in to prevent duplicate processing
            const existingToken = getStore({name: 'access_token'})
            if (existingToken === token) {
                console.log(' [OAUTH] Token already processed, skipping...')
                isProcessingOAuth = false
                return true
            }

            console.log(' [OAUTH] Storing authentication data')

            // Store the token using your existing store utility
            setStore({
                name: 'access_token',
                content: token,
                type: 'local'
            })

            // Store user info with proper decoding
            const decodedUser = decodeURIComponent(user.replace(/\+/g, ' '))
            setStore({
                name: 'user_name',
                content: decodedUser,
                type: 'local'
            })

            // Set a long expiration time for Google OAuth tokens (typically 1 hour)
            const expirationTime = Date.now() + (60 * 60 * 1000) // 1 hour
            setStore({
                name: 'expires_in',
                content: expirationTime,
                type: 'local'
            })

            console.log(' [OAUTH] Redirecting to home after successful login')

            // For other browsers, use immediate redirect
            window.location.href = window.location.origin + window.location.pathname

            console.log(' [OAUTH] Showing success message')
            Message({
                message: `Welcome back, ${decodedUser}!`,
                type: 'success',
                center: true,
                duration: 3000
            })

            // Reset processing flag after a delay
            setTimeout(() => {
                isProcessingOAuth = false
                console.log(' [OAUTH] Processing flag reset')
            }, 2000)

            return true

        } catch (error) {
            console.error(' [OAUTH] Error during OAuth processing:', error)
            isProcessingOAuth = false

            Message({
                message: 'Login processing failed. Please try again.',
                type: 'error',
                center: true,
                duration: 5000
            })

            return false
        }
    }

    console.log(' [OAUTH] No OAuth parameters found')
    return false
}