import * as crypto from 'crypto';
import { app } from 'electron';
import { getLogger } from './logger';

const logger = getLogger('utils:security');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getMachineId(): string {
    const userData = app.getPath('userData');
    const machineName = app.getPath('home');
    return crypto
        .createHash('sha256')
        .update(`${userData}:${machineName}:${process.platform}`)
        .digest('hex');
}

function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encryptData(data: string): string {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const machineId = getMachineId();
        const key = deriveKey(machineId, salt);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return [
            salt.toString('hex'),
            iv.toString('hex'),
            tag.toString('hex'),
            encrypted
        ].join(':');
    } catch (error) {
        logger.error('加密错误:', error);
        throw new Error('加密数据失败');
    }
}

export function decryptData(encryptedData: string): string {
    try {
        const [saltHex, ivHex, tagHex, encrypted] = encryptedData.split(':');
        if (!saltHex || !ivHex || !tagHex || !encrypted) {
            throw new Error('无效的加密数据格式');
        }

        const salt = Buffer.from(saltHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const machineId = getMachineId();
        const key = deriveKey(machineId, salt);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('解密错误:', error);
        throw new Error('解密数据失败');
    }
}

export function generateRandomToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
    const [saltHex, originalHash] = hashedPassword.split(':');
    if (!saltHex || !originalHash) {
        return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512');
    return originalHash === hash.toString('hex');
}