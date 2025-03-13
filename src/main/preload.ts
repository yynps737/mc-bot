import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    isElectron: true,
    loginOffline: (username: string) => ipcRenderer.invoke('login-offline', username),
    loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
    getMinecraftVersions: () => ipcRenderer.invoke('get-minecraft-versions'),
    connectToServer: (data: {
        serverIp: string,
        serverPort: number,
        version: string,
        username: string,
        token?: string
    }) => ipcRenderer.invoke('connect-to-server', data),
    sendChatMessage: (message: string) => ipcRenderer.invoke('send-chat-message', message),
    disconnectFromServer: () => ipcRenderer.invoke('disconnect-from-server'),
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
    onGameEvent: (callback: (event: string, data: any) => void) => {
        const listener = (_: any, event: string, data: any) => callback(event, data);
        ipcRenderer.on('game-event', listener);
        return () => ipcRenderer.removeListener('game-event', listener);
    },
    getPlugins: () => ipcRenderer.invoke('get-plugins'),
    enablePlugin: (pluginId: string) => ipcRenderer.invoke('enable-plugin', pluginId),
    disablePlugin: (pluginId: string) => ipcRenderer.invoke('disable-plugin', pluginId),
    getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
    setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),
    getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
    getLogs: (maxEntries?: number) => ipcRenderer.invoke('get-logs', maxEntries),
    openPluginsFolder: () => ipcRenderer.invoke('open-plugins-folder'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getMicrosoftClientIdStatus: () => ipcRenderer.invoke('get-microsoft-client-id-status'),
});

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximizeRestore: () => ipcRenderer.send('window-maximize-restore'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    platform: process.platform
});