// scripts/create-resources.js
const fs = require('fs');
const path = require('path');

// 确保必要的目录存在
const dirs = [
    'resources',
    'resources/icons',
    'plugins'
];

dirs.forEach(dir => {
    const dirPath = path.resolve(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        console.log(`创建目录: ${dir}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// 创建空图标文件（如果不存在）
const iconFiles = [
    'resources/icons/icon.ico',
    'resources/icons/icon.png'
];

iconFiles.forEach(file => {
    const filePath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.log(`创建空图标文件: ${file}`);
        // 创建一个简单的1x1像素文件
        fs.writeFileSync(filePath, Buffer.from([0]));
    }
});

// 确保有示例插件
const examplePluginPath = path.resolve(__dirname, '../plugins/example.js');
if (!fs.existsSync(examplePluginPath)) {
    console.log('创建示例插件文件');

    const exampleContent = `/**
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
                bot.chat(\`Hello, \${username}! This message was sent by the Example Plugin.\`);
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
module.exports = ExamplePlugin;`;

    fs.writeFileSync(examplePluginPath, exampleContent);
}

console.log('✅ 资源检查和创建完成');