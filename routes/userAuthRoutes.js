const express = require('express');
const router = express.Router();
const uc = require('../controllers/userAuthController');
const verifyUser = require('../middleware/userAuth');
const { requireFeature } = require('../middleware/featureCheck');

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
router.post('/gopay/save-token', verifyUser, requireFeature('allow_gopay'), uc.saveGopayToken);
router.get('/gopay/token-status', verifyUser, requireFeature('allow_gopay'), uc.getGopayTokenStatus);
router.delete('/gopay/delete-token', verifyUser, requireFeature('allow_gopay'), uc.deleteGopayToken);

// OrderKuota token management
router.post('/orderkouta/save-token', verifyUser, requireFeature('allow_orderkouta'), uc.saveOrderkoutaToken);
router.get('/orderkouta/token-status', verifyUser, requireFeature('allow_orderkouta'), uc.getOrderkoutaTokenStatus);
router.delete('/orderkouta/delete-token', verifyUser, requireFeature('allow_orderkouta'), uc.deleteOrderkoutaToken);

// Digiflazz Tools
const digi = require('../controllers/digiflazzController');
router.get('/digiflazz/session-status', verifyUser, requireFeature('allow_digiflazz'), digi.getSessionStatus);
router.post('/digiflazz/login', verifyUser, requireFeature('allow_digiflazz'), digi.login);
router.post('/digiflazz/verify-2fa', verifyUser, requireFeature('allow_digiflazz'), digi.verify2fa);
router.delete('/digiflazz/logout', verifyUser, requireFeature('allow_digiflazz'), digi.logout);
router.get('/digiflazz/categories', verifyUser, requireFeature('allow_digiflazz'), digi.getCategories);
router.get('/digiflazz/brands', verifyUser, requireFeature('allow_digiflazz'), digi.getBrands);
router.get('/digiflazz/types', verifyUser, requireFeature('allow_digiflazz'), digi.getTypes);
router.get('/digiflazz/products/:categoryId', verifyUser, requireFeature('allow_digiflazz'), digi.getProducts);
router.post('/digiflazz/execute', verifyUser, requireFeature('allow_digiflazz'), digi.executeUpdate);

// WA Gateway
const waCtrl = require('../controllers/waGatewayController');
router.get('/wa/status', verifyUser, waCtrl.getStatus);
router.get('/wa/connect', verifyUser, waCtrl.connect);
router.post('/wa/pair', verifyUser, waCtrl.requestPair);
router.delete('/wa/disconnect', verifyUser, waCtrl.disconnect);
router.post('/wa/send', verifyUser, waCtrl.sendMsg);
router.post('/wa/broadcast', verifyUser, waCtrl.broadcastMsg);
router.get('/wa/groups', verifyUser, waCtrl.listGroups);
router.get('/wa/groups/:id', verifyUser, waCtrl.groupInfo);
router.post('/wa/groups/:id/send', verifyUser, waCtrl.sendToGroup);
router.get('/wa/commands', verifyUser, waCtrl.listCommands);
router.post('/wa/commands', verifyUser, waCtrl.createCommand);
router.put('/wa/commands/:id', verifyUser, waCtrl.editCommand);
router.delete('/wa/commands/:id', verifyUser, waCtrl.removeCommand);
router.get('/wa/logs', verifyUser, waCtrl.getWaLogs);
// Checkout (subscription purchase)
const checkoutCtrl = require('../controllers/checkoutController');
router.post('/checkout', verifyUser, checkoutCtrl.createCheckout);

// Alight Motion
const amCtrl = require('../controllers/alightMotionController');
router.get('/alight-motion/send', verifyUser, requireFeature('allow_alight_motion'), amCtrl.sendVerification);
router.get('/alight-motion/verif', verifyUser, requireFeature('allow_alight_motion'), amCtrl.verifyAccount);

module.exports = router;
