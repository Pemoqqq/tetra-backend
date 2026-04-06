const pool = require('../config/database');
const Shift = require('./Shift'); // Нам нужно будет проверить активную смену

class Task {
  // Создание задачи
  static async create(employeeId, { title, description, priority }) {
    // Пытаемся найти активную смену сотрудника
    const activeShift = await Shift.findActiveShift(employeeId);
    const shiftId = activeShift ? activeShift.id : null;

    const result = await pool.query(
      `INSERT INTO tasks (employee_id, shift_id, title, description, priority) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employeeId, shiftId, title, description || '', priority]
    );
    return result.rows[0];
  }

  // Получить задачи сотрудника (с возможностью фильтрации по смене)
  static async getByEmployee(employeeId, shiftId = null) {
    let query = 'SELECT * FROM tasks WHERE employee_id = $1';
    let params = [employeeId];

    if (shiftId) {
      query += ' AND shift_id = $2';
      params.push(shiftId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Завершение задачи
  static async complete(taskId) {
    const result = await pool.query(
      `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [taskId]
    );
    return result.rows[0];
  }
}

module.exports = Task;