const { contextBridge, ipcRenderer } = require('electron');
const isDev = require('electron-is-dev');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Environment information
    isDev: isDev,
    environment: isDev ? 'development' : 'production',

    // Environment variables (safe ones only)
    getEnvVar: (key) => {
        // Only allow specific environment variables for security
        const allowedVars = ['KIWI_SERVER_URL', 'VUE_APP_API_URL', 'NODE_ENV'];
        if (allowedVars.includes(key)) {
            return process.env[key];
        }
        return null;
    },

    // DevTools functionality
    toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),

    // App information
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Platform information
    platform: process.platform,

    // File system access (if needed for your vocabulary app)
    readFile: async (filePath, options) => {
        // This would need to be implemented in the main process
        return ipcRenderer.invoke('read-file', filePath, options);
    },

    // URL handling
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Window controls
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'),
    close: () => ipcRenderer.invoke('close-window'),

    // Development helpers
    getEnvironmentInfo: () => {
        return {
            isDev: isDev,
            environment: isDev ? 'development' : 'production',
            url: window.location.href,
            platform: process.platform
        };
    },

    // Console logging for debugging
    log: (message) => {
        console.log('[Renderer]:', message);
    }
});

// Add session debugging and persistence helpers
window.addEventListener('DOMContentLoaded', () => {
    // Debug session persistence
    console.log('=== SESSION PERSISTENCE DEBUG ===');
    console.log('LocalStorage items:', localStorage.length);
    console.log('SessionStorage items:', sessionStorage.length);

    // Log some sample data
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('kason-tools')) {
            console.log('Persistent data found:', key);
        }
    }

    // Test storage functionality
    try {
        localStorage.setItem('test-persistence', new Date().toISOString());
        console.log('LocalStorage write test: SUCCESS');
    } catch (error) {
        console.error('LocalStorage write test: FAILED', error);
    }

    document.addEventListener('keydown', (event) => {
        // F12 key
        if (event.key === 'F12') {
            event.preventDefault();
            ipcRenderer.invoke('toggle-devtools');
            return;
        }

        // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (macOS)
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
            event.preventDefault();
            ipcRenderer.invoke('toggle-devtools');
            return;
        }

        // Ctrl+R or Cmd+R for reload
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            location.reload();

        }
    });
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('[Renderer Error]:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Renderer Unhandled Promise Rejection]:', event.reason);
});