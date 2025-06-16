import request from '@/router/axios'

/**
 * Google OAuth API methods
 */
const googleApi = {
    /**
     * Get Google OAuth authorization URL
     * @param {string} state - CSRF protection state parameter
     * @returns {Promise} Authorization URL response
     */
    getAuthorizationUrl(state = null) {
        return request({
            url: '/auth/oauth/google/authorize',
            method: 'get',
            params: { state }
        })
    },

    /**
     * Login with Google access token
     * @param {string} accessToken - Google access token
     * @returns {Promise} Login response with system tokens
     */
    loginWithGoogleToken(accessToken) {
        return request({
            url: '/auth/oauth/google/login',
            method: 'post',
            data: { accessToken }
        })
    },

    /**
     * Refresh Google access token
     * @param {string} refreshToken - Google refresh token
     * @returns {Promise} New token response
     */
    refreshGoogleToken(refreshToken) {
        return request({
            url: '/auth/oauth/google/refresh',
            method: 'post',
            data: { refreshToken }
        })
    },

    /**
     * Create or update user from Google OAuth
     * @param {Object} googleUserInfo - Google user information
     * @returns {Promise} User creation/update response
     */
    createOrUpdateGoogleUser(googleUserInfo) {
        return request({
            url: '/admin/sys/user/google/createOrUpdate',
            method: 'post',
            data: googleUserInfo
        })
    },

    /**
     * Link Google account to existing user
     * @param {Object} linkData - Link data containing user credentials and Google info
     * @returns {Promise} Link response
     */
    linkGoogleAccount(linkData) {
        return request({
            url: '/admin/sys/user/google/link',
            method: 'post',
            data: linkData
        })
    },

    /**
     * Unlink Google account from user
     * @param {number} userId - User ID
     * @returns {Promise} Unlink response
     */
    unlinkGoogleAccount(userId) {
        return request({
            url: `/admin/sys/user/google/unlink/${userId}`,
            method: 'post'
        })
    }
}

/**
 * Google Sign-In utility class
 */
class GoogleSignInManager {
    constructor() {
        this.authInstance = null
        this.isInitialized = false
    }

    /**
     * Initialize Google Sign-In
     * @param {string} clientId - Google OAuth client ID
     * @returns {Promise} Initialization promise
     */
    async init(clientId) {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                resolve(this.authInstance)
                return
            }

            if (!window.gapi) {
                reject(new Error('Google API not loaded'))
                return
            }

            window.gapi.load('auth2', async () => {
                try {
                    this.authInstance = await window.gapi.auth2.init({
                        client_id: clientId,
                        scope: 'openid profile email'
                    })
                    this.isInitialized = true
                    resolve(this.authInstance)
                } catch (error) {
                    reject(error)
                }
            })
        })
    }

    /**
     * Sign in with Google
     * @returns {Promise} Google user object
     */
    async signIn() {
        if (!this.isInitialized || !this.authInstance) {
            throw new Error('Google Sign-In not initialized')
        }

        try {
            const googleUser = await this.authInstance.signIn()
            return this.extractUserInfo(googleUser)
        } catch (error) {
            if (error.error === 'popup_closed_by_user') {
                throw new Error('登录已取消')
            }
            throw new Error('Google登录失败：' + error.error)
        }
    }

    /**
     * Sign out from Google
     * @returns {Promise} Sign out promise
     */
    async signOut() {
        if (this.authInstance) {
            await this.authInstance.signOut()
        }
    }

    /**
     * Extract user information from Google user object
     * @param {Object} googleUser - Google user object
     * @returns {Object} Extracted user information
     */
    extractUserInfo(googleUser) {
        const profile = googleUser.getBasicProfile()
        const authResponse = googleUser.getAuthResponse()

        return {
            googleId: profile.getId(),
            email: profile.getEmail(),
            name: profile.getName(),
            picture: profile.getImageUrl(),
            givenName: profile.getGivenName(),
            familyName: profile.getFamilyName(),
            accessToken: authResponse.access_token,
            idToken: authResponse.id_token,
            expiresAt: authResponse.expires_at
        }
    }

    /**
     * Check if user is signed in
     * @returns {boolean} Sign in status
     */
    isSignedIn() {
        return this.authInstance && this.authInstance.isSignedIn.get()
    }

    /**
     * Get current signed in user
     * @returns {Object|null} Current user info or null
     */
    getCurrentUser() {
        if (this.isSignedIn()) {
            const googleUser = this.authInstance.currentUser.get()
            return this.extractUserInfo(googleUser)
        }
        return null
    }
}

/**
 * Google OAuth integration utilities
 */
const googleOAuthUtils = {
    /**
     * Load Google API script
     * @returns {Promise} Load promise
     */
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve()
                return
            }

            const script = document.createElement('script')
            script.src = 'https://apis.google.com/js/api.js'
            script.onload = resolve
            script.onerror = () => reject(new Error('Failed to load Google API'))
            document.head.appendChild(script)
        })
    },

    /**
     * Generate state parameter for CSRF protection
     * @returns {string} Random state string
     */
    generateState() {
        const array = new Uint32Array(1)
        window.crypto.getRandomValues(array)
        return array[0].toString(36)
    },

    /**
     * Store authentication tokens
     * @param {Object} tokenData - Token data from backend
     */
    storeTokens(tokenData) {
        if (tokenData.accessToken) {
            localStorage.setItem('access_token', tokenData.accessToken)
        }
        if (tokenData.refreshToken) {
            localStorage.setItem('refresh_token', tokenData.refreshToken)
        }
        if (tokenData.userInfo) {
            localStorage.setItem('user_info', JSON.stringify(tokenData.userInfo))
        }
        // Store token expiration
        if (tokenData.expiresIn) {
            const expiresAt = Date.now() + (tokenData.expiresIn * 1000)
            localStorage.setItem('token_expires_at', expiresAt.toString())
        }
    },

    /**
     * Clear stored tokens
     */
    clearTokens() {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('token_expires_at')
    },

    /**
     * Check if tokens are expired
     * @returns {boolean} Token expiration status
     */
    isTokenExpired() {
        const expiresAt = localStorage.getItem('token_expires_at')
        if (!expiresAt) return true
        return Date.now() > parseInt(expiresAt)
    },

    /**
     * Get stored user info
     * @returns {Object|null} User info or null
     */
    getStoredUserInfo() {
        try {
            const userInfo = localStorage.getItem('user_info')
            return userInfo ? JSON.parse(userInfo) : null
        } catch (error) {
            console.error('Error parsing stored user info:', error)
            return null
        }
    }
}

// Export for use in Vue components
export {
    googleApi,
    GoogleSignInManager,
    googleOAuthUtils
}

// Default export
export default {
    ...googleApi,
    GoogleSignInManager,
    utils: googleOAuthUtils
}