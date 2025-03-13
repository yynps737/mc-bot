import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../utils/logger';

const logger = getLogger('auth:offline');

function generateOfflineUUID(username: string): string {
    const hash = String(username.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0));

    const paddedHash = hash.padStart(12, '0');
    return `${paddedHash.substring(0, 8)}-${paddedHash.substring(8, 12)}-4${paddedHash.substring(12, 15)}-8${uuidv4().substring(20, 36)}`;
}

export async function loginOffline(username: string): Promise<{
    success: boolean;
    username: string;
    uuid: string;
    error?: string;
}> {
    if (!username || username.length < 3 || username.length > 16) {
        return {
            success: false,
            username: '',
            uuid: '',
            error: '用户名必须在3到16个字符之间'
        };
    }

    try {
        const uuid = generateOfflineUUID(username);
        return { success: true, username, uuid };
    } catch (error) {
        return {
            success: false,
            username: '',
            uuid: '',
            error: error instanceof Error ? error.message : '离线登录失败'
        };
    }
}