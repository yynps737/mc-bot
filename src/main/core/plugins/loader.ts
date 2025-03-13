import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Bot } from 'mineflayer';
import { getLogger } from '../utils/logger';
import { MinecraftPlugin, PluginInfo } from './api';

const logger = getLogger('plugins:loader');

// Singleton instance
let pluginManagerInstance: PluginManager | null = null;

/**
 * Class to manage Minecraft client plugins
 */
export class PluginManager {
    private plugins: Map<string, MinecraftPlugin> = new Map();
    private activePlugins: Set<string> = new Set();
    private pluginsDir: string;

    constructor() {
        // Set plugins directory
        this.pluginsDir = process.env.NODE_ENV === 'development'
            ? path.join(process.cwd(), 'plugins')
            : path.join(app.getPath('userData'), 'plugins');

        // Ensure plugins directory exists
        if (!fs.existsSync(this.pluginsDir)) {
            fs.mkdirSync(this.pluginsDir, { recursive: true });
        }

        logger.info(`Plugin directory set to: ${this.pluginsDir}`);
    }

    /**
     * Discover and load all available plugins
     */
    public loadPlugins(): PluginInfo[] {
        logger.info('Loading plugins...');

        // Clear existing plugins
        this.plugins.clear();

        try {
            // Read plugin directory
            const pluginFiles = fs.readdirSync(this.pluginsDir);

            // Load each plugin
            for (const file of pluginFiles) {
                if (file.endsWith('.js') || file.endsWith('.ts')) {
                    this.loadPlugin(path.join(this.pluginsDir, file));
                }
            }

            logger.info(`Loaded ${this.plugins.size} plugins`);
            return this.getPluginList();
        } catch (error) {
            logger.error('Error loading plugins:', error);
            return [];
        }
    }

    /**
     * Load a single plugin from file
     */
    private loadPlugin(filePath: string): void {
        try {
            // Attempt to require the plugin file
            const pluginModule = require(filePath);

            // Check if it exports a valid plugin object
            if (this.isValidPlugin(pluginModule.default || pluginModule)) {
                const plugin = pluginModule.default || pluginModule;
                this.plugins.set(plugin.id, plugin);
                logger.info(`Loaded plugin: ${plugin.name} (${plugin.id})`);
            } else {
                logger.warn(`Invalid plugin format: ${filePath}`);
            }
        } catch (error) {
            logger.error(`Error loading plugin from ${filePath}:`, error);
        }
    }

    /**
     * Check if an object is a valid plugin
     */
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

    /**
     * Get list of all loaded plugins
     */
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

    /**
     * Enable a specific plugin
     */
    public enablePlugin(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);

        if (!plugin) {
            logger.warn(`Cannot enable plugin: ${pluginId} - not found`);
            return false;
        }

        try {
            if (!this.activePlugins.has(pluginId)) {
                plugin.onEnable();
                this.activePlugins.add(pluginId);
                logger.info(`Enabled plugin: ${plugin.name} (${plugin.id})`);
            }
            return true;
        } catch (error) {
            logger.error(`Error enabling plugin ${plugin.name}:`, error);
            return false;
        }
    }

    /**
     * Disable a specific plugin
     */
    public disablePlugin(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);

        if (!plugin) {
            logger.warn(`Cannot disable plugin: ${pluginId} - not found`);
            return false;
        }

        try {
            if (this.activePlugins.has(pluginId)) {
                plugin.onDisable();
                this.activePlugins.delete(pluginId);
                logger.info(`Disabled plugin: ${plugin.name} (${plugin.id})`);
            }
            return true;
        } catch (error) {
            logger.error(`Error disabling plugin ${plugin.name}:`, error);
            return false;
        }
    }

    /**
     * Initialize all active plugins with a bot instance
     */
    public initializePlugins(bot: Bot): void {
        logger.info('Initializing plugins with bot instance');

        for (const pluginId of this.activePlugins) {
            const plugin = this.plugins.get(pluginId);
            if (plugin) {
                try {
                    plugin.init(bot);
                    logger.info(`Initialized plugin: ${plugin.name} (${plugin.id})`);
                } catch (error) {
                    logger.error(`Error initializing plugin ${plugin.name}:`, error);
                    this.disablePlugin(pluginId);
                }
            }
        }
    }
}

/**
 * Initialize the plugin system
 */
export function initializePlugins(): void {
    pluginManagerInstance = new PluginManager();
    pluginManagerInstance.loadPlugins();
    logger.info('Plugin system initialized');
}

/**
 * Get the plugin manager instance
 */
export function getPluginManager(): PluginManager {
    if (!pluginManagerInstance) {
        throw new Error('Plugin manager not initialized');
    }
    return pluginManagerInstance;
}