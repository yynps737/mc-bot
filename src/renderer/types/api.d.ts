// src/renderer/types/api.d.ts
/**
 * 由Electron预加载脚本暴露的IPC API的类型定义
 */

interface Window {
    api?: {
        // 标识是否在Electron环境中
        isElectron?: boolean;

        // 认证相关
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

        // Minecraft版本相关
        getMinecraftVersions: () => Promise<{
            id: string;
            type: string;
            releaseTime: string;
            supported: boolean;
        }[]>;

        // 服务器连接相关
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

        // 游戏交互相关
        sendChatMessage: (message: string) => Promise<boolean>;
        disconnectFromServer?: () => Promise<boolean>;

        // 应用更新相关
        onUpdateAvailable?: (callback: () => void) => () => void;
        onUpdateDownloaded?: (callback: () => void) => () => void;
        installUpdate?: () => Promise<void>;

        // 游戏事件
        onGameEvent?: (callback: (event: string, data: any) => void) => () => void;

        // 插件相关
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

        // 设置相关
        getSetting?: (key: string) => Promise<any>;
        setSetting?: (key: string, value: any) => Promise<boolean>;
        getAllSettings?: () => Promise<Record<string, any>>;

        // 日志相关
        getLogs?: (maxEntries?: number) => Promise<string[]>;
        clearLogs?: () => Promise<boolean>;

        // 文件系统相关
        openPluginsFolder?: () => Promise<string>;
        getAppVersion?: () => Promise<string>;
        exportLogs?: (filePath: string) => Promise<boolean>;
    };

    // 添加electron窗口控制API
    electron?: {
        // 窗口控制
        minimize: () => void;
        maximizeRestore: () => void;
        close: () => void;

        // 窗口状态
        isMaximized: () => Promise<boolean>;

        // 系统信息
        platform: string;
    };
}

/**
 * i18n相关类型定义
 */
declare module 'renderer/utils/i18n' {
    export type LanguageCode = 'zh-CN' | 'en-US';

    export const DEFAULT_LANGUAGE: LanguageCode;

    export function setLanguage(language: LanguageCode): void;
    export function getCurrentLanguage(): LanguageCode;
    export function t(key: string, params?: Record<string, string | number>): string;
    export function formatDate(date: Date, format?: string): string;
    export function formatNumber(num: number): string;

    export default {
        t,
        setLanguage,
        getCurrentLanguage,
        formatDate,
        formatNumber
    };
}

/**
 * 插件类型定义
 */
declare module 'main/core/plugins/api' {
    import { Bot } from 'mineflayer';

    export interface PluginInfo {
        id: string;
        name: string;
        version: string;
        description?: string;
        author?: string;
        isActive: boolean;
    }

    export interface MinecraftPlugin {
        id: string;
        name: string;
        version: string;
        description?: string;
        author?: string;

        init(bot: Bot): void;
        onEnable(): void;
        onDisable(): void;
    }

    export function createPlugin(plugin: MinecraftPlugin): MinecraftPlugin;
}

/**
 * 游戏状态和事件类型定义
 */
declare module 'renderer/types/game' {
    export interface GameStatus {
        health: number;
        food: number;
        position: { x: number; y: number; z: number } | null;
    }

    export interface ChatMessage {
        sender: string;
        message: string;
        timestamp: Date;
    }

    export type GameEvent =
        | { type: 'chat'; data: { username: string; message: string } }
        | { type: 'health'; data: { health: number; food: number; saturation: number } }
        | { type: 'position'; data: { x: number; y: number; z: number } }
        | { type: 'playerJoined'; data: { username: string } }
        | { type: 'playerLeft'; data: { username: string } }
        | { type: 'kicked'; data: { reason: string } }
        | { type: 'error'; data: { message: string } };
}