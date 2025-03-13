// src/main/index.ts
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import { initialize as initializeLogger, getLogger, getLogEntries } from './core/utils/logger';
import { initializeProtocol, setMainWindow, sendChatMessage, disconnect } from './core/network/protocol';
import { initializePlugins } from './core/plugins/loader';

const logger = getLogger('main');
const store = new Store();

// 初始化核心系统
initializeLogger();
initializeProtocol();
initializePlugins();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    logger.info('创建主窗口');

    // 确保preload脚本路径正确
    const preloadScript = path.join(__dirname, 'preload.js');
    logger.info(`使用预加载脚本: ${preloadScript}`);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: preloadScript,
            contextIsolation: true,
            nodeIntegration: false,
        },
        // 现代化UI设置
        backgroundColor: '#111827', // 暗色背景，与应用主题匹配
        titleBarStyle: 'hidden',    // 隐藏默认标题栏
        frame: false,               // 无边框窗口
        show: false,                // 初始不显示，等待ready-to-show事件
    });

    // 设置窗口标题
    mainWindow.setTitle('我的世界客户端');

    // 设置主窗口引用
    if (typeof setMainWindow === 'function') {
        setMainWindow(mainWindow);
    } else {
        logger.error('setMainWindow函数不可用');
    }

    // 等待窗口准备好再显示
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // 根据环境决定加载方式
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        // 开发模式 - 从开发服务器加载
        const serverUrl = 'http://localhost:3000';
        logger.info(`从开发服务器加载: ${serverUrl}`);

        // 立即打开开发者工具以便调试
        mainWindow.webContents.openDevTools();

        // 延时加载确保开发服务器准备就绪
        setTimeout(() => {
            if (mainWindow) {
                mainWindow.loadURL(serverUrl)
                    .then(() => {
                        logger.info('成功从开发服务器加载');
                    })
                    .catch((err) => {
                        logger.error(`从开发服务器加载失败: ${err}`);
                        // 尝试备用加载方式
                        mainWindow?.loadFile(path.join(__dirname, '../../src/renderer/index.html'))
                            .catch(e => logger.error(`也无法从文件加载: ${e}`));
                    });
            }
        }, 1000); // 给予Vite服务器1秒准备时间
    } else {
        // 生产模式 - 从构建文件加载
        const filePath = path.join(__dirname, '../renderer/index.html');
        logger.info(`从文件加载: ${filePath}`);
        mainWindow.loadFile(filePath)
            .catch(err => logger.error(`从文件加载失败: ${err}`));
    }

    mainWindow.on('closed', () => {
        logger.info('主窗口已关闭');
        mainWindow = null;
    });
}

app.on('ready', () => {
    logger.info('应用已就绪，创建窗口');
    createWindow();

    // 检查更新
    if (!app.isPackaged) {
        logger.info('开发模式，跳过更新检查');
    } else {
        logger.info('检查更新');
        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on('window-all-closed', () => {
    logger.info('所有窗口已关闭');
    if (process.platform !== 'darwin') {
        logger.info('退出应用');
        app.quit();
    }
});

app.on('activate', () => {
    logger.info('应用已激活');
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC处理器 - 版本和认证
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

// IPC处理器 - 服务器连接
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

// IPC处理器 - 游戏交互
ipcMain.handle('send-chat-message', async (_, message: string) => {
    logger.info(`发送聊天消息: ${message}`);
    return sendChatMessage(message);
});

ipcMain.handle('disconnect-from-server', async () => {
    logger.info('从服务器断开连接');
    disconnect();
    return true;
});

// IPC处理器 - 插件管理
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

// IPC处理器 - 设置管理
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

// IPC处理器 - 日志管理
ipcMain.handle('get-logs', async (_, maxEntries = 100) => {
    return getLogEntries(maxEntries);
});

ipcMain.handle('clear-logs', async () => {
    logger.info('清除日志请求');
    // 实际清除日志的逻辑需要在logger.ts中实现
    return true;
});

// IPC处理器 - 文件系统操作
ipcMain.handle('open-plugins-folder', async () => {
    const pluginsPath = path.join(app.getPath('userData'), 'plugins');
    logger.info(`打开插件文件夹: ${pluginsPath}`);
    return shell.openPath(pluginsPath);
});

ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
});

ipcMain.handle('export-logs', async (_, filePath: string) => {
    // 实现日志导出逻辑
    logger.info(`导出日志到: ${filePath}`);
    return true;
});

// 自动更新事件处理
autoUpdater.on('update-available', () => {
    logger.info('有可用更新');
    if (mainWindow) {
        mainWindow.webContents.send('update-available');
    }
});

autoUpdater.on('update-downloaded', () => {
    logger.info('更新已下载');
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded');
    }
});

ipcMain.handle('install-update', () => {
    logger.info('安装更新');
    autoUpdater.quitAndInstall();
});

// 窗口控制IPC处理器
ipcMain.on('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('window-maximize-restore', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});