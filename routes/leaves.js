const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/balance', LeaveController.getBalance);
router.post('/request', LeaveController.createRequest);
router.get('/requests', LeaveController.getRequests);

module.exports = router;