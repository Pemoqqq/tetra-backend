const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Регистрация
router.post('/register', AuthController.register);

// Вход
router.post('/login', AuthController.login);

// Получение профиля (требуется авторизация)
router.get('/profile', authenticateToken, AuthController.getProfile);

module.exports = router;