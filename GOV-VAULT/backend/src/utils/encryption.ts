import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_HEX = process.env.ENCRYPTION_KEY ?? '';

function getKey(): Buffer {
    const key = Buffer.from(KEY_HEX, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return key;
}

/**
 * Encrypts plaintext using AES-256-CBC.
 * Returns a base64 string in the format: <iv_hex>:<ciphertext_base64>
 */
export function encrypt(text: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts a string produced by encrypt().
 */
export function decrypt(encryptedText: string): string {
    const key = getKey();
    const [ivHex, ciphertextBase64] = encryptedText.split(':');
    if (!ivHex || !ciphertextBase64) {
        throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
}
