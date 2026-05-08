const express = require('express');
const router = express.Router();
const gopayController = require('../controllers/gopayController');
const orderController = require('../controllers/orderController');
const verifyApiKey = require('../middleware/auth');

// Semua endpoint GoPay dilindungi API Key
router.use(verifyApiKey);

router.post('/get-otp-gopaymerchant', gopayController.requestOtp);
router.post('/get-token-gopaymerchant', gopayController.verifyOtp);
router.post('/get-mutasi-gopaymerchant', gopayController.getMutasi);

// Order & Callback
router.post('/order-gomerchant', orderController.createOrderGomerchant);
router.get('/status-gomerchant', orderController.statusGomerchant);

module.exports = router;
