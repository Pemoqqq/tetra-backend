const User = require('../models/User');
const jwt = require('jsonwebtoken');
const pool = require('../config/database'); 

class AuthController {
  static async register(req, res) {
    try {
      const { login, password, role, full_name, tab_number, department_id } = req.body;

      // Проверка существования пользователя
      const existingUser = await User.findByLogin(login);
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
      }

      // Создание сотрудника (если предоставлены данные)
      let employeeId = null;
      if (full_name && tab_number) {
        const employeeResult = await pool.query(
          'INSERT INTO employees (full_name, tab_number, department_id) VALUES ($1, $2, $3) RETURNING id',
          [full_name, tab_number, department_id || null]
        );
        employeeId = employeeResult.rows[0].id;
      }

      // Создание пользователя
      const user = await User.create(login, password, role, employeeId);

      // Генерация токена
      const token = jwt.sign(
        { id: user.id, login: user.login, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        user: {
          id: user.id,
          login: user.login,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
  }

    static async login(req, res) {
    try {
      const { login, password } = req.body;

      // Поиск пользователя
      const user = await User.findByLogin(login);
      if (!user) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      // Проверка пароля
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      // Получение полной информации о пользователе
      const userInfo = await User.findById(user.id);

      // Генерация токена
      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      const token = jwt.sign(
        { 
          id: user.id, 
          login: user.login, 
          role: user.role,
          employee_id: user.employee_id // <--- ДОБАВЬТЕ ЭТУ СТРОКУ
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // -------------------------

      res.json({
        message: 'Успешный вход',
        user: {
          id: userInfo.id,
          login: userInfo.login,
          role: userInfo.role,
          full_name: userInfo.full_name,
          tab_number: userInfo.tab_number,
          department_id: userInfo.department_id,
          department_name: userInfo.department_name
        },
        token
      });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Ошибка при входе в систему' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({
        user: {
          id: user.id,
          login: user.login,
          role: user.role,
          full_name: user.full_name,
          tab_number: user.tab_number,
          department_id: user.department_id,
          department_name: user.department_name
        }
      });
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({ error: 'Ошибка при получении профиля' });
    }
  }
}

module.exports = AuthController;