const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App information
    getVersion: () => ipcRenderer.invoke('app-version'),

    // Dialog functions
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),

    // Window controls (for custom title bar)
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),

    // File system access (for reading local files)
    readFile: async (filePath) => {
        try {
            const fs = require('fs').promises;
            const path = require('path');

            // Ensure the file path is safe and within allowed directories
            const safePath = path.resolve(__dirname, '..', filePath);
            const data = await fs.readFile(safePath, 'utf8');
            return data;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    },

    // Platform information
    platform: process.platform,

    // Node.js path utilities
    path: {
        join: (...args) => require('path').join(...args),
        resolve: (...args) => require('path').resolve(...args),
        dirname: (path) => require('path').dirname(path),
        basename: (path) => require('path').basename(path),
    },

    // Environment information
    isDev: process.env.NODE_ENV === 'development',
});

// Create a mock window.fs for the Vue app file reading functionality
window.fs = {
    readFile: async (filePath, options = {}) => {
        try {
            const fs = require('fs').promises;
            const path = require('path');

            // Handle different file path formats
            let resolvedPath;
            if (filePath.startsWith('/')) {
                // Absolute path from app root
                resolvedPath = path.join(__dirname, '..', 'dist', filePath.substring(1));
            } else {
                // Relative path
                resolvedPath = path.join(__dirname, '..', 'dist', filePath);
            }

            const data = await fs.readFile(resolvedPath, options.encoding || 'utf8');

            if (options.encoding === undefined) {
                // Return as Uint8Array for binary data
                return new Uint8Array(Buffer.from(data, 'binary'));
            }

            return data;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }
};

// Disable right-click context menu (optional)
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Disable text selection (optional - for a more app-like feel)
// Uncomment if you want to disable text selection
/*
document.addEventListener('selectstart', (e) => {
  e.preventDefault();
  return false;
});
*/

// Override console for better debugging in Electron
const originalConsole = { ...console };
window.console = {
    ...originalConsole,
    log: (...args) => {
        originalConsole.log('[Renderer]', ...args);
    },
    error: (...args) => {
        originalConsole.error('[Renderer]', ...args);
    },
    warn: (...args) => {
        originalConsole.warn('[Renderer]', ...args);
    },
    info: (...args) => {
        originalConsole.info('[Renderer]', ...args);
    }
};