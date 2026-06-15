/**
 * Checkout Controller
 * Handles subscription purchase via QRIS (GoPay Merchant PG)
 */
const { sendResponse } = require('../library/response');
const db = require('../config/database');
const { getJSON, setJSON } = require('../config/redis');
const {
    convertStaticToDynamic, generateQrisImage, generateReffId,
    startPollingGomerchant, getOrder, updateOrder
} = require('../library/orderService');
const { decrypt } = require('../library/crypto');

/**
 * Extract merchant name from QRIS code string
 * QRIS field 59 = merchant name (tag 59, after length bytes)
 */
function extractMerchantName(qrisString) {
    try {
        const idx = qrisString.indexOf('5902');
        if (idx === -1) {
            // Try to find tag 59 with different length
            const match = qrisString.match(/59(\d{2})(.+?)(?:60|61|62|63)/);
            if (match) return match[2];
        }
        // Parse TLV: find tag 59
        let pos = 0;
        while (pos < qrisString.length - 4) {
            const tag = qrisString.substring(pos, pos + 2);
            const len = parseInt(qrisString.substring(pos + 2, pos + 4));
            if (isNaN(len)) break;
            const val = qrisString.substring(pos + 4, pos + 4 + len);
            if (tag === '59') return val;
            pos += 4 + len;
        }
    } catch (_) {}
    return 'Merchant';
}

/**
 * POST /api/user/checkout
 * Body: { plan_id }
 */
const createCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { plan_id } = req.body;
        if (!plan_id) return sendResponse(res, 400, false, 'plan_id wajib diisi.');

        // Get plan
        const plan = await db.getOne('SELECT * FROM subscription_plans WHERE id = ? AND active = 1', [plan_id]);
        if (!plan) return sendResponse(res, 404, false, 'Paket langganan tidak ditemukan atau tidak aktif.');

        // Get PG settings
        const settingsRow = await db.getOne("SELECT `value` FROM settings WHERE `key` = 'pg_gopay'");
        if (!settingsRow) return sendResponse(res, 500, false, 'Payment gateway belum dikonfigurasi. Hubungi admin.');
        const pg = JSON.parse(settingsRow.value);
        if (!pg.code_qris || !pg.api_key) return sendResponse(res, 500, false, 'Payment gateway belum dikonfigurasi lengkap. Hubungi admin.');

        // Get admin tokens from api_key
        const apiKeyRow = await db.getOne('SELECT * FROM api_keys WHERE `key` = ?', [pg.api_key]);
        if (!apiKeyRow) return sendResponse(res, 500, false, 'API Key payment gateway tidak valid.');
        const adminUserId = apiKeyRow.user_id;

        const tokenRow = await db.getOne('SELECT * FROM user_tokens WHERE user_id = ?', [adminUserId]);
        if (!tokenRow || !tokenRow.gopay_access_token) return sendResponse(res, 500, false, 'Token GoPay Merchant belum tersimpan. Admin perlu setup.');

        const accessToken = decrypt(tokenRow.gopay_access_token);
        const refreshToken = decrypt(tokenRow.gopay_refresh_token);
        const uniqueId = tokenRow.gopay_x_uniqueid ? decrypt(tokenRow.gopay_x_uniqueid) : require('uuid').v4();

        // Calculate total
        const basePrice = plan.price;
        const feeAmount = Math.ceil(basePrice * (pg.fee_percent || 0) / 100);
        const randomMax = Math.pow(10, pg.random_digits || 3);
        const randomMin = Math.pow(10, (pg.random_digits || 3) - 1);
        const randomAmount = Math.floor(Math.random() * (randomMax - randomMin)) + randomMin;
        const totalAmount = basePrice + feeAmount + randomAmount;

        // Convert QRIS
        const dynamicQris = convertStaticToDynamic(totalAmount, pg.code_qris);
        const { qris_url, filePath } = await generateQrisImage(dynamicQris, req);

        // Generate reffid
        const reffid = 'SUB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Extract merchant name from QRIS
        const merchantName = extractMerchantName(pg.code_qris);

        // Get user info
        const user = await db.getOne('SELECT username, email FROM users WHERE id = ?', [userId]);

        const expiredMinutes = 30;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiredMinutes * 60 * 1000);

        // Save to Redis
        const orderData = {
            reffid,
            type: 'subscription',
            plan_id: plan.id,
            plan_name: plan.name,
            user_id: userId,
            username: user?.username || '',
            base_price: basePrice,
            fee_amount: feeAmount,
            random_amount: randomAmount,
            nominal: totalAmount,
            status: 'PENDING',
            qris_url,
            qris_string: dynamicQris,
            qris_file: filePath,
            merchant_name: merchantName,
            expired_minutes: expiredMinutes,
            expires_at: expiresAt.toISOString(),
            created_at: now.toISOString(),
            _userId: adminUserId, // for token refresh in polling
        };

        await setJSON(`checkout:${reffid}`, orderData, 7200);
        // Also save as order: for polling compatibility
        await setJSON(`order:${reffid}`, orderData, 7200);

        // Start polling
        startPollingGomerchant(reffid, {
            access_token: accessToken,
            refresh_token: refreshToken,
            x_uniqueid: uniqueId,
        }, expiredMinutes);

        // Override handlePaid to auto-activate subscription
        monitorCheckout(reffid, plan, userId);

        return sendResponse(res, 200, true, 'Checkout berhasil dibuat.', {
            reffid,
            plan_name: plan.name,
            base_price: basePrice,
            fee_amount: feeAmount,
            random_amount: randomAmount,
            total: totalAmount,
            qris_url,
            merchant_name: merchantName,
            expired_minutes: expiredMinutes,
            expires_at: expiresAt.toISOString(),
            checkout_url: `/check-out/invoice/${reffid}`,
        });
    } catch (err) {
        console.error('[Checkout] Error:', err.message);
        return sendResponse(res, 500, false, 'Gagal membuat checkout: ' + err.message);
    }
};

/**
 * Monitor checkout status and auto-activate subscription when paid
 */
function monitorCheckout(reffid, plan, userId) {
    const checkInterval = setInterval(async () => {
        try {
            const order = await getJSON(`order:${reffid}`);
            if (!order) { clearInterval(checkInterval); return; }

            if (order.status === 'PAID') {
                clearInterval(checkInterval);

                // Update checkout status
                await setJSON(`checkout:${reffid}`, { ...order, status: 'PAID', paid_at: order.paid_at }, 86400);

                // Activate subscription
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

                await db.run(
                    'UPDATE users SET api_key_active = 1, subscription_plan_id = ?, subscription_expires_at = ? WHERE id = ?',
                    [plan.id, expiresAt, userId]
                );

                // Update API key rate limit
                const rateLimit = plan.rate_limit || 0;
                await db.run(
                    'UPDATE api_keys SET active = 1, rate_limit = ? WHERE user_id = ?',
                    [rateLimit, userId]
                );

                console.log(`[Checkout] Subscription activated: user=${userId}, plan=${plan.name}, expires=${expiresAt.toISOString()}`);
            } else if (order.status === 'EXPIRED') {
                clearInterval(checkInterval);
                await setJSON(`checkout:${reffid}`, { ...order, status: 'EXPIRED' }, 86400);
            }
        } catch (err) {
            console.error(`[Checkout] Monitor error ${reffid}:`, err.message);
        }
    }, 5000);

    // Auto-stop monitoring after 35 minutes
    setTimeout(() => clearInterval(checkInterval), 35 * 60 * 1000);
}

/**
 * GET /api/checkout/status/:reffid
 * Public endpoint — no auth needed
 */
const getCheckoutStatus = async (req, res) => {
    try {
        const { reffid } = req.params;
        if (!reffid) return sendResponse(res, 400, false, 'reffid wajib diisi.');

        // Try checkout first, fallback to order
        let order = await getJSON(`checkout:${reffid}`);
        if (!order) order = await getJSON(`order:${reffid}`);
        if (!order) return sendResponse(res, 404, false, 'Transaksi tidak ditemukan atau sudah expired.');

        // Auto-check expiry
        if (order.status === 'PENDING' && order.expires_at && new Date() > new Date(order.expires_at)) {
            order.status = 'EXPIRED';
            order.expired_at = new Date().toISOString();
        }

        return sendResponse(res, 200, true, 'Status checkout.', {
            reffid: order.reffid,
            plan_name: order.plan_name,
            username: order.username,
            base_price: order.base_price,
            fee_amount: order.fee_amount,
            random_amount: order.random_amount,
            nominal: order.nominal,
            status: order.status,
            qris_url: order.qris_url,
            qris_string: order.qris_string,
            merchant_name: order.merchant_name,
            expired_minutes: order.expired_minutes,
            expires_at: order.expires_at,
            created_at: order.created_at,
            paid_at: order.paid_at || null,
            mutation_data: order.mutation_data || null,
        });
    } catch (err) {
        console.error('[Checkout] Status error:', err.message);
        return sendResponse(res, 500, false, 'Terjadi kesalahan server.');
    }
};

module.exports = { createCheckout, getCheckoutStatus };
