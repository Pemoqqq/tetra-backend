const express = require('express');
const router = express.Router();
const ShiftController = require('../controllers/shiftController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Начало смены (employee_id берётся из токена)
router.post('/start', ShiftController.startShift);

// Завершение смены
router.post('/end', ShiftController.endShift);

// Получение моих смен
router.get('/my', ShiftController.getMyShifts);

// Получение активной смены
router.get('/active', ShiftController.getActiveShift);

// Получение смен подразделения (только для руководителей и админов)
router.get('/department', checkRole(['manager', 'admin']), ShiftController.getDepartmentShifts);

module.exports = router;