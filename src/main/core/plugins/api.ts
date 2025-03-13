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

export function createPlugin(plugin: MinecraftPlugin): MinecraftPlugin {
    if (!plugin.id || !plugin.name || !plugin.version) {
        throw new Error('Plugin must have id, name, and version');
    }
    return plugin;
}