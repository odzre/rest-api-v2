const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const uc = require('../controllers/userAuthController');
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

// Subscription plan management
router.get('/subscription-plans', verifyAdmin, uc.adminGetPlans);
router.post('/subscription-plans', verifyAdmin, uc.adminCreatePlan);
router.put('/subscription-plans/:id', verifyAdmin, uc.adminUpdatePlan);
router.delete('/subscription-plans/:id', verifyAdmin, uc.adminDeletePlan);

// User management
router.get('/users-list', verifyAdmin, uc.adminGetUsers);
router.post('/activate-subscription', verifyAdmin, uc.adminActivateSubscription);
router.post('/deactivate-user', verifyAdmin, uc.adminDeactivateUser);

// Site config (file-based, no database)
const { getSiteConfig, saveSiteConfig } = require('../config/siteConfig');
router.get('/site-config', verifyAdmin, (req, res) => {
    res.json({ success: true, data: getSiteConfig() });
});
router.put('/site-config', verifyAdmin, (req, res) => {
    try {
        const { title, siteName, author, favicon, whatsapp } = req.body;
        const current = getSiteConfig();
        if (title !== undefined) current.title = title;
        if (siteName !== undefined) current.siteName = siteName;
        if (author !== undefined) current.author = author;
        if (favicon !== undefined) current.favicon = favicon;
        if (whatsapp !== undefined) current.whatsapp = whatsapp;
        saveSiteConfig(current);
        res.json({ success: true, message: 'Site config berhasil disimpan.', data: current });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan: ' + err.message });
    }
});

// PG GoPay Merchant settings
router.get('/settings/pg-gopay', verifyAdmin, adminController.getPgGopaySettings);
router.put('/settings/pg-gopay', verifyAdmin, adminController.updatePgGopaySettings);
// WA Notification settings
router.get('/settings/wa-notifications', verifyAdmin, adminController.getWaNotifSettings);
router.put('/settings/wa-notifications', verifyAdmin, adminController.updateWaNotifSettings);
router.post('/broadcast', verifyAdmin, adminController.sendBroadcast);
// Alight Motion settings
const amCtrl = require('../controllers/alightMotionController');
router.get('/settings/alight-motion', verifyAdmin, amCtrl.getAmSettings);
router.put('/settings/alight-motion', verifyAdmin, amCtrl.updateAmSettings);

// Landing Page Footer settings
const db = require('../config/database');
router.get('/settings/landing-footer', verifyAdmin, async (req, res) => {
    try {
        const row = await db.getOne("SELECT `value` FROM settings WHERE `key` = ?", ['landing_footer']);
        const data = row ? (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) : {};
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memuat: ' + err.message });
    }
});
router.put('/settings/landing-footer', verifyAdmin, async (req, res) => {
    try {
        const jsonStr = JSON.stringify(req.body);
        await db.run(
            "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
            ['landing_footer', jsonStr]
        );
        res.json({ success: true, message: 'Footer settings berhasil disimpan.', data: req.body });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan: ' + err.message });
    }
});

module.exports = router;
