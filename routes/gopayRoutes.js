const express = require('express');
const router = express.Router();
const gopayController = require('../controllers/gopayController');
const orderController = require('../controllers/orderController');
const verifyApiKey = require('../middleware/auth');
const { injectGopayTokens } = require('../middleware/tokenInjector');

// Semua endpoint GoPay dilindungi API Key
router.use(verifyApiKey);

router.post('/get-otp-gopaymerchant', gopayController.requestOtp);
router.post('/get-token-gopaymerchant', gopayController.verifyOtp);
router.post('/get-mutasi-gopaymerchant', gopayController.getMutasi);

// Order & Callback — auto-inject tokens from saved data
router.post('/order-gomerchant', injectGopayTokens, orderController.createOrderGomerchant);
router.get('/status-gomerchant', orderController.statusGomerchant);

module.exports = router;

