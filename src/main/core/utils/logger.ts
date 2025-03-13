import { app } from 'electron';
import * as path from 'path';
import electronLog from 'electron-log';
import * as fs from 'fs';

let initialized = false;

export function initialize(): void {
    if (initialized) return;

    electronLog.transports.file.resolvePath = () => {
        const userDataPath = app.getPath('userData');
        return path.join(userDataPath, 'logs/main.log');
    };

    electronLog.transports.file.maxSize = 10 * 1024 * 1024;
    electronLog.transports.file.archiveLog = (oldPath) => {
        const newPath = oldPath.toString().replace(/\.log$/, `.${Date.now()}.log`);
        return { oldPath, newPath };
    };

    if (process.env.NODE_ENV === 'development') {
        electronLog.transports.console.level = 'debug';
        electronLog.transports.file.level = 'debug';
    } else {
        electronLog.transports.console.level = 'info';
        electronLog.transports.file.level = 'info';
    }

    initialized = true;

    const logger = getLogger('system');
    logger.info(`日志系统初始化完成`);
    logger.info(`应用版本: ${app.getVersion()}`);
    logger.info(`Electron 版本: ${process.versions.electron}`);
    logger.info(`Node 版本: ${process.versions.node}`);
    logger.info(`平台: ${process.platform}`);
}

interface Logger {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
}

export function getLogger(moduleName: string): Logger {
    if (!initialized) {
        initialize();
    }

    return {
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
}

export function getLogEntries(maxEntries = 100): string[] {
    try {
        const logFilePath = electronLog.transports.file.getFile().path;

        if (!logFilePath || !fs.existsSync(logFilePath)) {
            return [];
        }

        const content = fs.readFileSync(logFilePath, 'utf8');
        const lines = content.split('\n').filter(Boolean);

        return lines.slice(-maxEntries);
    } catch (error) {
        console.error('读取日志文件时出错:', error);
        return [];
    }
}