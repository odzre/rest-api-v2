const express = require('express');
const router = express.Router();
const cekidController = require('../controllers/cekidController');
const verifyApiKey = require('../middleware/auth');

router.use(verifyApiKey);

router.get('/list-game', cekidController.listGame);
router.get('/:slug', cekidController.checkId);

module.exports = router;
