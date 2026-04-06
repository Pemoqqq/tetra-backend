const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByLogin(login) {
    const result = await pool.query(
      'SELECT * FROM users WHERE login = $1',
      [login]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT u.*, e.full_name, e.tab_number, e.department_id, d.name as department_name ' +
      'FROM users u ' +
      'LEFT JOIN employees e ON u.employee_id = e.id ' +
      'LEFT JOIN departments d ON e.department_id = d.id ' +
      'WHERE u.id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create(login, password, role, employeeId = null) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (login, password_hash, role, employee_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [login, hashedPassword, role, employeeId]
    );
    return result.rows[0];
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;