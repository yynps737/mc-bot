import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import { initialize as initializeLogger, getLogger, getLogEntries } from './core/utils/logger';
import { initializeProtocol, setMainWindow, sendChatMessage, disconnect } from './core/network/protocol';
import { initializePlugins } from './core/plugins/loader';
import { getMicrosoftClientId } from './core/utils/config';

const logger = getLogger('main');
const store = new Store();

initializeLogger();
initializeProtocol();
initializePlugins();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    const preloadScript = app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(process.cwd(), 'dist/main/preload.js');

    mainWindow = new BrowserWindow({
        width: 1000, height: 680,
        webPreferences: { preload: preloadScript, contextIsolation: true, nodeIntegration: false },
        backgroundColor: '#fdf2f8', titleBarStyle: 'hidden', frame: false, show: false
    });

    mainWindow.setTitle('Minecraft 客户端');
    if (typeof setMainWindow === 'function') setMainWindow(mainWindow);
    mainWindow.once('ready-to-show', () => mainWindow?.show());

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        mainWindow.webContents.openDevTools();
        setTimeout(() => {
            mainWindow?.loadURL('http://localhost:3000').catch(() => {
                mainWindow?.loadFile(path.join(process.cwd(), 'dist/renderer/index.html'));
            });
        }, 1000);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', () => {
    createWindow();
    if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

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
    serverIp: string, serverPort: number, version: string, username: string, token?: string
}) => {
    const { connectToServer } = await import('./core/network/protocol');
    return connectToServer(data);
});

ipcMain.handle('send-chat-message', async (_, message: string) => {
    return sendChatMessage(message);
});

ipcMain.handle('disconnect-from-server', async () => {
    disconnect();
    return true;
});

ipcMain.handle('get-plugins', async () => {
    const { getPluginManager } = await import('./core/plugins/loader');
    return getPluginManager().getPluginList();
});

ipcMain.handle('enable-plugin', async (_, pluginId: string) => {
    const { getPluginManager } = await import('./core/plugins/loader');
    return getPluginManager().enablePlugin(pluginId);
});

ipcMain.handle('disable-plugin', async (_, pluginId: string) => {
    const { getPluginManager } = await import('./core/plugins/loader');
    return getPluginManager().disablePlugin(pluginId);
});

ipcMain.handle('get-setting', async (_, key: string) => {
    return store.get(key);
});

ipcMain.handle('set-setting', async (_, key: string, value: any) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('get-all-settings', async () => {
    return store.store;
});

ipcMain.handle('get-logs', async (_, maxEntries = 100) => {
    return getLogEntries(maxEntries);
});

ipcMain.handle('open-plugins-folder', async () => {
    const pluginsPath = path.join(app.getPath('userData'), 'plugins');
    if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath, { recursive: true });
    return shell.openPath(pluginsPath);
});

ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
});

ipcMain.handle('get-microsoft-client-id-status', async () => {
    const clientId = getMicrosoftClientId();
    return {
        configured: !!clientId,
        canConfigure: false // 表示不能通过UI配置
    };
});

autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded');
});

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-maximize-restore', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) mainWindow.restore();
        else mainWindow.maximize();
    }
});
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle('window-is-maximized', () => { return mainWindow ? mainWindow.isMaximized() : false; });