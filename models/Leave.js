const pool = require('../config/database');

class Leave {
  // Создание заявки
  static async create(employeeId, { startDate, endDate, type, reason }) {
    const result = await pool.query(
      `INSERT INTO leave_requests (employee_id, start_date, end_date, type, reason) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employeeId, startDate, endDate, type, reason]
    );
    return result.rows[0];
  }

  // Получение всех заявок сотрудника
  static async getByEmployeeId(employeeId) {
    const result = await pool.query(
      'SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY created_at DESC',
      [employeeId]
    );
    return result.rows;
  }

  // Расчет остатка отпускных дней
  // По ТК РФ 28 дней. Вычитаем только одобренные (approved) отпуска типа 'vacation'
    // Расчет остатка отпускных дней
  // По ТК РФ 28 дней. Вычитаем только одобренные (approved) отпуска типа 'vacation'
  static async getBalance(employeeId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(end_date - start_date + 1), 0) as used_days 
       FROM leave_requests 
       WHERE employee_id = $1 AND status = 'approved' AND type = 'vacation'`,
      [employeeId]
    );
    const usedDays = Number(result.rows[0].used_days);
    return { total: 28, used: usedDays, remaining: 28 - usedDays };
  }
}

module.exports = Leave;