const express = require('express');

module.exports = (pool, authenticateToken) => {
  const router = express.Router();

  // GET /api/tasks - получить задачи
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT t.*, e.full_name FROM tasks t JOIN employees e ON t.employee_id = e.id ORDER BY t.created_at DESC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Ошибка получения задач:', error);
      res.status(500).json({ error: 'Ошибка получения задач' });
    }
  });

  return router;
};