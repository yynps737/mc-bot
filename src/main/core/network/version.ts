import axios from 'axios';
import { getLogger } from '../utils/logger';

const logger = getLogger('network:version');

// Cache for available versions
let versionCache: MinecraftVersion[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Define version interface
export interface MinecraftVersion {
    id: string;
    type: string; // release, snapshot, etc.
    releaseTime: string;
    supported: boolean; // whether Mineflayer supports this version
}

// Define the versions we know Mineflayer supports
// This should be updated as Mineflayer adds support for newer versions
const KNOWN_SUPPORTED_VERSIONS = [
    '1.8', '1.8.1', '1.8.2', '1.8.3', '1.8.4', '1.8.5', '1.8.6', '1.8.7', '1.8.8', '1.8.9',
    '1.9', '1.9.1', '1.9.2', '1.9.3', '1.9.4',
    '1.10', '1.10.1', '1.10.2',
    '1.11', '1.11.1', '1.11.2',
    '1.12', '1.12.1', '1.12.2',
    '1.13', '1.13.1', '1.13.2',
    '1.14', '1.14.1', '1.14.2', '1.14.3', '1.14.4',
    '1.15', '1.15.1', '1.15.2',
    '1.16', '1.16.1', '1.16.2', '1.16.3', '1.16.4', '1.16.5',
    '1.17', '1.17.1',
    '1.18', '1.18.1', '1.18.2',
    '1.19', '1.19.1', '1.19.2', '1.19.3', '1.19.4',
    '1.20', '1.20.1', '1.20.2', '1.20.3', '1.20.4'
];

/**
 * Get all available Minecraft versions
 */
export async function getAvailableVersions(): Promise<MinecraftVersion[]> {
    try {
        // Use cache if it's still valid
        if (versionCache && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
            return versionCache;
        }

        // Fetch versions from Mojang API
        const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');

        // Process the versions
        const versions = response.data.versions.map((version: any) => ({
            id: version.id,
            type: version.type,
            releaseTime: version.releaseTime,
            // Check if this version is in our list of supported versions
            supported: KNOWN_SUPPORTED_VERSIONS.some(supportedVersion =>
                version.id === supportedVersion || version.id.startsWith(`${supportedVersion}-`))
        }));

        // Update cache
        versionCache = versions;
        lastCacheUpdate = Date.now();

        logger.info(`Fetched ${versions.length} Minecraft versions, ${versions.filter(v => v.supported).length} supported`);

        return versions;
    } catch (error) {
        logger.error('Error fetching Minecraft versions:', error);

        // Return cached versions if available, otherwise return hardcoded list
        if (versionCache) {
            return versionCache;
        }

        // Fallback to our list of known supported versions
        return KNOWN_SUPPORTED_VERSIONS.map(id => ({
            id,
            type: 'release',
            releaseTime: '', // We don't know the exact release time in this fallback
            supported: true
        }));
    }
}

/**
 * Get only versions supported by Mineflayer
 */
export async function getSupportedVersions(): Promise<MinecraftVersion[]> {
    const versions = await getAvailableVersions();
    return versions.filter(version => version.supported);
}

/**
 * Check if a specific version is supported
 */
export async function isVersionSupported(version: string): Promise<boolean> {
    const versions = await getSupportedVersions();
    return versions.some(v => v.id === version);
}

/**
 * Get recommended versions (latest release from each major version)
 */
export async function getRecommendedVersions(): Promise<MinecraftVersion[]> {
    const versions = await getSupportedVersions();

    // Filter to only release versions
    const releaseVersions = versions.filter(v => v.type === 'release');

    // Group by major.minor version (e.g., 1.8, 1.12, 1.16)
    const versionGroups: Record<string, MinecraftVersion[]> = {};

    for (const version of releaseVersions) {
        const majorMinor = version.id.split('.').slice(0, 2).join('.');
        if (!versionGroups[majorMinor]) {
            versionGroups[majorMinor] = [];
        }
        versionGroups[majorMinor].push(version);
    }

    // Get the latest version from each group
    return Object.values(versionGroups).map(group =>
        group.sort((a, b) => new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime())[0]
    );
}