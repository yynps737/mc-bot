import { contextBridge, ipcRenderer } from 'electron';

// 添加调试输出
console.log('预加载脚本正在运行...');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld(
    'api', {
        // 标识在Electron环境中运行
        isElectron: true,

        // Authentication
        loginOffline: (username: string) => ipcRenderer.invoke('login-offline', username),
        loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),

        // Minecraft versions
        getMinecraftVersions: () => ipcRenderer.invoke('get-minecraft-versions'),

        // Server connection
        connectToServer: (data: {
            serverIp: string,
            serverPort: number,
            version: string,
            username: string,
            token?: string
        }) => ipcRenderer.invoke('connect-to-server', data),

        // App updates
        onUpdateAvailable: (callback: () => void) => {
            const channel = 'update-available';
            ipcRenderer.on(channel, () => callback());
            return () => ipcRenderer.removeListener(channel, callback);
        },
        onUpdateDownloaded: (callback: () => void) => {
            const channel = 'update-downloaded';
            ipcRenderer.on(channel, () => callback());
            return () => ipcRenderer.removeListener(channel, callback);
        },
        installUpdate: () => ipcRenderer.invoke('install-update'),

        // Game events
        onGameEvent: (callback: (event: string, data: any) => void) => {
            const listener = (_: any, event: string, data: any) => callback(event, data);
            ipcRenderer.on('game-event', listener);
            return () => ipcRenderer.removeListener('game-event', listener);
        },

        // Plugin related
        getPlugins: () => ipcRenderer.invoke('get-plugins'),
        enablePlugin: (pluginId: string) => ipcRenderer.invoke('enable-plugin', pluginId),
        disablePlugin: (pluginId: string) => ipcRenderer.invoke('disable-plugin', pluginId)
    }
);

console.log('Electron API 已暴露到渲染进程');