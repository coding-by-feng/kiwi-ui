// src/util/oauth.js - New utility for handling OAuth
import {setStore} from '@/util/store'
import {Message} from 'element-ui'

export const handleGoogleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash

    // Extract parameters from both query string and hash
    let token = urlParams.get('token')
    let user = urlParams.get('user')
    let error = urlParams.get('error')

    // Also check hash parameters (in case URL has # before ?)
    if (hash && hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.split('?')[1])
        token = token || hashParams.get('token')
        user = user || hashParams.get('user')
        error = error || hashParams.get('error')
    }

    if (error) {
        console.error('Google OAuth error:', error)
        Message({
            message: `Login failed: ${error}`,
            type: 'error',
            center: true,
            showClose: true
        })
        return false
    }

    if (token && user) {
        console.log('Google OAuth success:', { token, user })

        // Store the token using your existing store utility
        setStore({
            name: 'access_token',
            content: token,
            type: 'local'
        })

        // Store user info
        setStore({
            name: 'user_name',
            content: decodeURIComponent(user),
            type: 'local'
        })

        // Set a long expiration time for Google OAuth tokens (typically 1 hour)
        const expirationTime = Date.now() + (60 * 60 * 1000) // 1 hour
        setStore({
            name: 'expires_in',
            content: expirationTime,
            type: 'local'
        })

        // Clean the URL
        const cleanUrl = window.location.origin + window.location.pathname + '#/index/vocabulary/detail?active=search'
        window.history.replaceState({}, document.title, cleanUrl)

        Message({
            message: `Welcome back, ${decodeURIComponent(user)}!`,
            type: 'success',
            center: true,
            duration: 3000
        })

        return true
    }

    return false
}