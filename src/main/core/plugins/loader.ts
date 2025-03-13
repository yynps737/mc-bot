import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Bot } from 'mineflayer';
import { getLogger } from '../utils/logger';
import { MinecraftPlugin, PluginInfo } from './api';

const logger = getLogger('plugins:loader');
let pluginManagerInstance: PluginManager | null = null;

export class PluginManager {
    private plugins: Map<string, MinecraftPlugin> = new Map();
    private activePlugins: Set<string> = new Set();
    private pluginsDir: string;

    constructor() {
        this.pluginsDir = process.env.NODE_ENV === 'development'
            ? path.join(process.cwd(), 'plugins')
            : path.join(app.getPath('userData'), 'plugins');

        if (!fs.existsSync(this.pluginsDir)) {
            fs.mkdirSync(this.pluginsDir, { recursive: true });
        }
    }

    public loadPlugins(): PluginInfo[] {
        this.plugins.clear();

        try {
            const pluginFiles = fs.readdirSync(this.pluginsDir);

            for (const file of pluginFiles) {
                if (file.endsWith('.js') || file.endsWith('.ts')) {
                    this.loadPlugin(path.join(this.pluginsDir, file));
                }
            }

            return this.getPluginList();
        } catch (error) {
            logger.error('Error loading plugins:', error);
            return [];
        }
    }

    private loadPlugin(filePath: string): void {
        try {
            const pluginModule = require(filePath);
            if (this.isValidPlugin(pluginModule.default || pluginModule)) {
                const plugin = pluginModule.default || pluginModule;
                this.plugins.set(plugin.id, plugin);
            }
        } catch (error) {
            logger.error(`Error loading plugin from ${filePath}:`, error);
        }
    }

    private isValidPlugin(obj: any): obj is MinecraftPlugin {
        return (
            obj &&
            typeof obj.id === 'string' &&
            typeof obj.name === 'string' &&
            typeof obj.version === 'string' &&
            typeof obj.init === 'function' &&
            typeof obj.onEnable === 'function' &&
            typeof obj.onDisable === 'function'
        );
    }

    public getPluginList(): PluginInfo[] {
        return Array.from(this.plugins.values()).map(plugin => ({
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            description: plugin.description || '',
            author: plugin.author || 'Unknown',
            isActive: this.activePlugins.has(plugin.id)
        }));
    }

    public enablePlugin(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        try {
            if (!this.activePlugins.has(pluginId)) {
                plugin.onEnable();
                this.activePlugins.add(pluginId);
            }
            return true;
        } catch (error) {
            logger.error(`Error enabling plugin ${plugin.name}:`, error);
            return false;
        }
    }

    public disablePlugin(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        try {
            if (this.activePlugins.has(pluginId)) {
                plugin.onDisable();
                this.activePlugins.delete(pluginId);
            }
            return true;
        } catch (error) {
            logger.error(`Error disabling plugin ${plugin.name}:`, error);
            return false;
        }
    }

    public initializePlugins(bot: Bot): void {
        for (const pluginId of this.activePlugins) {
            const plugin = this.plugins.get(pluginId);
            if (plugin) {
                try {
                    plugin.init(bot);
                } catch (error) {
                    logger.error(`Error initializing plugin ${plugin.name}:`, error);
                    this.disablePlugin(pluginId);
                }
            }
        }
    }
}

export function initializePlugins(): void {
    pluginManagerInstance = new PluginManager();
    pluginManagerInstance.loadPlugins();
}

export function getPluginManager(): PluginManager {
    if (!pluginManagerInstance) {
        throw new Error('Plugin manager not initialized');
    }
    return pluginManagerInstance;
}