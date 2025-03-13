import { app } from 'electron';
import * as path from 'path';
import electronLog from 'electron-log';
import * as fs from 'fs';

// Configure different log transports
let initialized = false;

/**
 * Initialize the logging system
 */
export function initialize(): void {
    if (initialized) return;

    // Set up file transport
    electronLog.transports.file.resolvePath = () => {
        const userDataPath = app.getPath('userData');
        return path.join(userDataPath, 'logs/main.log');
    };

    // Configure log file rotation
    electronLog.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    electronLog.transports.file.archiveLog = (oldPath) => {
        // Generate a new path with timestamp
        const newPath = oldPath.toString().replace(/\.log$/, `.${Date.now()}.log`);
        return { oldPath, newPath };
    };

    // Set log levels based on environment
    if (process.env.NODE_ENV === 'development') {
        electronLog.transports.console.level = 'debug';
        electronLog.transports.file.level = 'debug';
    } else {
        electronLog.transports.console.level = 'info';
        electronLog.transports.file.level = 'info';
    }

    initialized = true;

    const logger = getLogger('system');
    logger.info('Logging system initialized');
    logger.info(`App version: ${app.getVersion()}`);
    logger.info(`Electron version: ${process.versions.electron}`);
    logger.info(`Node version: ${process.versions.node}`);
    logger.info(`Platform: ${process.platform}`);
    logger.info(`User data path: ${app.getPath('userData')}`);
}

/**
 * Get a logger instance for a specific module
 */
export function getLogger(moduleName: string) {
    if (!initialized) {
        initialize();
    }

    // Format log messages with module name
    const logger = {
        debug: (message: string, ...args: any[]) => {
            electronLog.debug(`[${moduleName}] ${message}`, ...args);
        },
        info: (message: string, ...args: any[]) => {
            electronLog.info(`[${moduleName}] ${message}`, ...args);
        },
        warn: (message: string, ...args: any[]) => {
            electronLog.warn(`[${moduleName}] ${message}`, ...args);
        },
        error: (message: string, ...args: any[]) => {
            electronLog.error(`[${moduleName}] ${message}`, ...args);
        }
    };

    return logger;
}

/**
 * Get all log entries for display in the app
 */
export function getLogEntries(maxEntries = 100): string[] {
    try {
        // Get the log file path
        const logFilePath = electronLog.transports.file.getFile().path;

        if (!logFilePath || !fs.existsSync(logFilePath)) {
            return [];
        }

        // Read the log file content
        const content = fs.readFileSync(logFilePath, 'utf8');
        const lines = content.split('\n').filter(Boolean);

        return lines.slice(-maxEntries);
    } catch (error) {
        console.error('Error reading log file:', error);
        return [];
    }
}