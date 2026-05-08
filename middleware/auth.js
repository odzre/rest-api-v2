const { sendResponse } = require('../library/response');
const { scanKeys, getJSON, setJSON, pushToList } = require('../config/redis');

/**
 * Middleware: Verifikasi API Key dari Redis
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

        // Cari API key di Redis
        const keys = await scanKeys('apikey:*');
        let foundKey = null;

        for (const keyName of keys) {
            const keyData = await getJSON(keyName);
            if (keyData && keyData.key === apiKey) {
                foundKey = keyData;
                break;
            }
        }

        if (!foundKey) {
            await logRequest(req, 'INVALID', 401);
            return sendResponse(res, 401, false, 'Akses Ditolak: API Key tidak valid.');
        }

        // Cek aktif
        if (!foundKey.active) {
            await logRequest(req, foundKey.label, 403);
            return sendResponse(res, 403, false, 'Akses Ditolak: API Key sudah dinonaktifkan.');
        }

        // Cek expired
        if (foundKey.expiredDays && foundKey.expiredDays > 0) {
            const expiresAt = new Date(new Date(foundKey.createdAt).getTime() + foundKey.expiredDays * 86400000);
            if (new Date() > expiresAt) {
                await logRequest(req, foundKey.label, 403);
                return sendResponse(res, 403, false, 'Akses Ditolak: API Key sudah expired.');
            }
        }

        // Cek rate limit harian
        if (foundKey.rateLimit && foundKey.rateLimit > 0) {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const rateLimitKey = `ratelimit:${foundKey.id}:${today}`;
            const { redis } = require('../config/redis');

            const currentCount = await redis.get(rateLimitKey);
            const count = parseInt(currentCount) || 0;

            if (count >= foundKey.rateLimit) {
                await logRequest(req, foundKey.label, 429);
                return sendResponse(res, 429, false, `Rate limit tercapai: ${foundKey.rateLimit} request/hari. Coba lagi besok.`);
            }

            // Increment counter dengan TTL 24 jam
            await redis.incr(rateLimitKey);
            if (count === 0) {
                await redis.expire(rateLimitKey, 86400);
            }
        }

        // Update usage count
        foundKey.usageCount = (foundKey.usageCount || 0) + 1;
        foundKey.lastUsed = new Date().toISOString();
        await setJSON(`apikey:${foundKey.id}`, foundKey);

        req.apiKeyInfo = foundKey;
        await logRequest(req, foundKey.label, null);
        next();
    } catch (err) {
        console.error('[Auth] Error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan saat verifikasi API Key.');
    }
};

async function logRequest(req, label, statusCode) {
    await pushToList('requestlogs', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        apiKeyLabel: label,
        statusCode,
        ip: req.ip
    });
}

module.exports = verifyApiKey;