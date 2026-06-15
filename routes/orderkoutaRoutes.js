const express = require('express');
const router = express.Router();
const orderkoutaController = require('../controllers/orderkoutaController');
const orderController = require('../controllers/orderController');
const verifyApiKey = require('../middleware/auth');
const { injectOrkutTokens } = require('../middleware/tokenInjector');
const { requireFeature } = require('../middleware/featureCheck');

router.use(verifyApiKey);
router.use(requireFeature('allow_orderkouta'));

router.post('/get-otp-orderkouta', orderkoutaController.requestOtp);
router.post('/get-token-orderkouta', orderkoutaController.getToken);
router.post('/get-mutasi-orderkouta', orderkoutaController.getMutasi);

// Order & Callback — auto-inject tokens from saved data
router.post('/order-orkut', injectOrkutTokens, orderController.createOrderOrkut);
router.get('/status-orkut', orderController.statusOrkut);

module.exports = router;

