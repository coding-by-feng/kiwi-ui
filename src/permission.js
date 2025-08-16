// ROUTE PERMISSION GUARD - Authentication and Authorization Control
// This file manages access control for all routes in your application
// It runs BEFORE every route navigation to check permissions and authentication

import router from '@/router/router' // Vue Router instance for navigation control
import {getStore} from '@/util/store' // Utility to access stored authentication tokens
import website from '@/const/website' // Website configuration with auth paths

// SINGLE ROUTE GUARD - Centralized navigation control to prevent conflicts
// beforeEach runs before EVERY route change (including browser back/forward)
router.beforeEach((to, from, next) => {
  console.log('🛡️ Route Guard: Navigating from', from.path, 'to', to.path);

  // ROUTE EXISTENCE VALIDATION - Prevent navigation to undefined routes
  // This prevents errors when users manually type invalid URLs
  if (to.matched.length === 0) {
    console.error('❌ Route does not exist:', to.path)
    // Create Error object to trigger error handling in main.js
    next(new Error('This route does not exist'))
    return
  }

  // AUTHENTICATION TOKEN CHECK - Verify if user is logged in
  let accessToken = getStore({
    name: 'access_token'  // JWT token stored in localStorage/sessionStorage
  })

  console.log('🔑 Access token present:', !!accessToken);
  console.log('🎯 Target route:', to.path);
  console.log('🔐 Auth required:', website.auth?.path?.indexOf(to.path) >= 0);

  // UNAUTHENTICATED USER HANDLING - No valid access token found
  if (!accessToken) {
    // CHECK PUBLIC ROUTES - Some routes don't require authentication
    if (to.path !== website.noAuthPath?.detail) {

      // WHITELIST VERIFICATION - Check if route is in authentication whitelist
      // website.auth.path contains array of routes that require authentication
      if (website.auth?.path && website.auth.path.indexOf(to.path) < 0) {

        // REDIRECT TO LOGIN - Send unauthenticated users to login page
        if (website.auth?.login && to.path !== website.auth.login) {
          console.log('🔄 Redirecting unauthenticated user to login:', website.auth.login)

          // PRESERVE INTENDED DESTINATION - Add redirect parameter
          const redirectPath = website.auth.login + '?redirect=' + encodeURIComponent(to.fullPath);
          next({ path: redirectPath })
          return
        }
      }
    }
  } else {
    // AUTHENTICATED USER LOGIC - User has valid token
    console.log('✅ User authenticated, allowing navigation to:', to.path);

    // ROLE-BASED ACCESS CONTROL (if implemented)
    // const userRole = getStore({ name: 'user_role' });
    // if (to.meta.requiredRole && userRole !== to.meta.requiredRole) {
    //   console.log('❌ Insufficient permissions for:', to.path);
    //   next({ path: '/403' }); // Forbidden page
    //   return;
    // }
  }

  // ALLOW NAVIGATION - All checks passed, proceed to route
  console.log('✅ Route guard passed, proceeding to:', to.path);
  next()
})

// ADDITIONAL ROUTE HOOKS - For advanced navigation handling

// AFTER EACH - Runs after successful navigation (good for analytics)
router.afterEach((to, from) => {
  console.log('📍 Navigation completed:', from.path, '->', to.path);

  // ANALYTICS TRACKING - Log page views
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_TRACKING_ID', {
      page_path: to.path
    });
  }

  // PAGE TITLE UPDATES - Set document title based on route
  if (to.meta && to.meta.title) {
    document.title = to.meta.title + ' - Kason Tools';
  }
})

// ERROR HANDLER - Catches navigation errors
router.onError(error => {
  console.error('🚨 Router navigation error:', error);

  // CHUNK LOADING FAILURES - Common on slow networks
  if (error.message.includes('Loading chunk')) {
    console.log('🔄 Chunk loading failed, reloading page...');
    window.location.reload();
    return;
  }

  // ROUTE NOT FOUND ERRORS
  if (error.message.includes('does not exist')) {
    console.log('🔄 Redirecting to home due to invalid route');
    router.push('/').catch(() => {
      // Fallback if even home route fails
      window.location.href = '/';
    });
  }
})

// NAVIGATION GUARD FLOW EXPLANATION:
// 1. User clicks link or enters URL
// 2. beforeEach() executes with (to, from, next) parameters
// 3. Route existence check - prevents 404 errors
// 4. Authentication check - verifies access token
// 5. Authorization check - verifies permissions (if implemented)
// 6. next() called - allows navigation OR redirects
// 7. Route component loads
// 8. afterEach() executes for cleanup/tracking

// DEBUGGING ROUTE ISSUES:
// - Check browser console for route guard logs
// - Verify website.auth configuration in @/const/website
// - Check if access_token exists in browser storage
// - Test with Vue DevTools router tab
