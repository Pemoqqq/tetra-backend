const Leave = require('../models/Leave');

class LeaveController {
  static async getBalance(req, res) {
    try {
      const employeeId = req.user.employee_id;
      const balance = await Leave.getBalance(employeeId);
      res.json(balance);
    } catch (error) {
      console.error('Ошибка получения баланса:', error);
      res.status(500).json({ error: 'Ошибка при получении баланса' });
    }
  }

  static async createRequest(req, res) {
    try {
      const { startDate, endDate, type, reason } = req.body;
      const employeeId = req.user.employee_id;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Укажите даты начала и окончания' });
      }

      const newRequest = await Leave.create(employeeId, { startDate, endDate, type, reason });
      res.status(201).json({ message: 'Заявка создана', request: newRequest });
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      res.status(500).json({ error: 'Ошибка при создании заявки' });
    }
  }

  static async getRequests(req, res) {
    try {
      const employeeId = req.user.employee_id;
      const requests = await Leave.getByEmployeeId(employeeId);
      res.json(requests);
    } catch (error) {
      console.error('Ошибка получения заявок:', error);
      res.status(500).json({ error: 'Ошибка при получении списка' });
    }
  }
}

module.exports = LeaveController;