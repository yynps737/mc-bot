/**
 * Example Minecraft Client Plugin
 *
 * This plugin demonstrates the basic structure and capabilities of the plugin system.
 * It adds a simple chat command (!hello) that responds with a greeting.
 */

/**
 * The plugin definition object that will be exported
 */
const ExamplePlugin = {
    // Basic plugin information
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'A simple example plugin for the Minecraft client',
    author: 'Your Name',

    // Bot reference
    bot: null,

    // Chat message handler
    chatHandler: null,

    /**
     * Initialize the plugin with the bot instance
     * This is called when the bot connects to a server and the plugin is active
     * @param {import('mineflayer').Bot} bot The mineflayer bot instance
     */
    init(bot) {
        this.bot = bot;

        // Create a chat message handler
        this.chatHandler = (username, message) => {
            // Ignore our own messages
            if (username === bot.username) return;

            // Process chat commands
            if (message === '!hello') {
                bot.chat(`Hello, ${username}! This message was sent by the Example Plugin.`);
            } else if (message === '!position') {
                const position = bot.entity.position;
                bot.chat(`I am currently at X: ${Math.floor(position.x)}, Y: ${Math.floor(position.y)}, Z: ${Math.floor(position.z)}`);
            } else if (message === '!health') {
                bot.chat(`My current health is ${bot.health} and food level is ${bot.food}`);
            } else if (message === '!time') {
                bot.chat(`The current server time is ${bot.time.timeOfDay}`);
            } else if (message === '!players') {
                const playerNames = Object.keys(bot.players)
                    .filter(name => name !== bot.username)
                    .join(', ');
                bot.chat(`Players online: ${playerNames || 'No other players'}`);
            }
        };

        // Register the chat handler
        bot.on('chat', this.chatHandler);

        console.log('[ExamplePlugin] Initialized with bot instance');
    },

    /**
     * Called when the plugin is enabled
     */
    onEnable() {
        console.log('[ExamplePlugin] Plugin enabled');
    },

    /**
     * Called when the plugin is disabled
     */
    onDisable() {
        // Clean up by removing event listeners
        if (this.bot && this.chatHandler) {
            this.bot.removeListener('chat', this.chatHandler);
            this.chatHandler = null;
        }
        this.bot = null;

        console.log('[ExamplePlugin] Plugin disabled and cleaned up');
    }
};

// Export the plugin object
module.exports = ExamplePlugin;