const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyApiKey = require('../middleware/auth');

router.use(verifyApiKey);

router.post('/create-qris', paymentController.createQris);

module.exports = router;
