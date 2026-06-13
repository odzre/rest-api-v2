const { sendResponse } = require('../library/response');
const db = require('../config/database');
const { setJSON } = require('../config/redis');

/**
 * Middleware: Verifikasi API Key dari MySQL
 * - Cek aktif/nonaktif
 * - Cek expired
 * - Cek rate limit harian
 * - Log request
 */
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return sendResponse(res, 401, false, 'Akses Ditolak: API Key tidak ditemukan di header x-api-key.');
        }

        // Indexed lookup — O(1) via MySQL index
        const foundKey = await db.getOne('SELECT * FROM api_keys WHERE `key` = ?', [apiKey]);

        if (!foundKey) {
            await logRequest(req, 'INVALID', 401);
            return sendResponse(res, 401, false, 'Akses Ditolak: API Key tidak valid.');
        }

        // Map DB columns to camelCase for compatibility
        const keyInfo = {
            id: foundKey.id,
            key: foundKey.key,
            label: foundKey.label,
            active: !!foundKey.active,
            expiredDays: foundKey.expired_days,
            rateLimit: foundKey.rate_limit,
            usageCount: foundKey.usage_count,
            lastUsed: foundKey.last_used,
            userId: foundKey.user_id,
            createdAt: foundKey.created_at,
        };

        // Cek aktif
        if (!keyInfo.active) {
            await logRequest(req, keyInfo.label, 403);
            return sendResponse(res, 403, false, 'Akses Ditolak: API Key sudah dinonaktifkan.');
        }

        // Cek expired
        if (keyInfo.expiredDays && keyInfo.expiredDays > 0) {
            const expiresAt = new Date(new Date(keyInfo.createdAt).getTime() + keyInfo.expiredDays * 86400000);
            if (new Date() > expiresAt) {
                await logRequest(req, keyInfo.label, 403);
                return sendResponse(res, 403, false, 'Akses Ditolak: API Key sudah expired.');
            }
        }

        // Cek rate limit harian (tetap Redis — TTL counter)
        if (keyInfo.rateLimit && keyInfo.rateLimit > 0) {
            const today = new Date().toISOString().split('T')[0];
            const rateLimitKey = `ratelimit:${keyInfo.id}:${today}`;
            const { redis } = require('../config/redis');

            const currentCount = await redis.get(rateLimitKey);
            const count = parseInt(currentCount) || 0;

            if (count >= keyInfo.rateLimit) {
                await logRequest(req, keyInfo.label, 429);
                return sendResponse(res, 429, false, `Rate limit tercapai: ${keyInfo.rateLimit} request/hari. Coba lagi besok.`);
            }

            await redis.incr(rateLimitKey);
            if (count === 0) {
                await redis.expire(rateLimitKey, 86400);
            }
        }

        // Update usage count in MySQL
        await db.run(
            'UPDATE api_keys SET usage_count = usage_count + 1, last_used = ? WHERE id = ?',
            [new Date(), keyInfo.id]
        );
        keyInfo.usageCount++;
        keyInfo.lastUsed = new Date().toISOString();

        req.apiKeyInfo = keyInfo;
        await logRequest(req, keyInfo.label, null);
        next();
    } catch (err) {
        console.error('[Auth] Error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan saat verifikasi API Key.');
    }
};

/**
 * Log request ke MySQL
 */
async function logRequest(req, label, statusCode) {
    try {
        await db.run(
            'INSERT INTO request_logs (timestamp, method, path, api_key_label, status_code, ip) VALUES (?, ?, ?, ?, ?, ?)',
            [new Date(), req.method, req.originalUrl, label, statusCode, req.ip]
        );

        // Auto-trim: keep last 500 logs
        await db.run(
            'DELETE FROM request_logs WHERE id NOT IN (SELECT id FROM (SELECT id FROM request_logs ORDER BY id DESC LIMIT 500) AS t)'
        );
    } catch (err) {
        console.error('[Auth] Log error:', err.message);
    }
}

module.exports = verifyApiKey;