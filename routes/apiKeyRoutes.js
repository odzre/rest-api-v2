const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const verifyAdmin = require('../middleware/adminAuth');

// Semua rute API key dilindungi oleh admin auth
router.use(verifyAdmin);

router.get('/', apiKeyController.getAllKeys);
router.post('/', apiKeyController.createKey);
router.put('/:id', apiKeyController.updateKey);
router.patch('/:id/revoke', apiKeyController.revokeKey);
router.delete('/:id', apiKeyController.deleteApiKey);

module.exports = router;
