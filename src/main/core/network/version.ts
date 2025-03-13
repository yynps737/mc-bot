import axios from 'axios';
import { getLogger } from '../utils/logger';

const logger = getLogger('network:version');
let versionCache: MinecraftVersion[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 3600000;

export interface MinecraftVersion {
    id: string;
    type: string;
    releaseTime: string;
    supported: boolean;
}

const SUPPORTED_VERSIONS = [
    '1.12.2',
    '1.13', '1.13.1', '1.13.2',
    '1.14', '1.14.1', '1.14.2', '1.14.3', '1.14.4',
    '1.15', '1.15.1', '1.15.2',
    '1.16', '1.16.1', '1.16.2', '1.16.3', '1.16.4', '1.16.5',
    '1.17', '1.17.1',
    '1.18', '1.18.1', '1.18.2',
    '1.19', '1.19.1', '1.19.2', '1.19.3', '1.19.4',
    '1.20', '1.20.1', '1.20.2', '1.20.3', '1.20.4', '1.20.5', '1.20.6'
];

export async function getAvailableVersions(): Promise<MinecraftVersion[]> {
    try {
        if (versionCache && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
            return versionCache;
        }

        const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');

        const versions = response.data.versions
            .filter((version: any) => {
                const versionId = version.id;
                return SUPPORTED_VERSIONS.includes(versionId);
            })
            .map((version: any) => ({
                id: version.id,
                type: version.type,
                releaseTime: version.releaseTime,
                supported: true
            }));

        versionCache = versions;
        lastCacheUpdate = Date.now();

        return versions;
    } catch (error) {
        logger.error('获取Minecraft版本时出错:', error);

        if (versionCache) {
            return versionCache;
        }

        return SUPPORTED_VERSIONS.map(id => ({
            id,
            type: 'release',
            releaseTime: '',
            supported: true
        }));
    }
}

export async function getSupportedVersions(): Promise<MinecraftVersion[]> {
    const versions = await getAvailableVersions();
    return versions.filter(version => version.supported);
}

export async function getRecommendedVersions(): Promise<MinecraftVersion[]> {
    const versions = await getSupportedVersions();
    const releaseVersions = versions.filter(v => v.type === 'release');
    const versionGroups: Record<string, MinecraftVersion[]> = {};

    for (const version of releaseVersions) {
        const majorMinor = version.id.split('.').slice(0, 2).join('.');
        if (!versionGroups[majorMinor]) {
            versionGroups[majorMinor] = [];
        }
        versionGroups[majorMinor].push(version);
    }

    return Object.values(versionGroups).map(group =>
        group.sort((a, b) => new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime())[0]
    );
}