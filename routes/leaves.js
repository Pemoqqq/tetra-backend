const express = require('express');

module.exports = (pool, authenticateToken) => {
  const router = express.Router();

  // GET /api/leave - получить заявки на отпуск
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT l.*, e.full_name FROM leave_requests l JOIN employees e ON l.employee_id = e.id ORDER BY l.created_at DESC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Ошибка получения заявок на отпуск:', error);
      res.status(500).json({ error: 'Ошибка получения заявок' });
    }
  });

  return router;
};