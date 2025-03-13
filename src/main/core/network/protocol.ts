import mineflayer from 'mineflayer';
import { BrowserWindow } from 'electron';
import { getLogger } from '../utils/logger';
import { getPluginManager } from '../plugins/loader';

const logger = getLogger('network:protocol');

// Track active client connection
let activeBot: mineflayer.Bot | null = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Initialize the Mineflayer protocol system
 */
export function initializeProtocol(): void {
    logger.info('Initializing Mineflayer protocol system');
}

/**
 * Set the main window reference for event dispatching
 */
export function setMainWindow(window: BrowserWindow): void {
    mainWindow = window;
}

/**
 * Connect to a Minecraft server using Mineflayer
 */
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
        // Disconnect from any existing connection
        if (activeBot) {
            activeBot.end('Disconnecting to connect to another server');
            activeBot = null;
        }

        logger.info(`Connecting to ${serverIp}:${serverPort} as ${username} using Minecraft ${version}`);

        // Create bot options
        const botOptions: mineflayer.BotOptions = {
            host: serverIp,
            port: serverPort,
            username,
            version,
            auth: token ? 'microsoft' : 'offline',
        };

        // Add auth token if provided (online mode)
        if (token) {
            botOptions.password = token;
        }

        // Create the bot
        const bot = mineflayer.createBot(botOptions);
        activeBot = bot;

        // Set up event handlers
        setupBotEventHandlers(bot);

        // Wait for spawn or error
        return new Promise((resolve) => {
            // Success handler
            bot.once('spawn', () => {
                logger.info('Successfully connected and spawned in the world');
                resolve({ success: true });
            });

            // Error handlers
            bot.once('error', (err) => {
                logger.error('Connection error:', err);
                resolve({ success: false, error: err.message });
            });

            bot.once('kicked', (reason) => {
                logger.error('Kicked from server:', reason);
                resolve({ success: false, error: `Kicked: ${reason}` });
            });

            // Set a timeout in case neither spawn nor error happens
            setTimeout(() => {
                if (bot.entity) return; // Already spawned
                logger.error('Connection timeout');
                resolve({ success: false, error: 'Connection timeout' });
            }, 30000); // 30 second timeout
        });
    } catch (error) {
        logger.error('Error connecting to server:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error connecting to server'
        };
    }
}

/**
 * Set up bot event handlers to relay events to the renderer process
 */
function setupBotEventHandlers(bot: mineflayer.Bot): void {
    // Game events
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
        // Only send position updates occasionally to avoid overwhelming the renderer
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

    // Initialize plugins with the bot
    const pluginManager = getPluginManager();
    pluginManager.initializePlugins(bot);
}

/**
 * Send game events to the renderer process
 */
function sendGameEvent(event: string, data: any): void {
    if (!mainWindow) return;
    try {
        mainWindow.webContents.send('game-event', event, data);
    } catch (error) {
        logger.error('Error sending game event to renderer:', error);
    }
}

/**
 * Get the active bot instance (for plugin use)
 */
export function getActiveBot(): mineflayer.Bot | null {
    return activeBot;
}

/**
 * Send a chat message to the server
 */
export function sendChatMessage(message: string): boolean {
    if (!activeBot) return false;

    try {
        activeBot.chat(message);
        return true;
    } catch (error) {
        logger.error('Error sending chat message:', error);
        return false;
    }
}

/**
 * Disconnect from the current server
 */
export function disconnect(): void {
    if (activeBot) {
        activeBot.end('User disconnected');
        activeBot = null;
    }
}