const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/create', TaskController.createTask);
router.get('/list', TaskController.getTasks);
router.post('/complete', TaskController.completeTask);

module.exports = router;