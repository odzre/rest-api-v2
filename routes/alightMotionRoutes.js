const express = require('express');
const router = express.Router();
const amCtrl = require('../controllers/alightMotionController');
const { verifyApiKey, requireFeature } = require('../middleware/auth');

// Gunakan auth API Key untuk public endpoint ini
router.use(verifyApiKey);
router.use(requireFeature('allow_alight_motion'));

router.get('/send-email', amCtrl.sendVerification);
router.get('/verif', amCtrl.verifyAccount);

module.exports = router;
