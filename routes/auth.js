const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    try {
      const { login, password } = req.body;
      const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'tetra_secret_key_2025',
        { expiresIn: '24h' }
      );

      res.json({ success: true, token, user: { id: user.id, login: user.login, role: user.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Ошибка при входе в систему' });
    }
  });

  return router;
};