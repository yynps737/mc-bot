// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// 添加调试输出
console.log('预加载脚本正在运行...');

// 暴露受保护的方法，允许渲染进程使用IPC
contextBridge.exposeInMainWorld(
    'api', {
        // 标识在Electron环境中运行
        isElectron: true,

        // 认证相关
        loginOffline: (username: string) => ipcRenderer.invoke('login-offline', username),
        loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),

        // Minecraft版本相关
        getMinecraftVersions: () => ipcRenderer.invoke('get-minecraft-versions'),

        // 服务器连接相关
        connectToServer: (data: {
            serverIp: string,
            serverPort: number,
            version: string,
            username: string,
            token?: string
        }) => ipcRenderer.invoke('connect-to-server', data),

        // 游戏聊天相关
        sendChatMessage: (message: string) => ipcRenderer.invoke('send-chat-message', message),
        disconnectFromServer: () => ipcRenderer.invoke('disconnect-from-server'),

        // 应用更新相关
        onUpdateAvailable: (callback: () => void) => {
            const listener = () => callback();
            ipcRenderer.on('update-available', listener);
            return () => ipcRenderer.removeListener('update-available', listener);
        },
        onUpdateDownloaded: (callback: () => void) => {
            const listener = () => callback();
            ipcRenderer.on('update-downloaded', listener);
            return () => ipcRenderer.removeListener('update-downloaded', listener);
        },
        installUpdate: () => ipcRenderer.invoke('install-update'),

        // 游戏事件
        onGameEvent: (callback: (event: string, data: any) => void) => {
            const listener = (_: any, event: string, data: any) => callback(event, data);
            ipcRenderer.on('game-event', listener);
            return () => ipcRenderer.removeListener('game-event', listener);
        },

        // 插件相关
        getPlugins: () => ipcRenderer.invoke('get-plugins'),
        enablePlugin: (pluginId: string) => ipcRenderer.invoke('enable-plugin', pluginId),
        disablePlugin: (pluginId: string) => ipcRenderer.invoke('disable-plugin', pluginId),

        // 应用设置相关
        getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
        setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),
        getAllSettings: () => ipcRenderer.invoke('get-all-settings'),

        // 日志相关
        getLogs: (maxEntries?: number) => ipcRenderer.invoke('get-logs', maxEntries),
        clearLogs: () => ipcRenderer.invoke('clear-logs'),

        // 文件与系统相关
        openPluginsFolder: () => ipcRenderer.invoke('open-plugins-folder'),
        getAppVersion: () => ipcRenderer.invoke('get-app-version'),
        exportLogs: (filePath: string) => ipcRenderer.invoke('export-logs', filePath)
    }
);

// 暴露窗口控制功能
contextBridge.exposeInMainWorld(
    'electron', {
        // 窗口控制
        minimize: () => ipcRenderer.send('window-minimize'),
        maximizeRestore: () => ipcRenderer.send('window-maximize-restore'),
        close: () => ipcRenderer.send('window-close'),

        // 窗口状态
        isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

        // 系统信息
        platform: process.platform
    }
);

console.log('Electron API 已暴露到渲染进程');