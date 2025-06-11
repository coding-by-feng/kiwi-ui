const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');

// Keep a global reference of the window object
let mainWindow;

// Configure auto-updater
if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
}

// Function to detect available port for dev server
async function getDevServerUrl() {
    const ports = [8080, 8081, 8082, 3000, 3001];

    for (const port of ports) {
        try {
            const url = `http://localhost:${port}`;
            // Try to fetch from the port to see if Vue dev server is running
            const response = await fetch(url).catch(() => null);
            if (response && response.ok) {
                console.log(`Found Vue dev server at: ${url}`);
                return url;
            }
        } catch (error) {
            // Continue to next port
        }
    }

    console.log('No Vue dev server found, using built files');
    return null;
}

async function createWindow() {
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
            webSecurity: false, // Needed for local file access and CORS
            devTools: false, // Disable DevTools completely
        },
        icon: path.join(__dirname, process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
        // macOS window customization
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        titleBarOverlay: process.platform === 'darwin' ? false : undefined,
        // Hide window controls on macOS
        ...(process.platform === 'darwin' && {
            titleBarStyle: 'hidden', // Hide the entire title bar
            trafficLightPosition: { x: -100, y: -100 }, // Move buttons off-screen
        }),
        // Alternative: Custom title bar for all platforms
        // frame: false, // Removes all window chrome (title bar, borders)
        show: false, // Don't show until ready
        resizable: true, // You can set to false if you don't want resizing
        maximizable: true, // Set to false to disable maximize
        minimizable: true, // Set to false to disable minimize
        closable: true, // Set to false to disable close (not recommended)
    });

    // Determine the URL to load
    let startUrl;

    if (isDev) {
        // Try to find the Vue dev server
        const devServerUrl = await getDevServerUrl();
        if (devServerUrl) {
            startUrl = devServerUrl;
        } else {
            // Fallback to built files if dev server is not available
            startUrl = `file://${path.join(__dirname, '../dist/index.html')}`;
            console.log('Dev server not found, falling back to built files');
            console.log('Make sure to run "npm run build" first, or use "npm run electron-dev" for development');
        }
    } else {
        startUrl = `file://${path.join(__dirname, '../dist/index.html')}`;
    }

    console.log(`Loading URL: ${startUrl}`);
    console.log(`isDev: ${isDev}`);
    console.log(`__dirname: ${__dirname}`);

    try {
        await mainWindow.loadURL(startUrl);
        console.log('Successfully loaded URL');
    } catch (error) {
        console.error('Failed to load URL:', error);

        // Show error dialog
        dialog.showErrorBox(
            'Failed to Load Application',
            `Could not load the application from: ${startUrl}\n\n` +
            `Error: ${error.message}\n\n` +
            `If you're in development mode, make sure the Vue dev server is running.\n` +
            `Run "npm run serve" in another terminal, or use "npm run electron-dev" instead.`
        );
    }

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // DO NOT open DevTools automatically - removed for production
        // if (isDev) {
        //   mainWindow.webContents.openDevTools();
        // }
    });

    // Disable F12 and other DevTools shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // Disable F12
        if (input.key === 'F12') {
            event.preventDefault();
        }

        // Disable Ctrl+Shift+I / Cmd+Opt+I (DevTools)
        if ((input.control || input.meta) && input.shift && input.key === 'I') {
            event.preventDefault();
        }

        // Disable Ctrl+Shift+J / Cmd+Opt+J (Console)
        if ((input.control || input.meta) && input.shift && input.key === 'J') {
            event.preventDefault();
        }

        // Disable Ctrl+U / Cmd+U (View Source)
        if ((input.control || input.meta) && input.key === 'U') {
            event.preventDefault();
        }
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

    // Prevent navigation to external URLs
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.origin !== startUrl.split('/').slice(0, 3).join('/')) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Create application menu
    createMenu();
}

function createMenu() {
    // For production, create a minimal menu without DevTools options
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Window',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => createWindow()
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
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Kiwi Vocabulary',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Kiwi Vocabulary',
                            message: 'Kiwi Vocabulary v0.1.0',
                            detail: 'A vocabulary learning application built with Vue.js and Electron.',
                            buttons: ['OK']
                        });
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
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Window menu for macOS (without DevTools)
        template[4].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// IPC handlers for renderer process communication
ipcMain.handle('app-version', () => {
    return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

// Window control handlers for custom title bar
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

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    autoUpdater.quitAndInstall();
});