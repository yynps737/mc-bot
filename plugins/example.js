const ExamplePlugin = {
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'A simple example plugin for the Minecraft client',
    author: 'Your Name',

    bot: null,
    chatHandler: null,

    init(bot) {
        this.bot = bot;

        this.chatHandler = (username, message) => {
            if (username === bot.username) return;

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

        bot.on('chat', this.chatHandler);
    },

    onEnable() {
        console.log('[ExamplePlugin] Plugin enabled');
    },

    onDisable() {
        if (this.bot && this.chatHandler) {
            this.bot.removeListener('chat', this.chatHandler);
            this.chatHandler = null;
        }
        this.bot = null;
    }
};

module.exports = ExamplePlugin;