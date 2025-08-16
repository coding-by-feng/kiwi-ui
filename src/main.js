// MAIN.JS - Vue Application Bootstrap & Initialization
// This is the entry point that creates and configures your entire Vue application
// It handles: library imports, plugins, error handling, loading screen management

// CORE IMPORTS - Essential Vue ecosystem libraries
import Vue from 'vue' // Vue.js core framework
import axios from './router/axios' // Pre-configured HTTP client (with interceptors)
import VueAxios from "vue-axios" // Vue plugin that adds axios to all components as this.$http
import App from './App.vue' // Root component that contains <router-view>
import ElementUI from "element-ui" // Complete UI component library (buttons, forms, tables, etc.)
import 'element-ui/lib/theme-chalk/index.css' // Element UI default styling (CRITICAL - without this, components look broken)
import router from './router/router' // Vue Router configuration (URL routing)
import store from './store' // Vuex state management (global app state)
import * as urls from "@/config/env" // Environment-specific URLs and configuration
import '@/styles/common.scss' // Global styles and SCSS variables
import '@/permission' // Route guards (authentication, authorization)
import VueTouch from 'vue-touch' // Touch gesture support for mobile devices
// INTERNATIONALIZATION - Multi-language support
import {i18n, setLanguage} from '@/i18n' // i18n instance and language switching function

// DEVELOPMENT TOOLS - Enable Vue DevTools in browser
Vue.config.devtools = true

// IOS SAFARI SPECIFIC HANDLING - Critical for mobile Safari compatibility
// iOS Safari has unique behaviors: stricter memory management, different error patterns
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOS) {
    // GLOBAL ERROR CAPTURE - iOS Safari sometimes fails silently, this catches errors
    window.addEventListener('error', (e) => {
        console.error('iOS Error:', e.error?.message || e.message, e.filename, e.lineno);
        // ANALYTICS/DEBUG - Send error data to server for debugging iOS-specific issues
        if (navigator.sendBeacon) {  // sendBeacon works even if page is closing
            navigator.sendBeacon('/api/log-error', JSON.stringify({
                error: e.error?.message || e.message,
                file: e.filename,
                line: e.lineno,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }));
        }
    });

    // PROMISE REJECTION HANDLING - Catches async errors that don't trigger 'error' event
    window.addEventListener('unhandledrejection', (e) => {
        console.error('iOS Promise Rejection:', e.reason);
    });
}

// VUE PLUGIN REGISTRATION - Install plugins into Vue ecosystem
Vue.use(VueAxios, axios)                 // Adds this.$http to all components
Vue.use(VueTouch, {name: 'v-touch'})     // Adds v-touch directive for mobile gestures

// MIXED CONTENT SECURITY FIX - Critical for HTTPS deployments
// Problem: HTTPS pages cannot make HTTP API calls (browser security policy)
// Solution: Detect mixed content scenarios and force same-origin requests
(() => {
    const currentBaseURL = axios.defaults.baseURL;
    console.log('🔗 Original API baseURL:', currentBaseURL || '(same-origin)');

    // DETECTION LOGIC: If page is HTTPS but API is HTTP, change to same-origin
    if (location.protocol === 'https:' && currentBaseURL && currentBaseURL.startsWith('http:')) {
        console.warn('⚠️ Mixed content detected! Changing API baseURL from', currentBaseURL, 'to same-origin');
        axios.defaults.baseURL = '';  // Empty string = same-origin (relative URLs)
    }

    console.log('🔗 Final API baseURL:', axios.defaults.baseURL || '(same-origin)');
})();

// ELEMENT UI CONFIGURATION - Configure the UI library with custom settings
Vue.use(ElementUI, {
    size: 'medium',                      // Default component size (small/medium/large)
    menuType: 'text',                    // Menu component style
    i18n: (key, value) => i18n.t(key, value)  // Connect Element UI to your i18n system
    // This makes Element UI components automatically translate based on current language
});

// PRODUCTION TIPS - Disable development warnings in production
Vue.config.productionTip = false

// ENVIRONMENT URL INJECTION - Make environment URLs available to all components
// This allows components to use this.baseUrl, this.apiUrl, etc.
Object.keys(urls).forEach(key => {
    Vue.prototype[key] = urls[key]
})

// GLOBAL LANGUAGE SWITCHING - Add language change method to all components
Vue.prototype.$setLanguage = setLanguage

// IOS MEMORY MANAGEMENT - Prevent memory leaks on resource-constrained devices
if (isIOS) {
    // GARBAGE COLLECTION - Force cleanup every 30 seconds
    // iOS Safari is aggressive about memory limits, this helps prevent crashes
    setInterval(() => {
        if (window.gc) window.gc();    // Only available in development/debug builds
    }, 30000);
}

// IPHONE SAFARI ENHANCED ERROR HANDLING - Most complex mobile browser to support
// iPhone Safari has unique loading behaviors and stricter security policies
(function() {
    // DEVICE DETECTION - Specifically target iPhone Safari (not Chrome on iOS)
    const isIPhoneSafari = /iPhone.*Safari/i.test(navigator.userAgent) && !/Chrome|CriOS/i.test(navigator.userAgent);

    if (isIPhoneSafari) {
        // SCRIPT LOADING MONITOR - Track all script loading for debugging
        const scriptLoadMap = new Map();

        // INTERCEPT SCRIPT CREATION - Override document.createElement to monitor all scripts
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);

            // SCRIPT MONITORING - Only monitor script tags
            if (tagName.toLowerCase() === 'script') {
                const scriptName = element.src ? element.src.split('/').pop() : 'inline-script';
                scriptLoadMap.set(scriptName, 'loading');

                console.log('📱 iPhone Safari loading script:', scriptName);

                // TIMEOUT PROTECTION - Scripts sometimes hang on iPhone Safari
                const timeout = setTimeout(() => {
                    console.error('⏰ Script timeout on iPhone Safari:', scriptName);
                    scriptLoadMap.set(scriptName, 'timeout');
                    element.onerror && element.onerror(new Error('Script timeout'));
                }, parseInt(process.env.MOBILE_TIMEOUT || '10000')); // 10 second timeout

                // SUCCESS HANDLER - Track successful loads
                const originalOnLoad = element.onload;
                element.onload = function() {
                    clearTimeout(timeout);
                    scriptLoadMap.set(scriptName, 'loaded');
                    console.log('✅ Script loaded successfully:', scriptName);

                    // PROGRESS LOGGING - Show current loading status
                    console.log('📊 Script loading status:', Object.fromEntries(scriptLoadMap));

                    originalOnLoad && originalOnLoad.apply(this, arguments);
                };

                // ERROR HANDLER - Handle script failures gracefully
                const originalOnError = element.onerror;
                element.onerror = function(e) {
                    clearTimeout(timeout);
                    scriptLoadMap.set(scriptName, 'error');
                    console.error('❌ Script failed to load:', scriptName, e);

                    // USER NOTIFICATION - Show friendly error message
                    if (document.body) {
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = `
                            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                            background: #ff4444; color: white; padding: 20px; border-radius: 8px;
                            z-index: 10000; font-family: Arial; text-align: center;
                        `;
                        errorDiv.innerHTML = `
                            <h3>Loading Error</h3>
                            <p>Failed to load: ${scriptName}</p>
                            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">Retry</button>
                        `;
                        document.body.appendChild(errorDiv);
                    }

                    originalOnError && originalOnError.apply(this, arguments);
                };
            }

            return element;
        };

        // LOADING PROGRESS MONITOR - Check overall script loading status
        let checkInterval;
        window.addEventListener('DOMContentLoaded', () => {
            checkInterval = setInterval(() => {
                const scripts = Array.from(document.querySelectorAll('script[src]'));
                const allLoaded = scripts.every(script => {
                    const name = script.src.split('/').pop();
                    const status = scriptLoadMap.get(name);
                    return status === 'loaded';
                });

                if (allLoaded && scripts.length > 0) {
                    console.log('🎉 All scripts loaded successfully on iPhone Safari');
                    clearInterval(checkInterval);
                } else {
                    console.log('⏳ Still loading scripts...', {
                        total: scripts.length,
                        status: Object.fromEntries(scriptLoadMap)
                    });
                }
            }, 2000); // Check every 2 seconds
        });

        // MEMORY CLEANUP - Clean up when page closes
        window.addEventListener('pagehide', () => {
            clearInterval(checkInterval);
            // CACHE CLEANUP - Clear service worker caches to free memory
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
        });
    }
})();

// DEPENDENCY VERIFICATION - Ensure critical libraries loaded correctly
// This prevents silent failures where Vue app doesn't start due to missing dependencies
(function() {
    console.log('🔍 Checking critical dependencies...');

    // CHECK ESSENTIAL GLOBALS - These must exist for the app to function
    const essentialChecks = {
        'Vue': typeof Vue !== 'undefined',
        'ElementUI': typeof ElementUI !== 'undefined' || (window.ELEMENT && window.ELEMENT.version),
        'VueRouter': typeof VueRouter !== 'undefined',
        'Vuex': typeof Vuex !== 'undefined'
    };

    console.log('📋 Dependency check results:', essentialChecks);

    const missing = Object.keys(essentialChecks).filter(key => !essentialChecks[key]);
    if (missing.length > 0) {
        console.error('🚨 Missing critical dependencies:', missing);

        // IMMEDIATE USER FEEDBACK - Show error before Vue instance fails
        if (document.body) {
            const errorMessage = document.createElement('div');
            errorMessage.style.cssText = `
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                background: #ff4444; color: white; padding: 15px 25px; border-radius: 8px;
                z-index: 10000; font-family: Arial; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            errorMessage.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">Loading Error</div>
                <div>Missing: ${missing.join(', ')}</div>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 6px 12px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 4px; cursor: pointer;">
                    Reload
                </button>
            `;
            document.body.appendChild(errorMessage);
        }
    }
})();

// VUE INSTANCE CREATION - The main Vue application instance
const vueInstance = new Vue({
    router,    // Enable client-side routing (URL changes without page reload)
    store,     // Enable Vuex state management (global app state)
    i18n,      // Enable internationalization (multi-language support)
    render: h => h(App),  // Render function - creates the root App component

    // MOUNTED LIFECYCLE - Executes after Vue app is mounted to DOM
    mounted() {
        console.log('🚀 Vue app mounted, checking component readiness...');

        // LOADING SCREEN REMOVAL SYSTEM - Multiple strategies for reliability
        const removeLoadingScreen = () => {
            try {
                const appDiv = document.getElementById('app');
                if (appDiv) {
                    // STRATEGY 1: Find loading div by CSS selector (most reliable)
                    const loadingDiv = appDiv.querySelector('div[style*="text-align: center"]');
                    if (loadingDiv && loadingDiv.textContent.includes('Loading Kason Tools')) {
                        console.log('🎯 Removing loading screen (strategy 1)...');
                        loadingDiv.remove();
                        return true;
                    }

                    // STRATEGY 2: Search all divs for loading text (fallback)
                    const allDivs = appDiv.querySelectorAll('div');
                    for (let div of allDivs) {
                        if (div.textContent.includes('Loading') || div.textContent.includes('Initializing')) {
                            console.log('🎯 Removing loading screen (strategy 2)...');
                            div.remove();
                            return true;
                        }
                    }
                }
                return false;
            } catch (e) {
                console.error('Error removing loading screen:', e);
                return false;
            }
        };

        // IMMEDIATE REMOVAL ATTEMPT - Try to remove loading screen right away
        setTimeout(() => {
            if (!removeLoadingScreen()) {
                // DELAYED REMOVAL - Wait for Vue to be fully ready
                this.$nextTick(() => {
                    setTimeout(() => {
                        if (!removeLoadingScreen()) {
                            console.warn('⚠️ Could not find loading screen, forcing app display...');
                            // LAST RESORT - Hide loading elements without removing them
                            const appDiv = document.getElementById('app');
                            if (appDiv) {
                                console.log('🔧 Forcing app content display...');
                                // Don't use innerHTML - let Vue handle DOM
                                const loadingElements = appDiv.querySelectorAll('*');
                                loadingElements.forEach(el => {
                                    if (el.textContent && (el.textContent.includes('Loading') || el.textContent.includes('Initializing'))) {
                                        el.style.display = 'none';
                                    }
                                });
                            }
                        }
                    }, 500);
                });
            }
        }, 100);

        // API CONNECTION TEST - Verify backend connectivity
        setTimeout(() => {
            console.log('🔍 Testing API connection...');
            axios.get('/auth/check')
                .then(() => {
                    console.log('✅ API connection successful');
                })
                .catch(err => {
                    console.error('❌ API connection failed:', err.message);

                    // USER NOTIFICATION - Show API connection issues
                    if (document.body && !document.getElementById('api-connection-error')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.id = 'api-connection-error';
                        errorDiv.style.cssText = `
                            position: fixed; top: 20px; right: 20px; 
                            background: #ff6b6b; color: white; padding: 15px;
                            border-radius: 8px; z-index: 10000; font-family: Arial; 
                            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        `;
                        errorDiv.innerHTML = `
                            <div style="font-weight: bold; margin-bottom: 8px;">⚠️ API Connection Issue</div>
                            <div style="font-size: 13px; margin-bottom: 10px;">
                                The app may not function properly due to API connection problems.
                                ${err.message.includes('Network Error') ? 'This might be a mixed-content security issue.' : ''}
                            </div>
                            <button onclick="this.parentNode.remove()" style="
                                background: rgba(255,255,255,0.3); border: none; color: white;
                                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                            ">Dismiss</button>
                        `;
                        document.body.appendChild(errorDiv);

                        // AUTO-DISMISS - Remove error after 10 seconds
                        setTimeout(() => {
                            const errorEl = document.getElementById('api-connection-error');
                            if (errorEl) errorEl.remove();
                        }, 10000);
                    }
                });
        }, 1000);

        // ROUTER STATUS CHECK - Verify routing is working
        if (this.$router && this.$route) {
            console.log('📍 Current route:', this.$route.path);
            console.log('🗺️ Route params:', this.$route.params);
            console.log('❓ Route query:', this.$route.query);

            // NAVIGATION HANDLING - Navigate to intended route if needed
            const targetPath = window.location.hash.replace('#', '');
            if (targetPath && targetPath !== '/' && this.$route.path !== targetPath) {
                console.log('🔄 Navigating to target path:', targetPath);
                this.$router.push(targetPath).catch(err => {
                    console.error('Navigation error:', err);
                });
            }
        }

        // IOS POST-MOUNT VERIFICATION
        if (isIOS) {
            console.log('✅ Vue app mounted successfully on iOS');

            // COMPONENT AVAILABILITY CHECK - Ensure Element UI components loaded
            this.$nextTick(() => {
                const essentialComponents = ['ElButton', 'ElTable', 'ElForm', 'ElDialog'];
                const availableComponents = Object.keys(ElementUI || {});
                const missingComponents = essentialComponents.filter(comp =>
                    !availableComponents.includes(comp) &&
                    !this.$options.components[comp]
                );

                if (missingComponents.length > 0) {
                    console.warn('⚠️ Missing Element UI components:', missingComponents);
                } else {
                    console.log('✅ All essential Element UI components available');
                }

                // AVUE LIBRARY CHECK - If using Avue components
                if (typeof window.avue === 'undefined' && typeof this.$avue === 'undefined') {
                    console.warn('⚠️ Avue library may not be loaded');
                }
            });
        }
    },

    // ERROR CAPTURE HANDLER - Catches errors in child components
    errorCaptured(err, vm, info) {
        console.error('Vue Error Captured:', err, info);
        if (isIOS) {
            // IOS ERROR RECOVERY - Attempt to recover from errors
            this.$nextTick(() => {
                console.log('Attempting iOS error recovery...');
            });
        }
        return false; // Prevent error from propagating up
    }
});

// CHUNK LOADING ERROR HANDLER - Handles dynamic import failures
// Common on mobile Safari when network is slow or interrupted
router.onError(err => {
    const chunkFailed = /Loading chunk [\w-]+ failed/i.test(err?.message || '');
    if (chunkFailed) {
        console.error('Chunk load failed, reloading...', err);
        // AUTOMATIC RECOVERY - Reload page to retry chunk loading
        location.reload(); // Keeps current hash/route
    }
});

// ROUTER READY HANDLER - Executes when initial navigation completes
router.onReady(() => {
    try {
        const appDiv = document.getElementById('app');
        if (appDiv) {
            const loadingDiv = appDiv.querySelector('div[style*="text-align: center"]');
            if (loadingDiv && loadingDiv.textContent.includes('Loading Kason Tools')) {
                loadingDiv.remove();
            }
        }
    } catch (e) {
        console.warn('Failed to remove loading shell on router ready:', e);
    }
});

// FALLBACK LOADING SCREEN REMOVAL - Safety net after 3 seconds
setTimeout(() => {
    const appDiv = document.getElementById('app');
    if (appDiv) {
        const loadingElements = appDiv.querySelectorAll('*');
        let foundLoading = false;

        loadingElements.forEach(el => {
            if (el.textContent && (el.textContent.includes('Loading Kason Tools') || el.textContent.includes('Initializing components'))) {
                console.log('⏰ Fallback: Removing stuck loading screen after 3s');
                el.style.display = 'none';
                foundLoading = true;
            }
        });

        if (foundLoading) {
            // FORCE ROUTER VIEW - Ensure router-view is visible
            const routerView = document.createElement('div');
            routerView.innerHTML = '<router-view></router-view>';
            appDiv.appendChild(routerView);
        }
    }
}, 3000);

// MOUNT VUE INSTANCE - Attach Vue app to DOM element with id="app"
vueInstance.$mount('#app')
