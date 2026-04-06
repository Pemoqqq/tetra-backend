const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const { authenticateToken } = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Получить баланс отпускных дней
router.get('/balance', LeaveController.getBalance);

// Создать заявку на отпуск
router.post('/request', LeaveController.createRequest);

// Получить список заявок сотрудника
router.get('/requests', LeaveController.getRequests);

module.exports = router;