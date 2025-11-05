const { app, BrowserWindow, Menu, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const isDev = require('electron-is-dev'); // Use dynamic detection instead of hardcoded false

// Detect npm script and hosted website URL override
const npmScript = process.env.npm_lifecycle_event || '';
const isElectronProdRun = process.env.NODE_ENV === 'production' && (npmScript === 'electron-prod' || process.env.ELECTRON_PROD === 'true');
const HOSTED_WEBSITE_URL = process.env.WEBSITE_URL || 'https://kason.app';

// Set app name
app.setName('Kason Tools');

// Set user data path for persistent storage
if (!isDev) {
    // In production, set a specific user data directory
    const userDataPath = path.join(require('os').homedir(), 'KiwiVocabulary');
    app.setPath('userData', userDataPath);
    console.log('User data will be stored at:', userDataPath);
} else {
    console.log('Development mode - using default user data path:', app.getPath('userData'));
}

// Keep a global reference of the window object
let mainWindow;

// Add a helper to navigate to a specific app mode from the main process
function navigateToMode(active, extra = {}) {
    try {
        // Ensure a window exists
        if (!mainWindow || mainWindow.isDestroyed()) {
            createWindow()
            // Wait for content to load, then navigate
            const sendNav = () => {
                try { mainWindow.webContents.send('navigate-to', { active, params: extra }) } catch (_) {}
            }
            mainWindow.once('ready-to-show', () => {
                try {
                    if (mainWindow.isMinimized()) mainWindow.restore()
                    if (!mainWindow.isVisible()) mainWindow.show()
                    mainWindow.focus()
                } catch (_) {}
                sendNav()
            })
            // Also attempt after did-finish-load as a fallback
            mainWindow.webContents.once('did-finish-load', sendNav)
            return
        }
        // Bring app window to front and focus it so user sees the change
        if (mainWindow.isMinimized()) mainWindow.restore()
        if (!mainWindow.isVisible()) mainWindow.show()
        mainWindow.focus()
        // Notify renderer to navigate
        mainWindow.webContents.send('navigate-to', { active, params: extra })
    } catch (e) {
        console.warn('Failed to navigate to mode:', active, e)
    }
}

const PLATFORM = process.platform

function normalizeAccelerator(accelerator) {
    if (typeof accelerator !== 'string') return null
    const rawTokens = accelerator.split('+').map((token) => token.trim()).filter(Boolean)
    if (rawTokens.length === 0) return null

    const isMac = PLATFORM === 'darwin'
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

    rawTokens.forEach((token, index) => {
        const lower = token.toLowerCase()
        if (modifierMap[lower]) {
            modifiers.push(modifierMap[lower])
            return
        }

        // Treat final token (or first non-modifier) as key
        if (!keyToken) {
            if (specialKeys[lower]) {
                keyToken = specialKeys[lower]
            } else if (/^f\d{1,2}$/i.test(token)) {
                keyToken = token.toUpperCase()
            } else if (/^[0-9]$/.test(token)) {
                keyToken = token
            } else if (token.length === 1) {
                keyToken = token.toUpperCase()
            } else {
                keyToken = token.charAt(0).toUpperCase() + token.slice(1)
            }
            return
        }

        // If extra token after key, append to key (rare edge cases)
        keyToken += `+${token}`
    })

    if (!keyToken) return null

    const modifierOrder = ['CommandOrControl', 'Command', 'Control', 'AltGr', 'Option', 'Alt', 'Super', 'Shift']
    const orderedModifiers = modifiers
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b))

    return [...orderedModifiers, keyToken].join('+')
}

// Normalize hotkey mapping to strings only and platform-friendly accelerators
function normalizeHotkeyMapping(mapping = {}) {
    const sanitized = { tabs: {}, modes: {} }
    if (!mapping || typeof mapping !== 'object') return sanitized

    const assignNormalized = (target, accelerator, value) => {
        const normalizedAccel = normalizeAccelerator(accelerator)
        if (!normalizedAccel) return
        target[normalizedAccel] = value.trim()
    }

    const collect = (source, target) => {
        if (!source || typeof source !== 'object') return
        Object.entries(source).forEach(([accelerator, value]) => {
            if (typeof accelerator !== 'string') return
            const trimmedAccel = accelerator.trim()
            if (!trimmedAccel) return
            if (typeof value !== 'string') return
            const trimmedValue = value.trim()
            if (!trimmedValue) return
            assignNormalized(target, trimmedAccel, trimmedValue)
        })
    }

    collect(mapping.tabs, sanitized.tabs)
    collect(mapping.modes, sanitized.modes)
    return sanitized
}

function getHotkeyStoragePath() {
    try {
        const userDataDir = app.getPath('userData')
        if (!userDataDir) return null
        return path.join(userDataDir, 'global-hotkeys.json')
    } catch (e) {
        console.warn('Unable to determine hotkey storage path:', e)
        return null
    }
}

function persistGlobalHotkeys(mapping = {}) {
    try {
        const storePath = getHotkeyStoragePath()
        if (!storePath) return
        const normalized = normalizeHotkeyMapping(mapping)
        const hasTabs = Object.keys(normalized.tabs).length > 0
        const hasModes = Object.keys(normalized.modes).length > 0

        if (!hasTabs && !hasModes) {
            try { fs.unlinkSync(storePath) } catch (err) {
                if (err && err.code !== 'ENOENT') {
                    console.warn('Failed to remove hotkey store file:', err)
                }
            }
            return
        }

        const dir = path.dirname(storePath)
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
        } catch (mkdirErr) {
            console.warn('Failed to ensure hotkey storage directory:', mkdirErr)
        }

        fs.writeFileSync(storePath, JSON.stringify(normalized, null, 2), 'utf-8')
    } catch (e) {
        console.warn('Failed to persist global hotkeys:', e)
    }
}

function loadPersistedHotkeys() {
    try {
        const storePath = getHotkeyStoragePath()
        if (!storePath || !fs.existsSync(storePath)) return null
        const raw = fs.readFileSync(storePath, 'utf-8')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const normalized = normalizeHotkeyMapping(parsed)
        if (Object.keys(normalized.tabs).length === 0 && Object.keys(normalized.modes).length === 0) {
            return null
        }
        return normalized
    } catch (e) {
        console.warn('Failed to load persisted hotkeys:', e)
        return null
    }
}

// Helper to register user-provided global shortcuts (tabs and modes)
function applyGlobalHotkeys(mapping = {}) {
    const normalized = normalizeHotkeyMapping(mapping)
    try { globalShortcut.unregisterAll() } catch (_) {}

    const tabs = normalized.tabs || {}
    const modes = normalized.modes || {}

    const result = {
        normalized,
        registered: { tabs: [], modes: [] },
        failed: { tabs: [], modes: [] }
    }

    // Register tab navigation shortcuts
    Object.entries(tabs).forEach(([accelerator, active]) => {
        if (!accelerator || !active) return
        try {
            const ok = globalShortcut.register(accelerator, () => navigateToMode(active))
            if (!ok) console.warn('Failed to register tab shortcut:', accelerator)
            if (ok) result.registered.tabs.push(accelerator)
            else result.failed.tabs.push(accelerator)
        } catch (e) {
            console.warn('Error registering tab shortcut:', accelerator, e)
            result.failed.tabs.push(accelerator)
        }
    })

    // Register mode-specific shortcuts (search with selectedMode)
    Object.entries(modes).forEach(([accelerator, selectedMode]) => {
        if (!accelerator || !selectedMode) return
        try {
            const ok = globalShortcut.register(accelerator, () => navigateToMode('search', { selectedMode }))
            if (!ok) console.warn('Failed to register mode shortcut:', accelerator)
            if (ok) result.registered.modes.push(accelerator)
            else result.failed.modes.push(accelerator)
        } catch (e) {
            console.warn('Error registering mode shortcut:', accelerator, e)
            result.failed.modes.push(accelerator)
        }
    })

    return result
}


function unregisterGlobalShortcuts() {
    try { globalShortcut.unregisterAll() } catch (_) {}
}

function loadRuntimeEnv() {
    try {
        const loadedFiles = [];
        const userDataDir = app.getPath('userData');
        const appPath = app.getAppPath();
        const projectRoot = isDev ? process.cwd() : appPath;

        const candidateFiles = [
            path.join(userDataDir, 'electron.env.local'),
            path.join(userDataDir, 'electron.env'),
            path.join(projectRoot, 'config', 'electron.env.local'),
            path.join(projectRoot, 'config', 'electron.env'),
            path.join(projectRoot, '.env.electron.local'),
            path.join(projectRoot, '.env.local'),
            path.join(projectRoot, '.env.electron'),
            path.join(projectRoot, '.env')
        ];

        candidateFiles.forEach((envPath) => {
            if (!envPath || loadedFiles.includes(envPath)) return;
            if (fs.existsSync(envPath)) {
                const result = dotenv.config({ path: envPath, override: true });
                if (result.error) {
                    console.warn('Failed to load env file:', envPath, result.error.message);
                } else {
                    loadedFiles.push(envPath);
                }
            }
        });

        if (!process.env.VUE_APP_API_URL && process.env.KIWI_SERVER_URL) {
            process.env.VUE_APP_API_URL = process.env.KIWI_SERVER_URL;
        }
        if (!process.env.KIWI_SERVER_URL && process.env.VUE_APP_API_URL) {
            process.env.KIWI_SERVER_URL = process.env.VUE_APP_API_URL;
        }
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = isDev ? 'development' : 'production';
        }
        process.env.IS_ELECTRON = 'true';
        // Surface website URL for preload if needed
        process.env.WEBSITE_URL = process.env.WEBSITE_URL || HOSTED_WEBSITE_URL;

        console.log('Loaded Electron env files:', loadedFiles);
        console.log('Effective backend URL:', process.env.KIWI_SERVER_URL || '(not set)');
        console.log('Website URL:', process.env.WEBSITE_URL);
    } catch (error) {
        console.warn('Environment bootstrap failed:', error);
    }
}

// Configuration for different environments
const config = {
    development: {
        // Allow override via environment variable to handle port conflicts
        primary: process.env.DEV_SERVER_URL || 'http://localhost:8080',
        fallback: `file://${path.join(__dirname, '../dist/index.html')}`
    },
    production: {
        // For production Electron app, use bundled files directly
        primary: `file://${path.join(__dirname, '../dist/index.html')}`,
        fallback: `file://${path.join(__dirname, '../dist/index.html')}`
    },
    // Special hosted mode for electron-prod to use remote website
    productionHosted: {
        primary: HOSTED_WEBSITE_URL,
        fallback: `file://${path.join(__dirname, '../dist/index.html')}`
    }
};

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Kason Tools', // Set window title
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            devTools: true, // Always enable DevTools
            // In hosted/prod, keep webSecurity ON; in dev-server only, disable for CORS convenience
            webSecurity: isElectronProdRun ? true : !isDev,
            // Enable persistent storage
            partition: 'persist:kason-tools', // This enables session persistence
            // Additional security settings
            allowRunningInsecureContent: false,
            experimentalFeatures: false
        },
        icon: path.join(__dirname, 'icon.png'), // App icon
        show: false // Don't show until ready
    });

    // Configure session for persistence
    const session = mainWindow.webContents.session;

    // In development, neutralize CORS for local backend to prevent strict-origin errors if proxy is bypassed
    if (isDev && !isElectronProdRun) {
        try {
            const TARGET_ORIGIN = 'http://localhost:9991'
            let lastRequestOrigin = null
            session.webRequest.onBeforeSendHeaders((details, callback) => {
                try {
                    const url = new URL(details.url)
                    if (url.origin === TARGET_ORIGIN) {
                        details.requestHeaders = details.requestHeaders || {}
                        const reqOrigin = details.requestHeaders['Origin'] || details.requestHeaders['origin']
                        if (reqOrigin) lastRequestOrigin = reqOrigin
                        // Force Origin to target if not present
                        if (!reqOrigin) {
                            details.requestHeaders['Origin'] = TARGET_ORIGIN
                            lastRequestOrigin = TARGET_ORIGIN
                        }
                    }
                } catch (e) { /* ignore */ }
                callback({ requestHeaders: details.requestHeaders })
            })

            session.webRequest.onHeadersReceived((details, callback) => {
                const responseHeaders = details.responseHeaders || {}
                try {
                    const url = new URL(details.url)
                    if (url.origin === TARGET_ORIGIN) {
                        const allowOrigin = lastRequestOrigin || 'http://localhost:8080'
                        const setHeader = (key, value) => {
                            responseHeaders[key] = [value]
                            responseHeaders[key.toLowerCase()] = [value]
                        }
                        setHeader('Access-Control-Allow-Origin', allowOrigin)
                        setHeader('Vary', 'Origin')
                        setHeader('Access-Control-Allow-Headers', details.requestHeaders['Access-Control-Request-Headers'] || '*')
                        setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
                        setHeader('Access-Control-Allow-Credentials', 'true')
                    }
                } catch (e) { /* ignore */ }
                callback({ responseHeaders })
            })
        } catch (e) {
            console.warn('CORS helper setup failed:', e)
        }
    }

    // Set up session to persist cookies and local storage
    session.setPermissionRequestHandler((webContents, permission, callback) => {
        // Grant permissions for storage-related requests
        if (permission === 'persistent-storage') {
            callback(true);
        } else {
            callback(false);
        }
    });

    // Configure cookie settings for persistence
    session.cookies.on('changed', (_event, cookie, cause, removed) => {
        if (!removed) {
            console.log('Cookie saved:', cookie.name);
        }
    });

    // Get configuration based on environment
    const env = isElectronProdRun ? 'productionHosted' : (isDev ? 'development' : 'production');
    const startUrl = config[env].primary;
    const fallbackUrl = config[env].fallback;

    console.log('Environment:', env);
    console.log('Primary URL:', startUrl);
    console.log('Fallback URL:', fallbackUrl);

    // Try to load primary URL first
    mainWindow.loadURL(startUrl)
        .then(() => {
            console.log('Successfully loaded primary URL:', startUrl);
        })
        .catch((error) => {
            console.error('Failed to load primary URL:', error);
            console.log('Attempting fallback URL:', fallbackUrl);

            return mainWindow.loadURL(fallbackUrl)
                .then(() => {
                    console.log('Successfully loaded fallback URL:', fallbackUrl);
                })
                .catch((fallbackError) => {
                    console.error('Failed to load fallback URL:', fallbackError);
                    // Show error page or dialog
                    showConnectionError(env);
                });
        });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // Don't auto-open DevTools - user can open manually if needed
        // DevTools can still be opened via menu: View -> Toggle Developer Tools

        // Debug information
        console.log('Window ready to show');
        console.log('Current URL:', mainWindow.webContents.getURL());

        // Check if page loaded properly
        mainWindow.webContents.executeJavaScript(`
      console.log('Page title:', document.title);
      console.log('Body content:', document.body.innerHTML.substring(0, 200));
      console.log('Vue app element:', document.getElementById('app'));
    `);
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevent clearing session data on window close
    mainWindow.on('close', (event) => {
        console.log('Window closing - session data will be preserved');
        // Don't prevent the close, just log that data should be preserved
    });

    // Save window state before closing
    mainWindow.on('close', () => {
        // Save window bounds for next startup
        const bounds = mainWindow.getBounds();
        // You could save these bounds to a config file if needed
        console.log('Saving window bounds:', bounds);
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // In hosted production, allow OAuth popup windows inside the app to preserve session cookies
        if (isElectronProdRun) {
            try {
                const u = new URL(url)
                const hostedOrigin = new URL(HOSTED_WEBSITE_URL).origin
                const isGoogleOauth = u.origin === 'https://accounts.google.com'
                const isHostedAuthFlow = (u.origin === hostedOrigin) && /\/auth\/oauth\//.test(u.pathname)
                if (isGoogleOauth || isHostedAuthFlow) {
                    return {
                        action: 'allow',
                        overrideBrowserWindowOptions: {
                            parent: mainWindow,
                            modal: false,
                            width: 600,
                            height: 700,
                            resizable: true,
                            title: 'Sign in',
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true,
                                preload: path.join(__dirname, 'preload.js'),
                                webSecurity: true,
                                partition: 'persist:kason-tools'
                            }
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }
        // Otherwise open in the system browser
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // When a popup is created via window.open, monitor it and close on callback, then refresh main window
    mainWindow.webContents.on('did-create-window', (childWindow, details) => {
        try {
            const hostedOrigin = new URL(HOSTED_WEBSITE_URL).origin
            const isHosted = isElectronProdRun
            if (!isHosted) return

            const maybeHandleUrl = (targetUrl) => {
                try {
                    const u = new URL(targetUrl)
                    // Detect return to hosted callback path
                    if (u.origin === hostedOrigin && /\/auth\/oauth\//.test(u.pathname)) {
                        // Close popup and refresh main app to pick up session state
                        try { childWindow.close() } catch (_) {}
                        try { mainWindow.webContents.reloadIgnoringCache() } catch (_) {}
                    }
                } catch (_) { /* ignore */ }
            }

            childWindow.webContents.on('will-redirect', (event, targetUrl) => {
                maybeHandleUrl(targetUrl)
            })
            childWindow.webContents.on('did-navigate', (event, targetUrl) => {
                maybeHandleUrl(targetUrl)
            })
        } catch (e) { /* ignore */ }
    })

    // Prevent navigation to external websites
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        // Allow navigation within your app
        const allowedOrigins = [
            'http://localhost:8080',
            'http://localhost:9991',
            'http://kason-server.local',
            'http://kason-server.local:9991',
            'http://kason-pi.local',
            'file://'
        ];
        // Dynamically allow hosted website when in electron-prod
        try {
            if (isElectronProdRun && HOSTED_WEBSITE_URL) {
                const origin = new URL(HOSTED_WEBSITE_URL).origin;
                if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
                // Also allow Google OAuth for sign-in flows from the hosted site
                const googleOauthOrigin = 'https://accounts.google.com';
                if (!allowedOrigins.includes(googleOauthOrigin)) allowedOrigins.push(googleOauthOrigin);
            }
        } catch (e) { /* ignore */ }

        const isAllowed = allowedOrigins.some(origin =>
            navigationUrl.startsWith(origin)
        );

        if (!isAllowed) {
            console.log('Preventing external navigation to:', navigationUrl);
            event.preventDefault();
            // Optionally open in external browser for unsupported domains
            // shell.openExternal(navigationUrl);
        }
    });
}

// Create application menu with DevTools support
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.reload();
                        }
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.reloadIgnoringCache();
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.toggleDevTools();
                        }
                    }
                },
                {
                    label: 'Toggle Fullscreen',
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                        }
                    }
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                        }
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                        }
                    }
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.minimize();
                        }
                    }
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.close();
                        }
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    label: 'About ' + app.getName(),
                    role: 'about'
                },
                { type: 'separator' },
                {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                },
                { type: 'separator' },
                {
                    label: 'Hide ' + app.getName(),
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    role: 'hideothers'
                },
                {
                    label: 'Show All',
                    role: 'unhide'
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: () => app.quit()
                }
            ]
        });

        // Window menu adjustments for macOS
        template[3].submenu = [
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Zoom',
                role: 'zoom'
            },
            { type: 'separator' },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC handlers for DevTools and other functionality
ipcMain.handle('toggle-devtools', () => {
    if (mainWindow) {
        mainWindow.webContents.toggleDevTools();
    }
});

// Register/unregister global hotkeys via IPC (user-configured only)
ipcMain.handle('register-global-hotkeys', (event, mapping) => {
    const result = applyGlobalHotkeys(mapping || {})
    persistGlobalHotkeys(result.normalized)
    return result
})

ipcMain.handle('unregister-global-hotkeys', () => {
    try { globalShortcut.unregisterAll() } catch (_) {}
    persistGlobalHotkeys({})
    return { cleared: true }
})

// Add IPC to allow renderer to request a navigation (optional helper)
ipcMain.handle('request-navigate', (event, active, extra) => {
    navigateToMode(active, extra || {})
})

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// App event handlers
app.whenReady().then(() => {
    loadRuntimeEnv();
    createWindow();
    createMenu();

    // Restore previously saved shortcuts so they are active as soon as the app launches
    const restoredHotkeys = loadPersistedHotkeys()
    if (restoredHotkeys) {
        const result = applyGlobalHotkeys(restoredHotkeys)
        const failedCount = (result.failed.tabs.length || 0) + (result.failed.modes.length || 0)
        if (failedCount > 0) {
            console.warn('Some persisted global hotkeys could not be registered on launch:', result.failed)
        }
    }

    console.log('App user data path:', app.getPath('userData'));
    console.log('App cache path:', app.getPath('sessionData'));

    // On macOS, re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Configure app-level settings for data persistence
app.on('ready', () => {
    // Ensure session data is not cleared
    app.on('before-quit', (_event) => {
        console.log('App is quitting - preserving session data');
        // Don't clear any session data here
    });
});

// Unregister on quit to clean up system resources
app.on('will-quit', () => {
    try { globalShortcut.unregisterAll() } catch (_) {}
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't call session.clearStorageData() here
        app.quit();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// Additional security configurations
app.on('ready', () => {
    // Prevent navigation to external protocols
    app.on('open-url', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
        // In development, ignore certificate errors
        event.preventDefault();
        callback(true);
    } else {
        // In production, use default behavior
        callback(false);
    }
});

// Show connection error dialog
function showConnectionError(env) {
    const { dialog } = require('electron');

    let message;
    if (env === 'development') {
        message = 'Unable to connect to the development server. Please check:\n\n' +
            '1. Run "npm run serve" to start the Vue development server\n' +
            '2. Ensure localhost:8080 is accessible\n' +
            '3. Check if another process is using port 8080';
    } else if (env === 'productionHosted') {
        message = 'Unable to load the hosted website at ' + HOSTED_WEBSITE_URL + '. Please check your network connectivity and try again.';
    } else {
        message = 'Unable to connect to the production server. Please check:\n\n' +
            '1. Server is running at kason-server.local:9991\n' +
            '2. Network connection is working\n' +
            '3. Firewall settings allow the connection\n' +
            '4. DNS resolution for kason-server.local is working';
    }

    dialog.showErrorBox('Connection Error', message);
}

// Export for testing
module.exports = { createWindow };
