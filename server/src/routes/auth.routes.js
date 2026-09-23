const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public route: login
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', verifyToken, getMe);
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
