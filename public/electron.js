const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev'); // Use dynamic detection instead of hardcoded false

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
            webSecurity: !isDev, // Disable web security in development for CORS
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
    session.cookies.on('changed', (event, cookie, cause, removed) => {
        if (!removed) {
            console.log('Cookie saved:', cookie.name);
        }
    });

    // Get configuration based on environment
    const env = isDev ? 'development' : 'production';
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
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation to external websites
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        // Allow navigation within your app
        const allowedOrigins = [
            'http://localhost:8080',
            'http://kason-server.local',
            'file://'
        ];

        const isAllowed = allowedOrigins.some(origin =>
            navigationUrl.startsWith(origin)
        );

        if (!isAllowed) {
            console.log('Preventing external navigation to:', navigationUrl);
            event.preventDefault();
            // Optionally open in external browser
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
    createWindow();
    createMenu();

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
    app.on('before-quit', (event) => {
        console.log('App is quitting - preserving session data');
        // Don't clear any session data here
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't call session.clearStorageData() here
        app.quit();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
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