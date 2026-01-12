import request from '@/router/axios'
import {getStore} from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

const scope = 'server'

/**
 * Login with username and password (new API)
 * POST /auth/login
 */
export const loginByUsernamePassword = (username, password) => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/login`,
        headers: {
            isToken: false,
            'Content-Type': 'application/json'
        },
        method: 'post',
        data: { username, password }
    })
}

/**
 * Legacy login with OAuth2 grant_type (for backward compatibility)
 */
export const loginByUsername = (username, password, code, randomStr) => {
    const grant_type = 'password'
    let encodedPassword = encodeURI(password);
    console.log('encodedPassword ' + encodedPassword)

    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/token`,
        headers: {
            isToken: false,
            'Authorization': 'Basic dm9jYWJ1bGFyeTplbmhhbmNlcg=='
        },
        method: 'post',
        params: {
            username, password, randomStr, code, grant_type, scope
        }
    })
}

/**
 * Register a new user account
 * POST /auth/register
 */
export const register = (userData) => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/register`,
        headers: {
            isToken: false,
            'Content-Type': 'application/json'
        },
        method: 'post',
        data: userData
    })
}

/**
 * Check username availability
 * GET /auth/check-username?username=xxx
 */
export const checkUsernameAvailability = (username) => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/check-username`,
        headers: { isToken: false },
        method: 'get',
        params: { username }
    })
}

/**
 * Check email availability
 * GET /auth/check-email?email=xxx
 */
export const checkEmailAvailability = (email) => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/check-email`,
        headers: { isToken: false },
        method: 'get',
        params: { email }
    })
}

/**
 * Get current user info
 * GET /auth/me
 */
export const getCurrentUser = () => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/me`,
        headers: { isToken: true },
        method: 'get'
    })
}

/**
 * Refresh token (new API)
 * POST /auth/refresh
 */
export const refreshTokenNew = (refreshToken) => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/refresh`,
        headers: {
            isToken: false,
            'Content-Type': 'application/json'
        },
        method: 'post',
        data: { refreshToken }
    })
}

/**
 * Legacy refresh token (OAuth2 style)
 */
export const refreshToken = () => {
    const grant_type = 'refresh_token'
    let refreshToken = getStore({name: 'refresh_token'})
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/token`,
        headers: {
            'isToken': false,
            'Authorization': 'Basic dm9jYWJ1bGFyeTplbmhhbmNlcg=='
        },
        method: 'post',
        params: {refresh_token: refreshToken, grant_type: grant_type, scope: scope}
    })
}

/**
 * Logout (new API)
 * POST /auth/logout
 */
export const logoutNew = () => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/logout`,
        headers: { isToken: true },
        method: 'post'
    })
}

/**
 * Legacy logout
 */
export const logout = $ => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/logout`,
        headers: {
            isToken: true
        },
        method: 'delete'
    })
}
