import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import { initialize as initializeLogger, getLogger } from './core/utils/logger';
import { initializeProtocol, setMainWindow } from './core/network/protocol';
import { initializePlugins } from './core/plugins/loader';

const logger = getLogger('main');

// Initialize core systems
initializeLogger();
initializeProtocol();
initializePlugins();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    logger.info('Creating main window');

    // 确保preload脚本路径正确
    const preloadScript = path.join(__dirname, 'preload.js');
    logger.info(`Using preload script: ${preloadScript}`);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: preloadScript,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // 设置窗口标题
    mainWindow.setTitle('Minecraft Client');

    // 设置主窗口引用
    if (typeof setMainWindow === 'function') {
        setMainWindow(mainWindow);
    } else {
        logger.error('setMainWindow function not available');
    }

    // 根据环境决定加载方式
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        // 开发模式 - 从开发服务器加载
        const serverUrl = 'http://localhost:3000';
        logger.info(`Loading from dev server: ${serverUrl}`);

        // 立即打开开发者工具以便调试
        mainWindow.webContents.openDevTools();

        // 延时加载确保开发服务器准备就绪
        setTimeout(() => {
            if (mainWindow) {
                mainWindow.loadURL(serverUrl)
                    .then(() => {
                        logger.info('Successfully loaded from dev server');
                    })
                    .catch((err) => {
                        logger.error(`Failed to load from dev server: ${err}`);
                        // 尝试备用加载方式
                        mainWindow?.loadFile(path.join(__dirname, '../../src/renderer/index.html'))
                            .catch(e => logger.error(`Also failed to load from file: ${e}`));
                    });
            }
        }, 1000); // 给予 Vite 服务器 1 秒准备时间
    } else {
        // 生产模式 - 从构建文件加载
        const filePath = path.join(__dirname, '../renderer/index.html');
        logger.info(`Loading from file: ${filePath}`);
        mainWindow.loadFile(filePath)
            .catch(err => logger.error(`Failed to load from file: ${err}`));
    }

    mainWindow.on('closed', () => {
        logger.info('Main window closed');
        mainWindow = null;
    });
}

app.on('ready', () => {
    logger.info('App is ready, creating window');
    createWindow();

    // 检查更新
    if (!app.isPackaged) {
        logger.info('Development mode, skipping update check');
    } else {
        logger.info('Checking for updates');
        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on('window-all-closed', () => {
    logger.info('All windows closed');
    if (process.platform !== 'darwin') {
        logger.info('Quitting app');
        app.quit();
    }
});

app.on('activate', () => {
    logger.info('App activated');
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

// 添加插件相关的IPC处理器
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

// Auto-update events
autoUpdater.on('update-available', () => {
    logger.info('Update available');
    if (mainWindow) {
        mainWindow.webContents.send('update-available');
    }
});

autoUpdater.on('update-downloaded', () => {
    logger.info('Update downloaded');
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded');
    }
});

ipcMain.handle('install-update', () => {
    logger.info('Installing update');
    autoUpdater.quitAndInstall();
});