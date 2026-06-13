const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyApiKey = require('../middleware/auth');

// Pasang middleware API Key ke semua rute di bawah ini
router.use(verifyApiKey);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;