import mineflayer from 'mineflayer';
import { BrowserWindow } from 'electron';
import { getLogger } from '../utils/logger';
import { getPluginManager } from '../plugins/loader';

const logger = getLogger('network:protocol');
let activeBot: mineflayer.Bot | null = null;
let mainWindow: BrowserWindow | null = null;

export function initializeProtocol(): void {
    logger.info('初始化 Mineflayer 协议系统');
}

export function setMainWindow(window: BrowserWindow): void {
    mainWindow = window;
}

export async function connectToServer({
                                          serverIp,
                                          serverPort,
                                          version,
                                          username,
                                          token
                                      }: {
    serverIp: string;
    serverPort: number;
    version: string;
    username: string;
    token?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        if (activeBot) {
            activeBot.end('正在连接到其他服务器');
            activeBot = null;
        }

        const botOptions: mineflayer.BotOptions = {
            host: serverIp,
            port: serverPort,
            username,
            version,
            auth: token ? 'microsoft' : 'offline',
        };

        if (token) {
            botOptions.password = token;
        }

        const bot = mineflayer.createBot(botOptions);
        activeBot = bot;

        setupBotEventHandlers(bot);

        return new Promise((resolve) => {
            bot.once('spawn', () => {
                resolve({ success: true });
            });

            bot.once('error', (err) => {
                resolve({ success: false, error: err.message });
            });

            bot.once('kicked', (reason) => {
                resolve({ success: false, error: `被踢出: ${reason}` });
            });

            setTimeout(() => {
                if (bot.entity) return;
                resolve({ success: false, error: '连接超时' });
            }, 30000);
        });
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : '连接服务器时出错'
        };
    }
}

function setupBotEventHandlers(bot: mineflayer.Bot): void {
    bot.on('chat', (username, message) => {
        sendGameEvent('chat', { username, message });
    });

    bot.on('kicked', (reason) => {
        sendGameEvent('kicked', { reason });
    });

    bot.on('error', (err) => {
        sendGameEvent('error', { message: err.message });
    });

    bot.on('health', () => {
        sendGameEvent('health', {
            health: bot.health,
            food: bot.food,
            saturation: bot.foodSaturation
        });
    });

    bot.on('move', () => {
        if (Math.random() < 0.1) {
            sendGameEvent('position', {
                x: bot.entity.position.x,
                y: bot.entity.position.y,
                z: bot.entity.position.z
            });
        }
    });

    bot.on('playerJoined', (player) => {
        sendGameEvent('playerJoined', { username: player.username });
    });

    bot.on('playerLeft', (player) => {
        sendGameEvent('playerLeft', { username: player.username });
    });

    const pluginManager = getPluginManager();
    pluginManager.initializePlugins(bot);
}

function sendGameEvent(event: string, data: any): void {
    if (!mainWindow) return;
    try {
        mainWindow.webContents.send('game-event', event, data);
    } catch (error) {
        logger.error('向渲染进程发送游戏事件时出错:', error);
    }
}

export function getActiveBot(): mineflayer.Bot | null {
    return activeBot;
}

export function sendChatMessage(message: string): boolean {
    if (!activeBot) return false;

    try {
        activeBot.chat(message);
        return true;
    } catch (error) {
        logger.error('发送聊天消息时出错:', error);
        return false;
    }
}

export function disconnect(): void {
    if (activeBot) {
        activeBot.end('用户断开连接');
        activeBot = null;
    }
}