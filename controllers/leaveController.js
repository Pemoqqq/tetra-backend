const Leave = require('../models/Leave');

class LeaveController {
  static async getBalance(req, res) {
    try {
      const employeeId = req.user.employee_id;
      
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID not found in token' });
      }

      const balance = await Leave.getBalance(employeeId);
      res.json(balance);
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({ error: 'Ошибка при получении баланса: ' + error.message });
    }
  }

  static async createRequest(req, res) {
    try {
      const { startDate, endDate, type, reason } = req.body;
      const employeeId = req.user.employee_id;

      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID not found in token' });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Укажите даты начала и окончания' });
      }

      const newRequest = await Leave.create(employeeId, { startDate, endDate, type, reason });
      res.status(201).json({ message: 'Заявка создана', request: newRequest });
    } catch (error) {
      console.error('Create request error:', error);
      res.status(500).json({ error: 'Ошибка при создании заявки: ' + error.message });
    }
  }

  static async getRequests(req, res) {
    try {
      const employeeId = req.user.employee_id;
      
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID not found in token' });
      }

      const requests = await Leave.getByEmployeeId(employeeId);
      res.json(requests);
    } catch (error) {
      console.error('Get requests error:', error);
      res.status(500).json({ error: 'Ошибка при получении списка: ' + error.message });
    }
  }
}

module.exports = LeaveController;