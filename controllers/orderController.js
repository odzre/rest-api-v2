const { sendResponse } = require('../library/response');
const {
    generateReffId, convertStaticToDynamic, generateQrisImage,
    saveOrder, getOrder,
    startPollingOrkut, startPollingGomerchant,
} = require('../library/orderService');

// ==========================================
// ORDER ORKUT (OrderKuota)
// ==========================================

/**
 * POST /api/v5/orderkouta/order-orkut
 * Body: { username, auth_token, nominal, code_qris, expired_minutes?, webhook_url? }
 */
const createOrderOrkut = async (req, res) => {
    try {
        const { username, auth_token, nominal, code_qris, expired_minutes, webhook_url } = req.body;

        if (!username || !auth_token || !nominal || !code_qris) {
            return sendResponse(res, 400, false, 'username, auth_token, nominal, dan code_qris wajib diisi.');
        }

        const amount = parseInt(nominal);
        if (isNaN(amount) || amount <= 0) {
            return sendResponse(res, 400, false, 'nominal harus angka lebih dari 0.');
        }

        if (!code_qris.includes("010211") && !code_qris.includes("010212")) {
            return sendResponse(res, 400, false, 'code_qris tidak valid.');
        }

        let expiry = parseInt(expired_minutes) || 30;
        if (expiry < 1) expiry = 1;
        if (expiry > 60) expiry = 60;

        // Generate QRIS dinamis
        const dynamicQris = convertStaticToDynamic(amount, code_qris);
        const qrisImg = await generateQrisImage(dynamicQris, req);

        // Generate reffid
        const reffid = generateReffId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiry * 60 * 1000);

        // Save order
        const orderData = {
            reffid,
            type: 'orkut',
            nominal: amount,
            status: 'PENDING',
            _userId: req.apiKeyInfo?.userId || null,
            qris_url: qrisImg.qris_url,
            qris_string: dynamicQris,
            qris_file: qrisImg.filePath,
            webhook_url: webhook_url || null,
            expired_minutes: expiry,
            expires_at: expiresAt.toISOString(),
            created_at: now.toISOString(),
        };

        await saveOrder(reffid, orderData);

        // Start polling mutasi
        startPollingOrkut(reffid, { username, auth_token }, expiry);

        return sendResponse(res, 200, true, 'Order berhasil dibuat. Silakan scan QRIS untuk membayar.', {
            reffid,
            nominal: amount,
            status: 'PENDING',
            qris_url: qrisImg.qris_url,
            qris_string: dynamicQris,
            expired_minutes: expiry,
            expires_at: expiresAt.toISOString(),
            webhook_url: webhook_url || null,
        });
    } catch (err) {
        console.error('[Order] Create orkut error:', err.message);
        return sendResponse(res, 500, false, 'Gagal membuat order: ' + err.message);
    }
};

/**
 * GET /api/v5/orderkouta/status-orkut?reffid=ODZRE-xxx
 */
const statusOrkut = async (req, res) => {
    try {
        const { reffid } = req.query;
        if (!reffid) {
            return sendResponse(res, 400, false, 'Parameter reffid wajib diisi.');
        }

        const order = await getOrder(reffid);
        if (!order) {
            return sendResponse(res, 404, false, 'Order tidak ditemukan atau sudah expired.');
        }

        // Auto-expire check
        if (order.status === 'PENDING' && new Date() > new Date(order.expires_at)) {
            order.status = 'EXPIRED';
        }

        return sendResponse(res, 200, true, `Status order: ${order.status}`, {
            reffid: order.reffid,
            type: order.type,
            nominal: order.nominal,
            status: order.status,
            qris_url: order.qris_url,
            webhook_url: order.webhook_url,
            created_at: order.created_at,
            expires_at: order.expires_at,
            paid_at: order.paid_at || null,
            expired_at: order.expired_at || null,
            mutation_data: order.mutation_data || null,
        });
    } catch (err) {
        console.error('[Order] Status orkut error:', err.message);
        return sendResponse(res, 500, false, 'Gagal cek status: ' + err.message);
    }
};

// ==========================================
// ORDER GOMERCHANT (GoPay Merchant)
// ==========================================

/**
 * POST /api/v5/gopay/order-gomerchant
 * Body: { access_token, refresh_token, x_uniqueid?, nominal, code_qris, expired_minutes?, webhook_url? }
 */
const createOrderGomerchant = async (req, res) => {
    try {
        const { access_token, refresh_token, nominal, code_qris, x_uniqueid, expired_minutes, webhook_url } = req.body;

        if (!access_token || !refresh_token || !nominal || !code_qris) {
            return sendResponse(res, 400, false, 'access_token, refresh_token, nominal, dan code_qris wajib diisi.');
        }

        const amount = parseInt(nominal);
        if (isNaN(amount) || amount <= 0) {
            return sendResponse(res, 400, false, 'nominal harus angka lebih dari 0.');
        }

        if (!code_qris.includes("010211") && !code_qris.includes("010212")) {
            return sendResponse(res, 400, false, 'code_qris tidak valid.');
        }

        let expiry = parseInt(expired_minutes) || 30;
        if (expiry < 1) expiry = 1;
        if (expiry > 60) expiry = 60;

        // Generate QRIS dinamis
        const dynamicQris = convertStaticToDynamic(amount, code_qris);
        const qrisImg = await generateQrisImage(dynamicQris, req);

        // Generate reffid
        const reffid = generateReffId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiry * 60 * 1000);

        // Save order
        const orderData = {
            reffid,
            type: 'gomerchant',
            nominal: amount,
            status: 'PENDING',
            _userId: req.apiKeyInfo?.userId || null,
            qris_url: qrisImg.qris_url,
            qris_string: dynamicQris,
            qris_file: qrisImg.filePath,
            webhook_url: webhook_url || null,
            expired_minutes: expiry,
            expires_at: expiresAt.toISOString(),
            created_at: now.toISOString(),
        };

        await saveOrder(reffid, orderData);

        // Start polling mutasi
        startPollingGomerchant(reffid, { access_token, refresh_token, x_uniqueid }, expiry);

        return sendResponse(res, 200, true, 'Order berhasil dibuat. Silakan scan QRIS untuk membayar.', {
            reffid,
            nominal: amount,
            status: 'PENDING',
            qris_url: qrisImg.qris_url,
            qris_string: dynamicQris,
            expired_minutes: expiry,
            expires_at: expiresAt.toISOString(),
            webhook_url: webhook_url || null,
        });
    } catch (err) {
        console.error('[Order] Create gomerchant error:', err.message);
        return sendResponse(res, 500, false, 'Gagal membuat order: ' + err.message);
    }
};

/**
 * GET /api/v5/gopay/status-gomerchant?reffid=ODZRE-xxx
 */
const statusGomerchant = async (req, res) => {
    try {
        const { reffid } = req.query;
        if (!reffid) {
            return sendResponse(res, 400, false, 'Parameter reffid wajib diisi.');
        }

        const order = await getOrder(reffid);
        if (!order) {
            return sendResponse(res, 404, false, 'Order tidak ditemukan atau sudah expired.');
        }

        if (order.status === 'PENDING' && new Date() > new Date(order.expires_at)) {
            order.status = 'EXPIRED';
        }

        return sendResponse(res, 200, true, `Status order: ${order.status}`, {
            reffid: order.reffid,
            type: order.type,
            nominal: order.nominal,
            status: order.status,
            qris_url: order.qris_url,
            webhook_url: order.webhook_url,
            created_at: order.created_at,
            expires_at: order.expires_at,
            paid_at: order.paid_at || null,
            expired_at: order.expired_at || null,
            mutation_data: order.mutation_data || null,
        });
    } catch (err) {
        console.error('[Order] Status gomerchant error:', err.message);
        return sendResponse(res, 500, false, 'Gagal cek status: ' + err.message);
    }
};

module.exports = { createOrderOrkut, statusOrkut, createOrderGomerchant, statusGomerchant };
