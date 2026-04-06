const express = require('express');

module.exports = (pool, authenticateToken) => {
  const router = express.Router();

  // GET /api/shifts - получить смены
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT s.*, e.full_name FROM shifts s JOIN employees e ON s.employee_id = e.id ORDER BY s.start_time DESC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Ошибка получения смен:', error);
      res.status(500).json({ error: 'Ошибка получения смен' });
    }
  });

  // POST /api/shifts - начать смену
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { employee_id } = req.body;
      const result = await pool.query(
        'INSERT INTO shifts (employee_id, start_time, status) VALUES ($1, NOW(), \'open\') RETURNING *',
        [employee_id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка начала смены:', error);
      res.status(500).json({ error: 'Ошибка начала смены' });
    }
  });

  return router;
};