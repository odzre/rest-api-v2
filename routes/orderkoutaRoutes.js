const express = require('express');
const router = express.Router();
const orderkoutaController = require('../controllers/orderkoutaController');
const orderController = require('../controllers/orderController');
const verifyApiKey = require('../middleware/auth');

router.use(verifyApiKey);

router.post('/get-otp-orderkouta', orderkoutaController.requestOtp);
router.post('/get-token-orderkouta', orderkoutaController.getToken);
router.post('/get-mutasi-orderkouta', orderkoutaController.getMutasi);

// Order & Callback
router.post('/order-orkut', orderController.createOrderOrkut);
router.get('/status-orkut', orderController.statusOrkut);

module.exports = router;
