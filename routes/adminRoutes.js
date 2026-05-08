const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyAdmin = require('../middleware/adminAuth');

// Rute public (tanpa auth)
router.post('/login', adminController.login);

// Rute protected (perlu session token)
router.post('/logout', verifyAdmin, adminController.logout);
router.get('/profile', verifyAdmin, adminController.getProfile);
router.get('/stats', verifyAdmin, adminController.getDashboardStats);
router.get('/logs', verifyAdmin, adminController.getRequestLogs);

// Notification settings
router.get('/notification-settings', verifyAdmin, adminController.getNotificationSettings);
router.put('/notification-settings', verifyAdmin, adminController.updateNotificationSettings);
router.post('/notification-test', verifyAdmin, adminController.testNotification);

module.exports = router;
