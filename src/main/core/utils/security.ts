import * as crypto from 'crypto';
import { app } from 'electron';
import { getLogger } from './logger';

const logger = getLogger('utils:security');

// Define encryption settings
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;

// Get a unique machine identifier to use as part of the encryption key
function getMachineId(): string {
    const userData = app.getPath('userData');
    const machineName = app.getPath('home');

    // Create a hash of combined values that should be unique to this machine
    return crypto
        .createHash('sha256')
        .update(`${userData}:${machineName}:${process.platform}`)
        .digest('hex');
}

// Create a key from the password and salt
function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt data using AES-256-GCM
 * @param data The string data to encrypt
 * @returns Encrypted data as a string
 */
export function encryptData(data: string): string {
    try {
        // Generate a random initialization vector
        const iv = crypto.randomBytes(IV_LENGTH);

        // Generate a random salt
        const salt = crypto.randomBytes(SALT_LENGTH);

        // Use machine ID as part of the key
        const machineId = getMachineId();

        // Derive encryption key
        const key = deriveKey(machineId, salt);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt the data
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get the auth tag
        const tag = cipher.getAuthTag();

        // Combine everything into a single string
        // Format: salt:iv:tag:encryptedData
        const result = [
            salt.toString('hex'),
            iv.toString('hex'),
            tag.toString('hex'),
            encrypted
        ].join(':');

        return result;
    } catch (error) {
        logger.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt AES-256-GCM encrypted data
 * @param encryptedData The encrypted data string
 * @returns Decrypted data as a string
 */
export function decryptData(encryptedData: string): string {
    try {
        // Split the encrypted data string to get components
        const [saltHex, ivHex, tagHex, encrypted] = encryptedData.split(':');

        if (!saltHex || !ivHex || !tagHex || !encrypted) {
            throw new Error('Invalid encrypted data format');
        }

        // Convert from hex to buffers
        const salt = Buffer.from(saltHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        // Use machine ID as part of the key
        const machineId = getMachineId();

        // Derive decryption key
        const key = deriveKey(machineId, salt);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // Decrypt the data
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Generate a secure random token
 * @param length Length of the token in bytes
 * @returns Hex string representation of the token
 */
export function generateRandomToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password for secure storage
 * @param password The password to hash
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Hash the password
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512');

    // Combine salt and hash
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a hash
 * @param password The password to verify
 * @param hashedPassword The stored hashed password
 * @returns True if the password matches
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
    // Extract salt and hash
    const [saltHex, originalHash] = hashedPassword.split(':');

    if (!saltHex || !originalHash) {
        return false;
    }

    const salt = Buffer.from(saltHex, 'hex');

    // Hash the input password
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512');

    // Compare hashes
    return originalHash === hash.toString('hex');
}