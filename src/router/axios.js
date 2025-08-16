// AXIOS HTTP CLIENT CONFIGURATION - Network layer for API communication
// This file configures the HTTP client with interceptors, error handling, and security features
// It handles: request/response processing, authentication, mixed content prevention, error messages

import {serialize} from '@/util/util' // Utility to serialize form data
import {getStore} from '@/util/store' // Function to get data from localStorage/sessionStorage
import NProgress from 'nprogress' // Loading progress bar at top of page
import responseCode from '@/const/responseCode' // HTTP status code mappings
import router from '@/router/router' // Vue Router instance for navigation
import {Message} from 'element-ui' // Element UI message component for user notifications
import 'nprogress/nprogress.css' // Styling for the progress bar
import store from '@/store' // Vuex store for state management
import axios from 'axios' // Main HTTP client library
import {baseUrl, isElectron} from '@/config/env' // Environment configuration

// AXIOS INSTANCE CREATION - Create dedicated instance with custom configuration
const service = axios.create({
    // API BASE URL CONFIGURATION - Different strategies for different environments
    // Production: Use environment variable or same-origin (prevents mixed content)
    // Development: Use localhost backend server
    baseURL: process.env.VUE_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:9991'),
    timeout: 15000  // 15 second timeout - prevents requests from hanging indefinitely
})

// MIXED CONTENT SECURITY CHECK - Critical for HTTPS deployments
// HTTPS pages cannot make HTTP requests due to browser security policies
if (typeof window !== 'undefined' && window.location &&
    window.location.protocol === 'https:' &&
    service.defaults.baseURL &&
    service.defaults.baseURL.startsWith('http:')) {
    console.warn('⚠️ Mixed content prevention: API baseURL changed to same-origin')
    service.defaults.baseURL = '' // Empty string forces same-origin requests
}

// GLOBAL AXIOS DEFAULTS - Configure default behavior for all axios instances
axios.defaults.timeout = 100000  // 100 second timeout for slow connections
// CUSTOM STATUS VALIDATION - Treat 200-500 as success (handle errors in response interceptor)
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status <= 500  // Don't throw errors for HTTP status codes
}

// CORS CONFIGURATION - Only for browser environments, not Electron
if (!isElectron) {
  // CREDENTIALS HANDLING - Send cookies and authorization headers with requests
  axios.defaults.withCredentials = true  // Important for session-based authentication
}

// ELECTRON-SPECIFIC CONFIGURATION - Direct API access for desktop app
if (isElectron && baseUrl) {
  axios.defaults.baseURL = baseUrl  // Use configured base URL for Electron
  console.log('Axios configured for Electron with baseURL:', baseUrl)
}

// PRODUCTION BASE URL CONFIGURATION - Environment-aware API endpoint setup
if (process.env.NODE_ENV === 'production') {
    // PRODUCTION STRATEGY - Prefer same-origin to avoid mixed content issues
    axios.defaults.baseURL = process.env.VUE_APP_API_URL || ''
} else {
    // DEVELOPMENT STRATEGY - Use explicit localhost URL for development proxy
    axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:9991'
}

// REPEATED MIXED CONTENT CHECK - Ensure no HTTP requests from HTTPS pages
if (typeof window !== 'undefined' && window.location &&
    window.location.protocol === 'https:' &&
    axios.defaults.baseURL &&
    axios.defaults.baseURL.startsWith('http:')) {
    console.warn('🔒 Preventing mixed content: API baseURL set to same-origin')
    axios.defaults.baseURL = ''
}

// NPROGRESS CONFIGURATION - Loading bar visual feedback
NProgress.configure({
  showSpinner: false  // Hide spinner, only show progress bar
})

// REQUEST INTERCEPTOR - Processes all outgoing requests
service.interceptors.request.use(config => {
  NProgress.start()  // Start loading bar animation

  // JWT TOKEN INJECTION - Add authentication token to requests
  let isToken = !!(config.headers || {}).isToken  // Check if token is required
  let token = getStore({ name: 'access_token' })   // Get JWT token from storage

  // AUTHORIZATION HEADER - Add Bearer token if available and required
  if (token && isToken) {
    config.headers['Authorization'] = 'Bearer ' + token  // Standard JWT format
  }

  // ELECTRON CORS HEADERS - Add headers for Electron environment
  if (isElectron) {
    config.headers['Content-Type'] = 'application/json'
    config.headers['Access-Control-Allow-Origin'] = '*'
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    config.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'

    // DEBUG LOGGING - Log full request URL for Electron debugging
    const fullUrl = config.baseURL ? config.baseURL + config.url : config.url
    console.log('Making request to:', fullUrl)
  }

  // FORM DATA SERIALIZATION - Convert object to form-encoded string
  if (config.methods === 'post' && config.headers.serialize) {
    config.data = serialize(config.data)  // Convert to application/x-www-form-urlencoded
    delete config.data.serialize          // Remove the serialize flag
  }

  // REQUEST-LEVEL MIXED CONTENT PREVENTION - Check individual request URLs
  if (typeof window !== 'undefined' && window.location &&
      window.location.protocol === 'https:' &&
      config.url && config.url.startsWith('http:')) {
      console.warn(`⚠️ Converting ${config.url} to same-origin to prevent mixed content`)
      config.url = config.url.replace(/^http:\/\/[^/]+/, '')  // Remove protocol and host
  }

  return config  // Return modified config
}, error => {
  NProgress.done()  // Stop progress bar on request error
  return Promise.reject(error)
})

// RESPONSE INTERCEPTOR - Processes all incoming responses
service.interceptors.response.use(res => {
  NProgress.done()  // Stop loading bar

  // STATUS CODE PROCESSING - Extract and interpret HTTP status
  const status = String(res.status) || '200'
  const message = responseCode[status] || responseCode['default'] || res.data.msg
  let refreshToken = getStore({ name: 'refresh_token' })

  // AUTHENTICATION HANDLING - Manage token refresh and logout
  if (responseCode.UNAUTHORIZED == status) {  // 401 Unauthorized
    if (refreshToken) {
      // AUTOMATIC TOKEN REFRESH - Try to refresh expired token
      store.dispatch('RefreshToken').then(() => {
        Message({
          message: responseCode['autoLoginSuccess'],
          type: 'success',
          center: true,
          showClose: true
        })
      })
    } else {
      // LOGOUT PROCESS - Clear session and redirect to login
      store.dispatch('LogOut').then(() => {
        if (isElectron) {
          // ELECTRON NAVIGATION - Use Vue Router for internal navigation
          router.push('/index/tools/detail?active=login')
        } else {
          // BROWSER NAVIGATION - Use window.location for full page redirect
          window.location.href = '/#/index/tools/detail?active=login'
        }
      })
    }
  }

  // ERROR STATUS HANDLING - Show user-friendly messages for HTTP errors
  if (status.indexOf('2') !== 0 || res.data.code === responseCode.ERROR) {
    // NOT 2XX STATUS - Show error message to user
    Message({
      message: message,
      type: 'error',
      center: true,
      showClose: true
    })
    return Promise.reject(new Error(message))  // Reject promise to trigger .catch()
  }

  return res  // Return response for successful requests
}, error => {
  NProgress.done()  // Stop progress bar

  // ERROR TYPE CLASSIFICATION - Handle different types of network errors
  if (error.message.includes('Network Error')) {
      console.error('Network Error - Possible CORS or mixed content issue')
      Message({
          message: 'Network connection error. Please check your internet connection.',
          type: 'error',
          duration: 5000
      })
  } else if (error.response) {
      // HTTP RESPONSE ERRORS - Server responded with error status
      console.error(`API Error ${error.response.status}:`, error.response.data)

      // STATUS CODE SPECIFIC HANDLING - Different messages for different HTTP codes
      switch (error.response.status) {
          case 401:  // Unauthorized
              Message({
                  message: 'Authentication failed. Please log in again.',
                  type: 'error',
                  duration: 5000
              })
              // Optional: Auto-redirect to login
              break
          case 403:  // Forbidden
              Message({
                  message: 'Access forbidden. You do not have permission for this action.',
                  type: 'error',
                  duration: 5000
              })
              break
          case 404:  // Not Found
              Message({
                  message: 'Resource not found.',
                  type: 'error',
                  duration: 5000
              })
              break
          case 500:  // Internal Server Error
              Message({
                  message: 'Server error. Please try again later.',
                  type: 'error',
                  duration: 5000
              })
              break
          default:   // Other HTTP errors
              Message({
                  message: error.response.data.message || 'Unknown error occurred',
                  type: 'error',
                  duration: 5000
              })
      }
  } else {
      // REQUEST SETUP ERRORS - Errors before request was sent
      Message({
          message: error.message || 'Error processing request',
          type: 'error',
          duration: 5000
      })
  }

  return Promise.reject(error)  // Always reject to maintain promise chain
})

// EXPORT CONFIGURED INSTANCE - This becomes the main HTTP client used throughout app
export default service

// USAGE EXAMPLES IN COMPONENTS:
// import axios from '@/router/axios'
//
// // Simple GET request
// axios.get('/api/users').then(response => { ... })
//
// // POST with authentication
// axios.post('/api/data', { key: 'value' }, {
//   headers: { isToken: true }
// }).then(response => { ... })
//
// // Automatic error handling via interceptors
// axios.get('/api/protected').catch(err => {
//   // Error message already shown to user via Message component
//   // Handle specific error logic here
// })
