interface Window {
    api?: {
        isElectron?: boolean;
        loginOffline: (username: string) => Promise<{
            success: boolean;
            username: string;
            uuid: string;
            error?: string;
        }>;
        loginMicrosoft: () => Promise<{
            success: boolean;
            username?: string;
            uuid?: string;
            token?: string;
            error?: string;
        }>;
        getMinecraftVersions: () => Promise<{
            id: string;
            type: string;
            releaseTime: string;
            supported: boolean;
        }[]>;
        connectToServer: (data: {
            serverIp: string;
            serverPort: number;
            version: string;
            username: string;
            token?: string;
        }) => Promise<{
            success: boolean;
            error?: string;
        }>;
        sendChatMessage: (message: string) => Promise<boolean>;
        disconnectFromServer?: () => Promise<boolean>;
        onUpdateAvailable?: (callback: () => void) => () => void;
        onUpdateDownloaded?: (callback: () => void) => () => void;
        installUpdate?: () => Promise<void>;
        onGameEvent?: (callback: (event: string, data: any) => void) => () => void;
        getPlugins?: () => Promise<{
            id: string;
            name: string;
            version: string;
            description: string;
            author: string;
            isActive: boolean;
        }[]>;
        enablePlugin?: (pluginId: string) => Promise<boolean>;
        disablePlugin?: (pluginId: string) => Promise<boolean>;
        getSetting?: (key: string) => Promise<any>;
        setSetting?: (key: string, value: any) => Promise<boolean>;
        getAllSettings?: () => Promise<Record<string, any>>;
        getLogs?: (maxEntries?: number) => Promise<string[]>;
        openPluginsFolder?: () => Promise<string>;
        getAppVersion?: () => Promise<string>;
    };

    electron?: {
        minimize: () => void;
        maximizeRestore: () => void;
        close: () => void;
        isMaximized: () => Promise<boolean>;
        platform: string;
    };
}