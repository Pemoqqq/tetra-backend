const pool = require('../config/database');

class ShiftSwap {
  static async create(requesterId, targetId, originalDate, targetDate) {
    const result = await pool.query(
      `INSERT INTO shift_swaps (requester_id, target_id, original_date, target_date) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [requesterId, targetId, originalDate, targetDate]
    );
    return result.rows[0];
  }

  static async getByRequester(requesterId) {
    const result = await pool.query(
      `SELECT ss.*, e1.full_name as requester_name, e2.full_name as target_name 
       FROM shift_swaps ss
       JOIN employees e1 ON ss.requester_id = e1.id
       JOIN employees e2 ON ss.target_id = e2.id
       WHERE ss.requester_id = $1
       ORDER BY ss.created_at DESC`,
      [requesterId]
    );
    return result.rows;
  }
}

module.exports = ShiftSwap;