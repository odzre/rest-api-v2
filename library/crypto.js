const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.ENCRYPTION_SECRET || 'express-scalar-api-default-secret-key!!';

// Derive a 32-byte key from the secret
function getKey() {
    return crypto.createHash('sha256').update(SECRET).digest();
}

/**
 * Encrypt plaintext string with AES-256-CBC
 * @param {string} text
 * @returns {string} iv:encrypted (hex encoded)
 */
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt AES-256-CBC encrypted string
 * @param {string} encryptedText iv:encrypted (hex encoded)
 * @returns {string} decrypted plaintext
 */
function decrypt(encryptedText) {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };
