const pool = require('../config/database');

class Shift {
  static async create(employeeId, shiftDate, startTime) {
    const result = await pool.query(
      `INSERT INTO shifts (employee_id, shift_date, start_time, status, sync_status) 
       VALUES ($1, $2, $3, 'active', 'synced') 
       RETURNING *`,
      [employeeId, shiftDate, startTime]
    );
    return result.rows[0];
  }

  static async updateEndTime(shiftId, endTime) {
    const result = await pool.query(
      `UPDATE shifts 
       SET end_time = $2, status = 'completed' 
       WHERE id = $1 
       RETURNING *`,
      [shiftId, endTime]
    );
    return result.rows[0];
  }

  static async findByEmployeeId(employeeId) {
    const result = await pool.query(
      'SELECT * FROM shifts WHERE employee_id = $1 ORDER BY shift_date DESC, start_time DESC',
      [employeeId]
    );
    return result.rows;
  }

  static async findActiveShift(employeeId) {
  const result = await pool.query(
    'SELECT * FROM shifts WHERE employee_id = $1 AND status = \'active\' ORDER BY start_time DESC LIMIT 1',
    [employeeId]
  );
  return result.rows[0];
}

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM shifts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByDepartment(departmentId, startDate, endDate) {
    const result = await pool.query(
      `SELECT s.*, e.full_name, e.tab_number 
       FROM shifts s 
       JOIN employees e ON s.employee_id = e.id 
       WHERE e.department_id = $1 
       AND s.shift_date BETWEEN $2 AND $3 
       ORDER BY s.shift_date DESC, s.start_time DESC`,
      [departmentId, startDate, endDate]
    );
    return result.rows;
  }
}

module.exports = Shift;