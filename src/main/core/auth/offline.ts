import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../utils/logger';

const logger = getLogger('auth:offline');

/**
 * Generate a consistent UUID from a username for offline mode
 * @param username The username to generate UUID for
 */
function generateOfflineUUID(username: string): string {
    // UUID v3 would be ideal, but we'll use a simplified approach
    // that ensures the same username always generates the same UUID
    const hash = String(username.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0));

    // Ensure it's always the same length
    const paddedHash = hash.padStart(12, '0');

    // Format as UUID
    return `${paddedHash.substring(0, 8)}-${paddedHash.substring(8, 12)}-4${paddedHash.substring(12, 15)}-8${uuidv4().substring(20, 36)}`;
}

/**
 * Handle offline login (username only)
 * @param username The username to login with
 * @returns Object containing login details
 */
export async function loginOffline(username: string): Promise<{
    success: boolean;
    username: string;
    uuid: string;
    error?: string;
}> {
    // Validate username
    if (!username || username.length < 3 || username.length > 16) {
        logger.error(`Invalid username: ${username}`);
        return {
            success: false,
            username: '',
            uuid: '',
            error: 'Username must be between 3 and 16 characters'
        };
    }

    try {
        const uuid = generateOfflineUUID(username);
        logger.info(`Offline login successful for ${username}`);

        return {
            success: true,
            username,
            uuid
        };
    } catch (error) {
        logger.error('Error in offline login:', error);
        return {
            success: false,
            username: '',
            uuid: '',
            error: error instanceof Error ? error.message : 'Unknown error in offline login'
        };
    }
}