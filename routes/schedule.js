const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');

// Защищаем все маршруты авторизацией
router.use(authenticateToken);

// Личный кабинет сотрудника
router.get('/my/:year/:month', ScheduleController.getMySchedule);

// Панель администратора
router.get('/admin/:year/:month', ScheduleController.getAdminSchedule);

// Назначение смены (с логикой конфликтов)
router.post('/assign', ScheduleController.assignShift);

// Получение списка сотрудников
router.get('/employees', ScheduleController.getEmployees);

// Маршруты для обмена сменами
router.post('/swap', ScheduleController.requestSwap);
router.get('/swaps/my', ScheduleController.getMySwaps);

module.exports = router;