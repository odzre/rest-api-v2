const express = require('express');
const router = express.Router();
const amCtrl = require('../controllers/alightMotionController');
const verifyApiKey = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureCheck');

// Gunakan auth API Key untuk public endpoint ini
router.use(verifyApiKey);
router.use(requireFeature('allow_alight_motion'));

router.get('/send-email', amCtrl.sendVerification);
router.get('/verif', amCtrl.verifyAccount);

module.exports = router;
