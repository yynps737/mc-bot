import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import { initialize as initializeLogger, getLogger } from './core/utils/logger';
import { initializeProtocol } from './core/network/protocol';
import { initializePlugins } from './core/plugins/loader';

const logger = getLogger('main');

// Initialize core systems
initializeLogger();
initializeProtocol();
initializePlugins();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        // In development, load from dev server
        mainWindow.loadURL('http://localhost:3000');
        // Open DevTools automatically in development
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load from built files
        mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();

    // Check for updates
    if (process.env.NODE_ENV !== 'development') {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC handlers for renderer process communication
ipcMain.handle('get-minecraft-versions', async () => {
    const { getAvailableVersions } = await import('./core/network/version');
    return getAvailableVersions();
});

ipcMain.handle('login-offline', async (_, username: string) => {
    const { loginOffline } = await import('./core/auth/offline');
    return loginOffline(username);
});

ipcMain.handle('login-microsoft', async () => {
    const { startMicrosoftAuth } = await import('./core/auth/microsoft');
    return startMicrosoftAuth();
});

ipcMain.handle('connect-to-server', async (_, data: {
    serverIp: string,
    serverPort: number,
    version: string,
    username: string,
    token?: string
}) => {
    const { connectToServer } = await import('./core/network/protocol');
    return connectToServer(data);
});

// Auto-update events
autoUpdater.on('update-available', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update-available');
    }
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded');
    }
});

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
});