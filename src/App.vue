<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<script>
    export default {
        name: 'app',
        mounted() {
            this.setupOAuthHandlers()
            this.signalIfOAuthPopup()
            this.initTheme()
        },
        beforeDestroy() {
            try { window.removeEventListener('message', this.handleOAuthMessage) } catch (e) { /* ignore */ }
        },
        methods: {
            initTheme() {
                try {
                    // Dynamic import to avoid circular dependency issues if any, though getStore is safe
                    const { getStore } = require('@/util/store')
                    const theme = getStore({ name: 'theme' }) || 'default'
                    document.documentElement.setAttribute('data-theme', theme)
                } catch (e) {
                    console.error('Failed to initialize theme', e)
                }
            },
            setupOAuthHandlers() {
                try { window.addEventListener('message', this.handleOAuthMessage, false) } catch (e) { /* ignore */ }
            },
            handleOAuthMessage(event) {
                try {
                    const data = event && event.data
                    if (data && data.type === 'oauth:done') {
                        // Navigate to home and refresh state
                        try { this.$router && this.$router.replace('/') } catch (e) { /* ignore */ }
                        // Ensure cookies/session are visible to app
                        try { window.location.reload() } catch (e) { /* ignore */ }
                    }
                } catch (e) { /* ignore */ }
            },
            signalIfOAuthPopup() {
                try {
                    const hasOpener = !!window.opener
                    const href = window.location && window.location.href || ''
                    const ref = document && document.referrer || ''
                    const isOAuthPath = /\/auth\/oauth\//.test(href)
                    const fromGoogle = /https:\/\/accounts\.google\.com/.test(ref)
                    if (hasOpener && (isOAuthPath || fromGoogle)) {
                        try { window.opener.postMessage({ type: 'oauth:done' }, '*') } catch (e) { /* ignore */ }
                        // Attempt to close this popup/tab
                        try { window.close() } catch (e) { /* ignore */ }
                    }
                } catch (e) { /* ignore */ }
            }
        }
    }
</script>

<style>
    body {
        background: var(--bg-body);
        transition: background 0.3s ease;
    }
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: var(--text-primary);
        margin-top: 60px;
    }
</style>
