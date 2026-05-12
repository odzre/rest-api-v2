const db = require('../config/database');
const { decrypt } = require('../library/crypto');

/**
 * Middleware: Auto-inject saved GoPay tokens into req.body
 * Runs AFTER verifyApiKey — checks if API key belongs to a user with saved tokens
 */
const injectGopayTokens = async (req, res, next) => {
    try {
        // Jika token sudah ada di body, lanjut langsung
        if (req.body.access_token && req.body.refresh_token) return next();

        const keyInfo = req.apiKeyInfo;
        if (!keyInfo || !keyInfo.userId) return next(); // API key tanpa user — biarkan controller validasi

        const tokens = await db.getOne('SELECT * FROM user_tokens WHERE user_id = ?', [keyInfo.userId]);
        if (!tokens || !tokens.gopay_access_token) {
            // User terdaftar tapi belum simpan token — beri tahu langsung
            const { sendResponse } = require('../library/response');
            return sendResponse(res, 400, false,
                'Token GoPay Merchant belum tersimpan. Silakan login GoPay Merchant di dashboard user dan simpan token terlebih dahulu.');
        }

        // Decrypt and inject
        req.body.access_token = decrypt(tokens.gopay_access_token);
        req.body.refresh_token = decrypt(tokens.gopay_refresh_token);
        if (tokens.gopay_x_uniqueid) {
            req.body.x_uniqueid = req.body.x_uniqueid || decrypt(tokens.gopay_x_uniqueid);
        }

        console.log(`[AutoInject] GoPay tokens injected for user #${keyInfo.userId}`);
        next();
    } catch (err) {
        console.error('[AutoInject] GoPay error:', err.message);
        next(); // Kalau error teknis, biarkan controller handle
    }
};

/**
 * Middleware: Auto-inject saved OrderKuota tokens into req.body
 */
const injectOrkutTokens = async (req, res, next) => {
    try {
        // Jika token sudah ada di body, lanjut langsung
        if (req.body.username && req.body.auth_token) return next();

        const keyInfo = req.apiKeyInfo;
        if (!keyInfo || !keyInfo.userId) return next(); // API key tanpa user — biarkan controller validasi

        const tokens = await db.getOne('SELECT * FROM user_tokens WHERE user_id = ?', [keyInfo.userId]);
        if (!tokens || !tokens.orkut_auth_token) {
            // User terdaftar tapi belum simpan token — beri tahu langsung
            const { sendResponse } = require('../library/response');
            return sendResponse(res, 400, false,
                'Token OrderKuota belum tersimpan. Silakan login OrderKuota di dashboard user dan simpan token terlebih dahulu.');
        }

        req.body.username = decrypt(tokens.orkut_username);
        req.body.auth_token = decrypt(tokens.orkut_auth_token);

        console.log(`[AutoInject] OrderKuota tokens injected for user #${keyInfo.userId}`);
        next();
    } catch (err) {
        console.error('[AutoInject] OrderKuota error:', err.message);
        next();
    }
};

module.exports = { injectGopayTokens, injectOrkutTokens };
