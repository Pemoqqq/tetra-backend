const express = require('express');

module.exports = (pool, authenticateToken) => {
  const router = express.Router();

  // GET /api/employees - получить всех сотрудников
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT e.*, d.name as department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id ORDER BY e.full_name'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Ошибка получения сотрудников:', error);
      res.status(500).json({ error: 'Ошибка получения сотрудников' });
    }
  });

  return router;
};