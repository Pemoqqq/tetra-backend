const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Проверка подключения к БД
pool.on('connect', () => {
  console.log('✅ Подключение к базе данных установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к базе данных:', err);
});

// Функция создания таблиц
const createTables = async () => {
  try {
    const client = await pool.connect();
    
    console.log('🔄 Создание таблиц базы данных...');

    // Таблица отделов
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица departments создана');

    // Таблица сотрудников
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        tab_number VARCHAR(50) UNIQUE NOT NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        position VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        hire_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица employees создана');

    // Таблица пользователей (для входа в систему)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица users создана');

    // Таблица смен
    await client.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'open',
        break_duration INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица shifts создана');

    // Таблица перерывов
    await client.query(`
      CREATE TABLE IF NOT EXISTS breaks (
        id SERIAL PRIMARY KEY,
        shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER DEFAULT 0,
        break_type VARCHAR(50) DEFAULT 'lunch',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица breaks создана');

    // Таблица задач
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        due_date TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица tasks создана');

    // Таблица заявок на отпуск
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type VARCHAR(50) DEFAULT 'vacation',
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица leave_requests создана');

    // Таблица расписания
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица schedules создана');

    // Создаем тестовые данные (если таблицы пустые)
    const deptCheck = await client.query('SELECT COUNT(*) FROM departments');
    if (parseInt(deptCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO departments (name, description) VALUES
        ('IT отдел', 'Разработка и поддержка информационных систем'),
        ('Бухгалтерия', 'Финансовый учет и отчетность'),
        ('Отдел кадров', 'Управление персоналом'),
        ('Отдел продаж', 'Продажи и работа с клиентами')
      `);
      console.log('✅ Созданы тестовые отделы');
    }

    // Создаем администратора если нет пользователей
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Создаем сотрудника-администратора
      const empResult = await client.query(`
        INSERT INTO employees (full_name, tab_number, department_id, position, email)
        VALUES ('Администратор Системы', '0001', 1, 'Системный администратор', 'admin@tetra.ru')
        ON CONFLICT (tab_number) DO NOTHING
        RETURNING id
      `);

      const employeeId = empResult.rows[0]?.id || 1;

      // Создаем пользователя admin
      await client.query(`
        INSERT INTO users (login, password_hash, role, employee_id)
        VALUES ('admin', $1, 'admin', $2)
        ON CONFLICT (login) DO NOTHING
      `, [hashedPassword, employeeId]);
      
      console.log('✅ Создан пользователь admin (пароль: admin123)');
    }

    client.release();
    console.log('✅ Все таблицы успешно созданы и проверены');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    throw error;
  }
};

// Middleware для проверки токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tetra_secret_key_2025_change_in_production');
    
    const result = await pool.query(
      'SELECT u.*, e.full_name, e.tab_number FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Пользователь не найден' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(403).json({ error: 'Неверный токен' });
  }
};

// ==================== ROUTES ====================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Импортируем и подключаем маршруты ПРАВИЛЬНО
try {
  // Проверяем, что модули существуют и экспортируют функции
  const authModule = require('./routes/auth');
  if (typeof authModule === 'function') {
    app.use('/api/auth', authModule(pool));
    console.log('✅ Маршруты /api/auth подключены');
  } else {
    console.warn('⚠️  Маршруты auth не экспортируют функцию');
  }
} catch (error) {
  console.warn('⚠️  Маршруты auth не найдены или ошибочны:', error.message);
}

try {
  const employeeModule = require('./routes/employees');
  if (typeof employeeModule === 'function') {
    app.use('/api/employees', employeeModule(pool, authenticateToken));
    console.log('✅ Маршруты /api/employees подключены');
  } else {
    console.warn('⚠️  Маршруты employees не экспортируют функцию');
  }
} catch (error) {
  console.warn('⚠️  Маршруты employees не найдены или ошибочны:', error.message);
}

try {
  const shiftModule = require('./routes/shifts');
  if (typeof shiftModule === 'function') {
    app.use('/api/shifts', shiftModule(pool, authenticateToken));
    console.log('✅ Маршруты /api/shifts подключены');
  } else {
    console.warn('⚠️  Маршруты shifts не экспортируют функцию');
  }
} catch (error) {
  console.warn('⚠️  Маршруты shifts не найдены или ошибочны:', error.message);
}

try {
  const taskModule = require('./routes/tasks');
  if (typeof taskModule === 'function') {
    app.use('/api/tasks', taskModule(pool, authenticateToken));
    console.log('✅ Маршруты /api/tasks подключены');
  } else {
    console.warn('⚠️  Маршруты tasks не экспортируют функцию');
  }
} catch (error) {
  console.warn('⚠️  Маршруты tasks не найдены или ошибочны:', error.message);
}

try {
  const leaveModule = require('./routes/leave');
  if (typeof leaveModule === 'function') {
    app.use('/api/leave', leaveModule(pool, authenticateToken));
    console.log('✅ Маршруты /api/leave подключены');
  } else {
    console.warn('⚠️  Маршруты leave не экспортируют функцию');
  }
} catch (error) {
  console.warn('⚠️  Маршруты leave не найдены или ошибочны:', error.message);
}

try {
  const scheduleModule = require('./routes/schedules');
  if (typeof scheduleModule === 'function') {
    app.use('/api/schedules', scheduleModule(pool, authenticateToken));
    console.log('✅ Маршруты /api/schedules подключены');
  } else {
    console.warn('⚠️  Маршруты schedules не экспортируют функцию');
  }
} catch (error) {
  console.warn('⚠️  Маршруты schedules не найдены или ошибочны:', error.message);
}

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Маршрут не найден. Проверьте URL запроса.' 
  });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Создаем таблицы
    await createTables();
    
    // Запускаем сервер
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Сервер успешно запущен на порту ${PORT}`);
      console.log(`🌍 Доступен в локальной сети. Проверь свой IP командой ipconfig`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, pool };