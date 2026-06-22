/**
 * Middleware: Check feature access based on user's subscription plan
 * Supports both session auth (req.user.userId) and API key auth (req.apiKeyInfo.userId)
 * Usage: requireFeature('allow_gopay') or requireFeature('allow_digiflazz')
 */
const db = require('../config/database');
const { sendResponse } = require('../library/response');

const FEATURE_NAMES = {
    allow_gopay: 'GoPay Merchant',
    allow_orderkouta: 'OrderKuota',
    allow_digiflazz: 'Digiflazz Tools',
    allow_wa_gateway: 'WA Gateway',
    allow_alight_motion: 'Alight Motion'
};

const requireFeature = (featureColumn) => {
    return async (req, res, next) => {
        try {
            // Support both session auth and API key auth
            const userId = req.user?.userId || req.apiKeyInfo?.userId;
            if (!userId) return sendResponse(res, 401, false, 'Unauthorized.');

            const user = await db.getOne('SELECT api_key_active, subscription_plan_id, subscription_expires_at FROM users WHERE id = ?', [userId]);
            if (!user) return sendResponse(res, 404, false, 'User tidak ditemukan.');

            // If user has active subscription, check plan permissions
            if (user.api_key_active && user.subscription_plan_id) {
                // Check if subscription is expired
                if (user.subscription_expires_at && new Date() > new Date(user.subscription_expires_at)) {
                    if (featureColumn === 'allow_digiflazz') {
                        return sendResponse(res, 403, false, 'Langganan Anda sudah expired. Fitur Digiflazz Tools tidak tersedia.');
                    }
                    return next();
                }

                const plan = await db.getOne(`SELECT ${featureColumn} FROM subscription_plans WHERE id = ?`, [user.subscription_plan_id]);
                if (plan && !plan[featureColumn]) {
                    const featureName = FEATURE_NAMES[featureColumn] || featureColumn;
                    return sendResponse(res, 403, false, `Fitur ${featureName} tidak tersedia di paket langganan Anda.`);
                }
            } else {
                // No active subscription — digiflazz blocked, others allowed
                if (featureColumn === 'allow_digiflazz') {
                    return sendResponse(res, 403, false, 'Fitur Digiflazz Tools hanya tersedia untuk user dengan langganan aktif.');
                }
            }

            next();
        } catch (err) {
            console.error('[FeatureCheck] Error:', err.message);
            return sendResponse(res, 500, false, 'Gagal memeriksa akses fitur.');
        }
    };
};

module.exports = { requireFeature };
