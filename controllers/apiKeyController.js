const { sendResponse } = require('../library/response');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/** GET /api/admin/keys */
const getAllKeys = async (req, res) => {
    try {
        const apiKeys = await db.query('SELECT * FROM api_keys ORDER BY created_at DESC');
        const result = apiKeys.map(data => {
            if (data.expired_days && data.expired_days > 0) {
                const expiresAt = new Date(new Date(data.created_at).getTime() + data.expired_days * 86400000);
                data.isExpired = new Date() > expiresAt;
                data.expiresAt = expiresAt.toISOString();
            } else {
                data.isExpired = false;
            }
            // Map column names to match frontend expectations
            return {
                id: data.id,
                key: data.key,
                label: data.label,
                active: !!data.active,
                expiredDays: data.expired_days,
                rateLimit: data.rate_limit,
                expiresAt: data.expiresAt || null,
                isExpired: data.isExpired,
                usageCount: data.usage_count,
                lastUsed: data.last_used,
                userId: data.user_id,
                createdAt: data.created_at,
            };
        });
        return sendResponse(res, 200, true, `${result.length} API key ditemukan.`, result);
    } catch (err) {
        console.error('[ApiKey] GetAll error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** POST /api/admin/keys */
const createKey = async (req, res) => {
    try {
        const { label, customKey, expiredDays, rateLimit } = req.body;
        if (!label) return sendResponse(res, 400, false, 'Label wajib diisi.');

        const key = customKey && customKey.trim().length >= 8 ? customKey.trim() : `sk-${uuidv4()}`;

        // Cek duplikat
        const dup = await db.getOne('SELECT id FROM api_keys WHERE `key` = ?', [key]);
        if (dup) {
            return sendResponse(res, 409, false, 'API Key ini sudah digunakan. Gunakan key yang berbeda.');
        }

        const id = uuidv4().split('-')[0];
        const expDays = parseInt(expiredDays) || 0;
        const rateLim = parseInt(rateLimit) || 0;
        const now = new Date();

        await db.run(
            'INSERT INTO api_keys (id, `key`, label, active, expired_days, rate_limit, usage_count, created_at) VALUES (?, ?, ?, 1, ?, ?, 0, ?)',
            [id, key, label, expDays, rateLim, now]
        );

        const apiKey = {
            id, key, label,
            active: true,
            expiredDays: expDays,
            rateLimit: rateLim,
            expiresAt: expDays > 0 ? new Date(now.getTime() + expDays * 86400000).toISOString() : null,
            usageCount: 0,
            lastUsed: null,
            createdAt: now.toISOString()
        };

        return sendResponse(res, 201, true, 'API Key berhasil dibuat.', apiKey);
    } catch (err) {
        console.error('[ApiKey] Create error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** PUT /api/admin/keys/:id */
const updateKey = async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = await db.getOne('SELECT * FROM api_keys WHERE id = ?', [id]);
        if (!apiKey) return sendResponse(res, 404, false, 'API Key tidak ditemukan.');

        const { label, customKey, expiredDays, rateLimit } = req.body;

        let newKey = apiKey.key;
        if (customKey && customKey.trim().length >= 8 && customKey.trim() !== apiKey.key) {
            const dup = await db.getOne('SELECT id FROM api_keys WHERE `key` = ? AND id != ?', [customKey.trim(), id]);
            if (dup) {
                return sendResponse(res, 409, false, 'API Key ini sudah digunakan oleh key lain.');
            }
            newKey = customKey.trim();
        }

        const newLabel = (label && label.trim()) ? label.trim() : apiKey.label;
        const newExpDays = expiredDays !== undefined ? (parseInt(expiredDays) || 0) : apiKey.expired_days;
        const newRateLimit = rateLimit !== undefined ? (parseInt(rateLimit) || 0) : apiKey.rate_limit;

        await db.run(
            'UPDATE api_keys SET `key` = ?, label = ?, expired_days = ?, rate_limit = ? WHERE id = ?',
            [newKey, newLabel, newExpDays, newRateLimit, id]
        );

        const updated = await db.getOne('SELECT * FROM api_keys WHERE id = ?', [id]);
        const result = {
            id: updated.id, key: updated.key, label: updated.label,
            active: !!updated.active, expiredDays: updated.expired_days, rateLimit: updated.rate_limit,
            usageCount: updated.usage_count, lastUsed: updated.last_used, createdAt: updated.created_at,
        };
        if (result.expiredDays > 0) {
            result.expiresAt = new Date(new Date(result.createdAt).getTime() + result.expiredDays * 86400000).toISOString();
        }

        return sendResponse(res, 200, true, 'API Key berhasil diupdate.', result);
    } catch (err) {
        console.error('[ApiKey] Update error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** PATCH /api/admin/keys/:id/revoke */
const revokeKey = async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = await db.getOne('SELECT * FROM api_keys WHERE id = ?', [id]);
        if (!apiKey) return sendResponse(res, 404, false, 'API Key tidak ditemukan.');

        const newActive = apiKey.active ? 0 : 1;
        await db.run('UPDATE api_keys SET active = ? WHERE id = ?', [newActive, id]);

        return sendResponse(res, 200, true, `API Key berhasil ${newActive ? 'diaktifkan' : 'dinonaktifkan'}.`, {
            ...apiKey, active: !!newActive,
        });
    } catch (err) {
        console.error('[ApiKey] Revoke error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** DELETE /api/admin/keys/:id */
const deleteApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = await db.getOne('SELECT * FROM api_keys WHERE id = ?', [id]);
        if (!apiKey) return sendResponse(res, 404, false, 'API Key tidak ditemukan.');

        await db.run('DELETE FROM api_keys WHERE id = ?', [id]);
        return sendResponse(res, 200, true, 'API Key berhasil dihapus.', { id, label: apiKey.label });
    } catch (err) {
        console.error('[ApiKey] Delete error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = { getAllKeys, createKey, updateKey, revokeKey, deleteApiKey };
