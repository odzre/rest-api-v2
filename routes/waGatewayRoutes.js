const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middleware/auth');
const { sendResponse } = require('../library/response');
const wa = require('../services/waGateway');

// Semua endpoint WA dilindungi API Key
router.use(verifyApiKey);

/**
 * POST /api/v5/whatsapp/send-message
 * Headers: x-api-key
 * Body: { to: "628xxx", message: "Hello" }
 */
router.post('/send-message', async (req, res) => {
    try {
        const userId = req.apiKeyInfo.userId;
        if (!userId) return sendResponse(res, 400, false, 'API Key tidak terhubung ke user.');

        const { to, message } = req.body;
        if (!to || !message) return sendResponse(res, 400, false, 'Parameter "to" dan "message" wajib diisi.');

        // Check connection
        const status = await wa.getStatus(userId);
        if (!status.connected) {
            return sendResponse(res, 400, false, 'WhatsApp belum terhubung. Silakan hubungkan melalui dashboard terlebih dahulu.');
        }

        const result = await wa.sendMessage(userId, to, message);
        return sendResponse(res, 200, true, 'Pesan berhasil dikirim.', result);
    } catch (err) {
        return sendResponse(res, 400, false, err.message);
    }
});

module.exports = router;
