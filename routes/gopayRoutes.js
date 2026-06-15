const express = require('express');
const router = express.Router();
const gopayController = require('../controllers/gopayController');
const orderController = require('../controllers/orderController');
const verifyApiKey = require('../middleware/auth');
const { injectGopayTokens } = require('../middleware/tokenInjector');
const { requireFeature } = require('../middleware/featureCheck');

// Semua endpoint GoPay dilindungi API Key + feature check
router.use(verifyApiKey);
router.use(requireFeature('allow_gopay'));

router.post('/get-otp-gopaymerchant', gopayController.requestOtp);
router.post('/get-token-gopaymerchant', gopayController.verifyOtp);
router.post('/get-mutasi-gopaymerchant', gopayController.getMutasi);

// Order & Callback — auto-inject tokens from saved data
router.post('/order-gomerchant', injectGopayTokens, orderController.createOrderGomerchant);
router.get('/status-gomerchant', orderController.statusGomerchant);

module.exports = router;

