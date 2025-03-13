import { Bot } from 'mineflayer';

/**
 * Interface for plugin information
 */
export interface PluginInfo {
    id: string;         // Unique identifier for the plugin
    name: string;       // Display name
    version: string;    // Plugin version
    description?: string; // Optional description
    author?: string;    // Optional author name
    isActive: boolean;  // Whether the plugin is currently active
}

/**
 * Interface that all Minecraft client plugins must implement
 */
export interface MinecraftPlugin {
    id: string;         // Unique identifier for the plugin
    name: string;       // Display name
    version: string;    // Plugin version
    description?: string; // Optional description
    author?: string;    // Optional author name

    /**
     * Initialize the plugin with the bot instance
     * Called when the bot connects to a server and the plugin is active
     */
    init(bot: Bot): void;

    /**
     * Called when the plugin is enabled
     */
    onEnable(): void;

    /**
     * Called when the plugin is disabled
     */
    onDisable(): void;
}

/**
 * Example plugin template
 */
export const ExamplePlugin: MinecraftPlugin = {
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'An example plugin demonstrating the plugin API',
    author: 'Your Name',

    init(bot: Bot) {
        // Set up event listeners and initialize plugin state
        bot.on('chat', (username, message) => {
            if (username === bot.username) return;

            // Example: respond to a specific command
            if (message === '!help') {
                bot.chat('This is an example plugin! Type !example for more info.');
            } else if (message === '!example') {
                bot.chat('This plugin demonstrates the plugin API functionality.');
            }
        });
    },

    onEnable() {
        // Plugin was enabled - initialize any required resources
        console.log('Example plugin enabled!');
    },

    onDisable() {
        // Plugin was disabled - clean up any resources
        console.log('Example plugin disabled!');
    }
};

/**
 * Utility to create a new plugin
 */
export function createPlugin(plugin: MinecraftPlugin): MinecraftPlugin {
    // Validate plugin required fields
    if (!plugin.id || !plugin.name || !plugin.version) {
        throw new Error('Plugin must have id, name, and version');
    }

    return plugin;
}