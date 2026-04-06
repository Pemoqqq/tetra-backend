const pool = require('../config/database');
const Shift = require('./Shift'); // Для проверки конфликтов с фактическими сменами

class Schedule {
  // 1. Проверка на конфликты (план vs факт)
  static async checkConflict(employeeId, date) {
    // Проверяем плановые смены
    const scheduleCheck = await pool.query(
      'SELECT id FROM schedules WHERE employee_id = $1 AND schedule_date = $2',
      [employeeId, date]
    );
    if (scheduleCheck.rows.length > 0) return { conflict: true, type: 'schedule', id: scheduleCheck.rows[0].id };

    // Проверяем фактические смены
    const shiftCheck = await pool.query(
      'SELECT id FROM shifts WHERE employee_id = $1 AND shift_date = $2',
      [employeeId, date]
    );
    if (shiftCheck.rows.length > 0) return { conflict: true, type: 'shift', id: shiftCheck.rows[0].id };

    return { conflict: false };
  }

  // 2. Назначение смены с защитой от дублей
  static async assign(employeeId, date, shiftType) {
    const conflictCheck = await this.checkConflict(employeeId, date);
    if (conflictCheck.conflict) {
      throw new Error(`Конфликт: Сотрудник уже занят в этот день (ID записи: ${conflictCheck.id})`);
    }

    const result = await pool.query(
      `INSERT INTO schedules (employee_id, schedule_date, shift_type) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (employee_id, schedule_date) DO UPDATE SET shift_type = $3
       RETURNING *`,
      [employeeId, date, shiftType]
    );
    return result.rows[0];
  }

  // 3. Список всех сотрудников (для выпадающего списка админа)
  static async getAllEmployees() {
    const result = await pool.query(
      'SELECT id, full_name, position FROM employees ORDER BY full_name ASC'
    );
    return result.rows;
  }

  // 4.  МЕТОД, КОТОРЫЙ ВЫЗЫВАЛ ОШИБКУ (Админ-панель)
  static async getAdminSchedule(year, month) {
    const result = await pool.query(
      `SELECT s.*, e.full_name 
       FROM schedules s
       JOIN employees e ON s.employee_id = e.id
       WHERE EXTRACT(YEAR FROM s.schedule_date) = $1 
       AND EXTRACT(MONTH FROM s.schedule_date) = $2
       ORDER BY s.schedule_date ASC`,
      [year, month]
    );
    return result.rows;
  }

  // 5. Личное расписание сотрудника
  static async getByEmployeeMonth(employeeId, year, month) {
    const result = await pool.query(
      `SELECT * FROM schedules 
       WHERE employee_id = $1 
       AND EXTRACT(YEAR FROM schedule_date) = $2 
       AND EXTRACT(MONTH FROM schedule_date) = $3
       ORDER BY schedule_date ASC`,
      [employeeId, year, month]
    );
    return result.rows;
  }
}


module.exports = Schedule;