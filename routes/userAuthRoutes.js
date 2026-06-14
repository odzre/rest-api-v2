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

// Digiflazz Tools
const digi = require('../controllers/digiflazzController');
router.get('/digiflazz/session-status', verifyUser, digi.getSessionStatus);
router.post('/digiflazz/login', verifyUser, digi.login);
router.post('/digiflazz/verify-2fa', verifyUser, digi.verify2fa);
router.delete('/digiflazz/logout', verifyUser, digi.logout);
router.get('/digiflazz/categories', verifyUser, digi.getCategories);
router.get('/digiflazz/brands', verifyUser, digi.getBrands);
router.get('/digiflazz/types', verifyUser, digi.getTypes);
router.get('/digiflazz/products/:categoryId', verifyUser, digi.getProducts);
router.post('/digiflazz/execute', verifyUser, digi.executeUpdate);

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

module.exports = router;
