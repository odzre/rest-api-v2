/**
 * Alight Motion Controller
 * Proxy to external Alight Motion premium activation API
 */
const { sendResponse } = require('../library/response');
const db = require('../config/database');

const API_BASE = 'https://kyuu2nd.dev/api/alight-motion';
const SETTINGS_KEY = 'alight_motion';

/**
 * Get stored API key for Alight Motion
 */
async function getAmApiKey() {
    const row = await db.getOne("SELECT `value` FROM settings WHERE `key` = ?", [SETTINGS_KEY]);
    if (!row) return null;
    const data = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return data.api_key || null;
}

/**
 * GET /api/user/alight-motion/send?email=...
 */
const sendVerification = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || !email.trim()) return sendResponse(res, 400, false, 'Email wajib diisi.');

        const apikey = await getAmApiKey();
        if (!apikey) return sendResponse(res, 500, false, 'API Key Alight Motion belum dikonfigurasi. Hubungi admin.');

        const url = `${API_BASE}/am-send?apikey=${encodeURIComponent(apikey)}&email=${encodeURIComponent(email.trim())}`;
        const resp = await fetch(url, { headers: { accept: '*/*' } });
        const data = await resp.json();

        if (data.status) {
            console.log(`[AlightMotion] Send OK: email=${email}`);
            return sendResponse(res, 200, true, data.result?.message || 'Link verifikasi berhasil dikirim.', {
                email: data.result?.email || email,
                type: data.result?.type,
                usage: data.result?.usage,
            });
        } else {
            const errMsg = data.result?.message || data.message || 'Gagal mengirim verifikasi.';
            console.error(`[AlightMotion] Send GAGAL: email=${email} | HTTP=${resp.status} | msg=${errMsg} | raw=${JSON.stringify(data)}`);
            return sendResponse(res, 400, false, errMsg);
        }
    } catch (err) {
        console.error('[AlightMotion] Send error:', err.message);
        return sendResponse(res, 500, false, 'Gagal menghubungi server Alight Motion: ' + err.message);
    }
};

/**
 * GET /api/user/alight-motion/verif?email=...&link=...
 */
const verifyAccount = async (req, res) => {
    try {
        const { email, link } = req.query;
        if (!email || !email.trim()) return sendResponse(res, 400, false, 'Email wajib diisi.');
        if (!link || !link.trim()) return sendResponse(res, 400, false, 'Link verifikasi wajib diisi.');

        const apikey = await getAmApiKey();
        if (!apikey) return sendResponse(res, 500, false, 'API Key Alight Motion belum dikonfigurasi. Hubungi admin.');

        const url = `${API_BASE}/am-verif?apikey=${encodeURIComponent(apikey)}&email=${encodeURIComponent(email.trim())}&link=${encodeURIComponent(link.trim())}`;
        const resp = await fetch(url, { headers: { accept: '*/*' } });
        const data = await resp.json();

        if (data.status) {
            console.log(`[AlightMotion] Verif OK: email=${email}`);
            return sendResponse(res, 200, true, data.result?.message || 'Verifikasi berhasil!', {
                email: data.result?.email || email,
                type: data.result?.type,
                duration: data.result?.duration,
                usage: data.result?.usage,
            });
        } else {
            const errMsg = data.result?.message || data.message || 'Verifikasi gagal.';
            console.error(`[AlightMotion] Verif GAGAL: email=${email} | HTTP=${resp.status} | msg=${errMsg} | raw=${JSON.stringify(data)}`);
            return sendResponse(res, 400, false, errMsg);
        }
    } catch (err) {
        console.error('[AlightMotion] Verif error:', err.message);
        return sendResponse(res, 500, false, 'Gagal menghubungi server Alight Motion: ' + err.message);
    }
};

// Admin settings
const getAmSettings = async (req, res) => {
    try {
        const row = await db.getOne("SELECT `value` FROM settings WHERE `key` = ?", [SETTINGS_KEY]);
        const data = row ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) : { api_key: '' };
        return sendResponse(res, 200, true, 'Alight Motion settings.', data);
    } catch (err) {
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

const updateAmSettings = async (req, res) => {
    try {
        const { api_key } = req.body;
        const data = { api_key: api_key || '' };
        const jsonStr = JSON.stringify(data);
        await db.run(
            "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
            [SETTINGS_KEY, jsonStr]
        );
        return sendResponse(res, 200, true, 'Alight Motion settings berhasil disimpan.', data);
    } catch (err) {
        return sendResponse(res, 500, false, 'Gagal menyimpan: ' + (err.message || ''));
    }
};

module.exports = { sendVerification, verifyAccount, getAmSettings, updateAmSettings };
