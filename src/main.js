import Vue from 'vue'
import axios from './router/axios'
import VueAxios from "vue-axios"
import App from './App.vue'
import ElementUI from "element-ui"
import 'element-ui/lib/theme-chalk/index.css'
import router from './router/router'
import store from './store'
import * as urls from "@/config/env"
import '@/styles/common.scss'
import '@/permission' // 权限
import VueTouch from 'vue-touch'

// Import i18n
import {i18n, setLanguage} from '@/i18n'
// Hotkeys storage
import {getStore} from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

Vue.config.devtools = true

// Helper: normalize accelerator strings similar to Electron main
function normalizeAcceleratorRenderer(accelerator) {
    if (typeof accelerator !== 'string') return null
    const rawTokens = accelerator.split('+').map((token) => token.trim()).filter(Boolean)
    if (rawTokens.length === 0) return null

    const isMac = navigator.platform && navigator.platform.toLowerCase().includes('mac')
    const commandToken = 'CommandOrControl'

    const modifierMap = {
        meta: commandToken,
        command: commandToken,
        cmd: commandToken,
        cmdorctrl: 'CommandOrControl',
        commandorcontrol: 'CommandOrControl',
        ctrl: 'Control',
        control: 'Control',
        option: isMac ? 'Option' : 'Alt',
        alt: 'Alt',
        altgr: 'AltGr',
        shift: 'Shift',
        super: isMac ? 'Command' : 'Super',
        win: 'Super'
    }

    const specialKeys = {
        esc: 'Esc',
        escape: 'Esc',
        space: 'Space',
        spacebar: 'Space',
        enter: 'Enter',
        return: 'Enter',
        tab: 'Tab',
        backspace: 'Backspace',
        delete: 'Delete',
        del: 'Delete',
        home: 'Home',
        end: 'End',
        pageup: 'PageUp',
        pagedown: 'PageDown',
        arrowup: 'ArrowUp',
        arrowdown: 'ArrowDown',
        arrowleft: 'ArrowLeft',
        arrowright: 'ArrowRight'
    }

    const modifiers = []
    let keyToken = null

    rawTokens.forEach((token) => {
        const lower = token.toLowerCase()
        if (modifierMap[lower]) {
            modifiers.push(modifierMap[lower])
            return
        }
        if (!keyToken) {
            if (specialKeys[lower]) keyToken = specialKeys[lower]
            else if (/^f\d{1,2}$/i.test(token)) keyToken = token.toUpperCase()
            else if (/^[0-9]$/.test(token)) keyToken = token
            else if (token.length === 1) keyToken = token.toUpperCase()
            else keyToken = token.charAt(0).toUpperCase() + token.slice(1)
            return
        }
        keyToken += `+${token}`
    })

    if (!keyToken) return null

    const modifierOrder = ['CommandOrControl', 'Command', 'Control', 'AltGr', 'Option', 'Alt', 'Super', 'Shift']
    const orderedModifiers = modifiers
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b))

    return [...orderedModifiers, keyToken].join('+')
}

// Helper: convert a KeyboardEvent into a normalized accelerator string
function eventToAccelerator(e) {
    // Ignore if only a modifier was pressed
    const key = (e.key || '').toString()
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) return null

    const parts = []
    if (e.metaKey) parts.push('Meta')
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (parts.length === 0) return null

    let keyLabel = ''
    if (key.length === 1) keyLabel = key.toUpperCase()
    else {
        const map = {
            Escape: 'Esc',
            ' ': 'Space',
            Spacebar: 'Space',
            ArrowUp: 'ArrowUp',
            ArrowDown: 'ArrowDown',
            ArrowLeft: 'ArrowLeft',
            ArrowRight: 'ArrowRight',
            Enter: 'Enter',
            Tab: 'Tab',
            Backspace: 'Backspace',
            Delete: 'Delete',
            Home: 'Home',
            End: 'End',
            PageUp: 'PageUp',
            PageDown: 'PageDown'
        }
        if (map[key]) keyLabel = map[key]
        else if (/^F\d{1,2}$/.test(key)) keyLabel = key
        else if (/^[0-9]$/.test(key)) keyLabel = key
        else keyLabel = key.charAt(0).toUpperCase() + key.slice(1)
    }

    const rawCombo = [...parts, keyLabel].join('+')
    return normalizeAcceleratorRenderer(rawCombo)
}

// Keep a lightweight in-app hotkeys fallback that works when global shortcuts can't be registered
function setupRendererHotkeysFallback(vue, storedMap, registrationResult) {
    try {
        // Clean up previous handler if any
        if (vue._offRendererHotkeys) {
            window.removeEventListener('keydown', vue._offRendererHotkeys)
            vue._offRendererHotkeys = null
        }

        // Nothing to do without a map
        if (!storedMap || typeof storedMap !== 'object' || Object.keys(storedMap).length === 0) return

        // Build normalized combo->mode map from stored map
        const normalizedMap = {}
        Object.entries(storedMap).forEach(([combo, mode]) => {
            const norm = normalizeAcceleratorRenderer(combo)
            if (norm) normalizedMap[norm] = mode
        })

        // Identify which accelerators failed to register globally (normalize list)
        const failedNormalized = new Set()
        try {
            const failed = (registrationResult && registrationResult.failed && registrationResult.failed.modes) || []
            failed.forEach(acc => { const n = normalizeAcceleratorRenderer(acc); if (n) failedNormalized.add(n) })
        } catch (_) {}

        // If none failed, don't install a renderer handler to avoid double-trigger with globalShortcut
        if (failedNormalized.size === 0) return

        let lastTriggerAt = 0
        const handler = (e) => {
            // Let text inputs handle their own shortcuts unless it's clearly a command combo
            const tag = (e.target && e.target.tagName) || ''
            const isInput = ['INPUT', 'TEXTAREA'].includes(tag)
            if (isInput && !(e.metaKey || e.ctrlKey || e.altKey)) return

            const accel = eventToAccelerator(e)
            if (!accel) return

            // Only handle accelerators that failed to register globally
            if (!failedNormalized.has(accel)) return

            const mode = normalizedMap[accel]
            if (!mode) return

            const now = Date.now()
            if (now - lastTriggerAt < 200) return // debounce
            lastTriggerAt = now

            e.preventDefault()
            try {
                // Ask main to navigate so we reuse centralized navigation routing
                if (window.electronAPI && typeof window.electronAPI.requestNavigate === 'function') {
                    window.electronAPI.requestNavigate('search', { selectedMode: mode })
                } else if (vue && vue.$router) {
                    // Fallback if not in Electron for any reason
                    const website = require('@/const/website').default
                    const kiwiConstsLocal = require('@/const/kiwiConsts').default
                    const AI_VALUES = Object.values(kiwiConstsLocal.SEARCH_AI_MODES).map(m => m.value)
                    const isAi = AI_VALUES.includes(mode)
                    const baseQuery = { ...vue.$route.query, selectedMode: mode, active: 'search' }

                    // Helper: shallow compare relevant keys ignoring transient ones
                    const sameCore = (a, b) => {
                        const keys = ['active','selectedMode','language','originalText','ytbMode']
                        return keys.every(k => String((a||{})[k]||'') === String((b||{})[k]||''))
                    }

                    if (isAi) {
                        const target = { path: '/index/tools/aiResponseDetail', query: baseQuery }
                        // Idempotence guard
                        if (vue.$route.path === target.path && sameCore(vue.$route.query, target.query)) return
                        vue.$router.replace(target)
                    } else {
                        const target = { path: website.noAuthPath.detail, query: baseQuery }
                        if (vue.$route.path === target.path && sameCore(vue.$route.query, target.query)) return
                        vue.$router.replace(target)
                    }
                }
            } catch (err) {
                console.warn('Renderer hotkey fallback navigation failed:', err)
            }
        }

        window.addEventListener('keydown', handler)
        vue._offRendererHotkeys = handler
    } catch (e) {
        console.warn('Failed to set up renderer hotkeys fallback:', e)
    }
}

// iOS Safari specific error handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOS) {
    // Capture iOS-specific errors
    window.addEventListener('error', (e) => {
        console.error('iOS Error:', e.error?.message || e.message, e.filename, e.lineno);
        // Send error info to your server for debugging
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/log-error', JSON.stringify({
                error: e.error?.message || e.message,
                file: e.filename,
                line: e.lineno,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }));
        }
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('iOS Promise Rejection:', e.reason);
    });
}

Vue.use(VueAxios, axios)
Vue.use(VueTouch, {name: 'v-touch'})

// Configure ElementUI with i18n
Vue.use(ElementUI, {
    size: 'medium',
    menuType: 'text',
    i18n: (key, value) => i18n.t(key, value)
})

Vue.config.productionTip = false

Object.keys(urls).forEach(key => {
    Vue.prototype[key] = urls[key]
})

// Add global method for language switching
Vue.prototype.$setLanguage = setLanguage

// iOS Safari memory management
if (isIOS) {
    // Force garbage collection periodically
    setInterval(() => {
        if (window.gc) window.gc();
    }, 30000);
}

const vueInstance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
    mounted() {
        // Clear loading screen when Vue is ready
        setTimeout(() => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    const appDiv = document.getElementById('app');
                    if (appDiv && appDiv.children.length > 1) {
                        // Remove loading content
                        appDiv.removeChild(appDiv.firstChild);
                    }
                }, 500);
            }
        }, 100);

        if (isIOS) {
            console.log('✅ Vue app mounted successfully on iOS');
        }

        // Listen for Electron global navigation events if available
        try {
            if (window.electronAPI && typeof window.electronAPI.onNavigate === 'function') {
                this._offNavigate = window.electronAPI.onNavigate(({ active, params }) => {
                    const website = require('@/const/website').default
                    const kiwiConsts = require('@/const/kiwiConsts').default

                    // Always target Search tab as the base for tool views
                    const baseQuery = {
                        ...this.$route.query,
                        ...(params || {}),
                        active: 'search'
                    }

                    // If a specific mode is requested, do a two-step nav to force refresh reliably
                    if (params && params.selectedMode) {
                        const AI_VALUES = Object.values(kiwiConsts.SEARCH_AI_MODES).map(m => m.value)
                        const isAi = AI_VALUES.includes(params.selectedMode)
                        const toDetail = { path: website.noAuthPath.detail, query: { ...baseQuery, now: Date.now() } }

                        if (isAi) {
                            // Step 1: go to Search (detail) to ensure tab focus
                            this.$router.replace(toDetail).finally(() => {
                                // Step 2: jump into AI detail with fresh timestamp so same-mode re-triggers
                                const toAi = { path: '/index/tools/aiResponseDetail', query: { ...baseQuery, now: Date.now() } }
                                this.$router.replace(toAi)
                            })
                        } else {
                            // Non-AI modes: one step to detail is fine with fresh timestamp
                            this.$router.replace({ path: website.noAuthPath.detail, query: { ...baseQuery, now: Date.now() } })
                        }
                    } else {
                        // No specific mode: just ensure Search tab is focused with a fresh timestamp
                        this.$router.replace({ path: website.noAuthPath.detail, query: { ...baseQuery, now: Date.now() } })
                    }
                })
            }
        } catch (e) { console.warn('Failed to bind electron navigation listener', e) }

        // Register any saved global hotkeys (none by default; user config only)
        try {
            if (window.electronAPI && typeof window.electronAPI.registerGlobalHotkeys === 'function') {
                const handleRegistrationResult = (result, storedMapForFallback) => {
                    try {
                        const failed = []
                        if (result && result.failed) {
                            failed.push(...(result.failed.tabs || []))
                            failed.push(...(result.failed.modes || []))
                        }
                        if (failed.length > 0) {
                            console.warn('Some global hotkeys could not be registered:', failed.join(', '))
                        }
                        // Always set up a renderer-level fallback for any failed combos (or scoped handling when app focused)
                        setupRendererHotkeysFallback(this, storedMapForFallback, result)
                    } catch (_) { /* ignore */ }
                }
                const stored = getStore({ name: kiwiConsts.CONFIG_KEY.SEARCH_MODE_HOTKEYS })
                if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
                    Promise.resolve(window.electronAPI.registerGlobalHotkeys({ modes: stored }))
                        .then(res => handleRegistrationResult(res, stored))
                        .catch(err => {
                            console.warn('Failed to register global hotkeys:', err)
                            // If registration IPC fails, still set up renderer fallback
                            setupRendererHotkeysFallback(this, stored, null)
                        })
                } else {
                    // Ensure no lingering shortcuts
                    if (typeof window.electronAPI.unregisterGlobalHotkeys === 'function') {
                        Promise.resolve(window.electronAPI.unregisterGlobalHotkeys())
                            .catch(err => console.warn('Failed to unregister global hotkeys:', err))
                    }
                    // Also remove renderer fallback if present
                    if (this._offRendererHotkeys) {
                        window.removeEventListener('keydown', this._offRendererHotkeys)
                        this._offRendererHotkeys = null
                    }
                }

                // Re-apply when user updates hotkeys via settings
                this._hotkeysUpdatedHandler = () => {
                    try {
                        const latest = getStore({ name: kiwiConsts.CONFIG_KEY.SEARCH_MODE_HOTKEYS })
                        if (latest && typeof latest === 'object' && Object.keys(latest).length > 0) {
                            Promise.resolve(window.electronAPI.registerGlobalHotkeys({ modes: latest }))
                                .then(res => setupRendererHotkeysFallback(this, latest, res))
                                .catch(err => {
                                    console.warn('Failed to update global hotkeys:', err)
                                    setupRendererHotkeysFallback(this, latest, null)
                                })
                        } else {
                            if (typeof window.electronAPI.unregisterGlobalHotkeys === 'function') {
                                Promise.resolve(window.electronAPI.unregisterGlobalHotkeys())
                                    .catch(err => console.warn('Failed to unregister global hotkeys:', err))
                            }
                            if (this._offRendererHotkeys) {
                                window.removeEventListener('keydown', this._offRendererHotkeys)
                                this._offRendererHotkeys = null
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to update global hotkeys:', e)
                    }
                }
                window.addEventListener('hotkeys-updated', this._hotkeysUpdatedHandler)
            }
        } catch (e) { console.warn('Failed to register global hotkeys', e) }
    },
    beforeDestroy() {
        try { if (this._offNavigate) this._offNavigate() } catch (_) {}
        try { if (this._hotkeysUpdatedHandler) window.removeEventListener('hotkeys-updated', this._hotkeysUpdatedHandler) } catch (_) {}
        try { if (this._offRendererHotkeys) window.removeEventListener('keydown', this._offRendererHotkeys) } catch (_) {}
    },
    errorCaptured(err, vm, info) {
        console.error('Vue Error Captured:', err, info);
        if (isIOS) {
            // iOS-specific error handling
            this.$nextTick(() => {
                console.log('Attempting iOS error recovery...');
            });
        }
        return false; // Prevent the error from propagating
    }
});

vueInstance.$mount('#app')
