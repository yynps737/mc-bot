/**
 * Type definitions for the IPC API exposed by the Electron preload script
 */

interface Window {
    api: {
        // Authentication
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

        // Minecraft versions
        getMinecraftVersions: () => Promise<{
            id: string;
            type: string;
            releaseTime: string;
            supported: boolean;
        }[]>;

        // Server connection
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

        // App updates
        onUpdateAvailable: (callback: () => void) => () => void;
        onUpdateDownloaded: (callback: () => void) => () => void;
        installUpdate: () => Promise<void>;

        // Game events
        onGameEvent: (callback: (event: string, data: any) => void) => () => void;

        // Plugin related
        getPlugins: () => Promise<{
            id: string;
            name: string;
            version: string;
            description: string;
            author: string;
            isActive: boolean;
        }[]>;

        enablePlugin: (pluginId: string) => Promise<boolean>;
        disablePlugin: (pluginId: string) => Promise<boolean>;
    };
}