import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld(
    'api', {
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
            ipcRenderer.on('update-available', callback);
            return () => ipcRenderer.removeListener('update-available', callback);
        },
        onUpdateDownloaded: (callback: () => void) => {
            ipcRenderer.on('update-downloaded', callback);
            return () => ipcRenderer.removeListener('update-downloaded', callback);
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