const { sendResponse } = require('../library/response');
const { getJSON, setJSON, deleteKey, scanKeys } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

/** GET /api/admin/keys */
const getAllKeys = async (req, res) => {
    try {
        const keys = await scanKeys('apikey:*');
        const apiKeys = [];
        for (const key of keys) {
            const data = await getJSON(key);
            if (data) {
                if (data.expiredDays && data.expiredDays > 0) {
                    const expiresAt = new Date(new Date(data.createdAt).getTime() + data.expiredDays * 86400000);
                    data.isExpired = new Date() > expiresAt;
                    data.expiresAt = expiresAt.toISOString();
                } else {
                    data.isExpired = false;
                }
                apiKeys.push(data);
            }
        }
        apiKeys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sendResponse(res, 200, true, `${apiKeys.length} API key ditemukan.`, apiKeys);
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

        // Gunakan custom key jika disediakan, atau generate otomatis
        const key = customKey && customKey.trim().length >= 8 ? customKey.trim() : `sk-${uuidv4()}`;

        // Cek duplikat key
        const existingKeys = await scanKeys('apikey:*');
        for (const k of existingKeys) {
            const d = await getJSON(k);
            if (d && d.key === key) {
                return sendResponse(res, 409, false, 'API Key ini sudah digunakan. Gunakan key yang berbeda.');
            }
        }

        const id = uuidv4().split('-')[0];
        const now = new Date();
        const expDays = parseInt(expiredDays) || 0;
        const rateLim = parseInt(rateLimit) || 0;

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

        await setJSON(`apikey:${id}`, apiKey);
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
        const apiKey = await getJSON(`apikey:${id}`);
        if (!apiKey) return sendResponse(res, 404, false, 'API Key tidak ditemukan.');

        const { label, customKey, expiredDays, rateLimit } = req.body;

        // Update label
        if (label && label.trim()) apiKey.label = label.trim();

        // Update key value (jika disediakan dan minimal 8 karakter)
        if (customKey && customKey.trim().length >= 8 && customKey.trim() !== apiKey.key) {
            // Cek duplikat
            const allKeys = await scanKeys('apikey:*');
            for (const k of allKeys) {
                const d = await getJSON(k);
                if (d && d.key === customKey.trim() && d.id !== id) {
                    return sendResponse(res, 409, false, 'API Key ini sudah digunakan oleh key lain.');
                }
            }
            apiKey.key = customKey.trim();
        }

        // Update expired
        if (expiredDays !== undefined) {
            const expDays = parseInt(expiredDays) || 0;
            apiKey.expiredDays = expDays;
            apiKey.expiresAt = expDays > 0 ? new Date(new Date(apiKey.createdAt).getTime() + expDays * 86400000).toISOString() : null;
        }

        // Update rate limit
        if (rateLimit !== undefined) {
            apiKey.rateLimit = parseInt(rateLimit) || 0;
        }

        apiKey.updatedAt = new Date().toISOString();
        await setJSON(`apikey:${id}`, apiKey);
        return sendResponse(res, 200, true, 'API Key berhasil diupdate.', apiKey);
    } catch (err) {
        console.error('[ApiKey] Update error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** PATCH /api/admin/keys/:id/revoke */
const revokeKey = async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = await getJSON(`apikey:${id}`);
        if (!apiKey) return sendResponse(res, 404, false, 'API Key tidak ditemukan.');
        apiKey.active = !apiKey.active;
        await setJSON(`apikey:${id}`, apiKey);
        return sendResponse(res, 200, true, `API Key berhasil ${apiKey.active ? 'diaktifkan' : 'dinonaktifkan'}.`, apiKey);
    } catch (err) {
        console.error('[ApiKey] Revoke error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

/** DELETE /api/admin/keys/:id */
const deleteApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = await getJSON(`apikey:${id}`);
        if (!apiKey) return sendResponse(res, 404, false, 'API Key tidak ditemukan.');
        await deleteKey(`apikey:${id}`);
        return sendResponse(res, 200, true, 'API Key berhasil dihapus.', { id, label: apiKey.label });
    } catch (err) {
        console.error('[ApiKey] Delete error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = { getAllKeys, createKey, updateKey, revokeKey, deleteApiKey };
