const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = false;

// Keep a global reference of the window object
let mainWindow;

// Configuration for different environments
const config = {
    development: {
        primary: 'http://localhost:8080',
        fallback: 'http://localhost:3000' // Alternative dev port
    },
    production: {
        primary: 'http://kason-server.local',
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
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            devTools: true, // Always enable DevTools
            webSecurity: !isDev // Disable web security in development for CORS
        },
        icon: path.join(__dirname, 'icon.png'), // App icon
        show: false // Don't show until ready
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

        // Auto-open DevTools in development
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }

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

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation to external websites
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.origin !== 'http://localhost:8080' && parsedUrl.origin !== 'file://') {
            event.preventDefault();
            shell.openExternal(navigationUrl);
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

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createMenu();

    // On macOS, re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
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