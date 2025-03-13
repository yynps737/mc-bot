// src/main/core/network/version.ts
import axios from 'axios';
import { getLogger } from '../utils/logger';

const logger = getLogger('network:version');

// 版本缓存
let versionCache: MinecraftVersion[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 3600000; // 1小时缓存时间（毫秒）

// 定义版本接口
export interface MinecraftVersion {
    id: string;
    type: string; // release, snapshot等
    releaseTime: string;
    supported: boolean; // Mineflayer是否支持此版本
}

// 定义我们知道Mineflayer支持的版本
// 随着Mineflayer添加对更新版本的支持，此列表应当更新
const KNOWN_SUPPORTED_VERSIONS = [
    // 1.8.x系列
    '1.8', '1.8.1', '1.8.2', '1.8.3', '1.8.4', '1.8.5', '1.8.6', '1.8.7', '1.8.8', '1.8.9',
    // 1.9.x系列
    '1.9', '1.9.1', '1.9.2', '1.9.3', '1.9.4',
    // 1.10.x系列
    '1.10', '1.10.1', '1.10.2',
    // 1.11.x系列
    '1.11', '1.11.1', '1.11.2',
    // 1.12.x系列 - 确保包含1.12.2
    '1.12', '1.12.1', '1.12.2',
    // 1.13.x系列
    '1.13', '1.13.1', '1.13.2',
    // 1.14.x系列
    '1.14', '1.14.1', '1.14.2', '1.14.3', '1.14.4',
    // 1.15.x系列
    '1.15', '1.15.1', '1.15.2',
    // 1.16.x系列
    '1.16', '1.16.1', '1.16.2', '1.16.3', '1.16.4', '1.16.5',
    // 1.17.x系列
    '1.17', '1.17.1',
    // 1.18.x系列
    '1.18', '1.18.1', '1.18.2',
    // 1.19.x系列
    '1.19', '1.19.1', '1.19.2', '1.19.3', '1.19.4',
    // 1.20.x系列 - 确保包含最新的1.20.4
    '1.20', '1.20.1', '1.20.2', '1.20.3', '1.20.4', '1.20.5', '1.20.6'
];

/**
 * 获取所有可用的Minecraft版本
 */
export async function getAvailableVersions(): Promise<MinecraftVersion[]> {
    try {
        // 如果缓存仍然有效，则使用缓存
        if (versionCache && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
            return versionCache;
        }

        // 从Mojang API获取版本
        const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');

        // 处理版本
        const versions = response.data.versions.map((version: any) => ({
            id: version.id,
            type: version.type,
            releaseTime: version.releaseTime,
            // 检查此版本是否在我们支持的版本列表中
            supported: KNOWN_SUPPORTED_VERSIONS.some((supportedVersion: string) =>
                version.id === supportedVersion || version.id.startsWith(`${supportedVersion}-`))
        }));

        // 更新缓存
        versionCache = versions;
        lastCacheUpdate = Date.now();

        logger.info(`获取到${versions.length}个Minecraft版本，其中${versions.filter((v: MinecraftVersion) => v.supported).length}个受支持`);

        return versions;
    } catch (error) {
        logger.error('获取Minecraft版本时出错:', error);

        // 如果可用，返回缓存的版本，否则返回硬编码列表
        if (versionCache) {
            return versionCache;
        }

        // 回退到我们已知支持的版本列表
        return KNOWN_SUPPORTED_VERSIONS.map(id => ({
            id,
            type: 'release',
            releaseTime: '', // 在此回退方案中，我们不知道确切的发布时间
            supported: true
        }));
    }
}

/**
 * 仅获取Mineflayer支持的版本
 */
export async function getSupportedVersions(): Promise<MinecraftVersion[]> {
    const versions = await getAvailableVersions();
    return versions.filter(version => version.supported);
}

/**
 * 检查特定版本是否受支持
 */
export async function isVersionSupported(version: string): Promise<boolean> {
    const versions = await getSupportedVersions();
    return versions.some(v => v.id === version);
}

/**
 * 获取推荐版本（每个主要版本的最新发布版）
 */
export async function getRecommendedVersions(): Promise<MinecraftVersion[]> {
    const versions = await getSupportedVersions();

    // 仅过滤发布版本
    const releaseVersions = versions.filter(v => v.type === 'release');

    // 按主要版本分组（例如1.8、1.12、1.16）
    const versionGroups: Record<string, MinecraftVersion[]> = {};

    for (const version of releaseVersions) {
        const majorMinor = version.id.split('.').slice(0, 2).join('.');
        if (!versionGroups[majorMinor]) {
            versionGroups[majorMinor] = [];
        }
        versionGroups[majorMinor].push(version);
    }

    // 从每个组中获取最新版本
    return Object.values(versionGroups).map(group =>
        group.sort((a, b) => new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime())[0]
    );
}