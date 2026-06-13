const express = require('express');
const router = express.Router();
const uc = require('../controllers/userAuthController');
const verifyUser = require('../middleware/userAuth');

// Public routes
router.post('/register', uc.register);
router.post('/login', uc.login);
router.get('/subscription-plans', uc.getSubscriptionPlans);

// Protected routes (require user login)
router.post('/logout', verifyUser, uc.logout);
router.get('/profile', verifyUser, uc.getProfile);
router.put('/profile', verifyUser, uc.updateProfile);
router.put('/password', verifyUser, uc.changePassword);
router.get('/dashboard-stats', verifyUser, uc.getDashboardStats);

// GoPay token management
router.post('/gopay/save-token', verifyUser, uc.saveGopayToken);
router.get('/gopay/token-status', verifyUser, uc.getGopayTokenStatus);
router.delete('/gopay/delete-token', verifyUser, uc.deleteGopayToken);

// OrderKuota token management
router.post('/orderkouta/save-token', verifyUser, uc.saveOrderkoutaToken);
router.get('/orderkouta/token-status', verifyUser, uc.getOrderkoutaTokenStatus);
router.delete('/orderkouta/delete-token', verifyUser, uc.deleteOrderkoutaToken);

module.exports = router;
