import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getLogger } from './logger';

const logger = getLogger('utils:config');

interface MicrosoftAuthConfig {
    clientId: string;
}

interface AppConfig {
    microsoftAuth: MicrosoftAuthConfig;
}

// 默认配置（用于备份，不应包含敏感信息）
const defaultConfig: AppConfig = {
    microsoftAuth: {
        clientId: ''
    }
};

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    try {
        // 尝试从环境变量获取
        const envClientId = process.env.MICROSOFT_CLIENT_ID;
        if (envClientId) {
            logger.info('使用环境变量中的Microsoft客户端ID');
            const config = {
                ...defaultConfig,
                microsoftAuth: {
                    clientId: envClientId
                }
            };
            cachedConfig = config;
            return config;
        }

        // 用户数据目录中的配置文件路径
        const userConfigPath = path.join(app.getPath('userData'), 'config.json');

        // 本地开发配置文件路径
        const devConfigPath = path.join(process.cwd(), 'config.json');

        // 先尝试从用户数据目录读取
        if (fs.existsSync(userConfigPath)) {
            const configData = fs.readFileSync(userConfigPath, 'utf-8');
            const config = { ...defaultConfig, ...JSON.parse(configData) };
            cachedConfig = config;
            logger.info('从用户数据目录加载配置文件');
            return config;
        }

        // 再尝试从当前工作目录读取
        if (fs.existsSync(devConfigPath)) {
            const configData = fs.readFileSync(devConfigPath, 'utf-8');
            const config = { ...defaultConfig, ...JSON.parse(configData) };
            cachedConfig = config;
            logger.info('从开发目录加载配置文件');
            return config;
        }

        // 如果没有配置文件，创建一个示例配置文件
        if (process.env.NODE_ENV === 'development') {
            const exampleConfigPath = path.join(process.cwd(), 'config.example.json');
            if (!fs.existsSync(exampleConfigPath)) {
                fs.writeFileSync(
                    exampleConfigPath,
                    JSON.stringify(defaultConfig, null, 2),
                    'utf-8'
                );
                logger.info('已创建示例配置文件');
            }
        }

        // 如果没有找到配置文件或环境变量，返回默认配置
        logger.warn('未找到配置文件或环境变量，使用默认配置（没有Microsoft客户端ID）');
        return defaultConfig; // 直接返回默认配置，而不是缓存的null值
    } catch (error) {
        logger.error('读取配置文件失败:', error);
        return defaultConfig; // 出错时也返回默认配置
    }
}

export function getMicrosoftClientId(): string {
    const config = getConfig();
    return config.microsoftAuth.clientId;
}

export function saveConfig(config: Partial<AppConfig>): boolean {
    try {
        const userConfigPath = path.join(app.getPath('userData'), 'config.json');
        const currentConfig = getConfig();
        const newConfig = { ...currentConfig, ...config };

        fs.writeFileSync(userConfigPath, JSON.stringify(newConfig, null, 2), 'utf-8');
        logger.info('配置已保存');

        // 更新缓存
        cachedConfig = newConfig;
        return true;
    } catch (error) {
        logger.error('保存配置文件失败:', error);
        return false;
    }
}