require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

// 1. Импорт всех маршрутов (роутов)
const authRoutes = require('./routes/auth');    // Авторизация
const shiftRoutes = require('./routes/shifts'); // Учет рабочего времени
const leaveRoutes = require('./routes/leaves'); // Отпуска и отгулы
const taskRoutes = require('./routes/tasks');   // Задачи
const scheduleRoutes = require('./routes/schedule');


const app = express();

// 2. Настройка Middleware (промежуточного ПО)
app.use('/api/schedule', scheduleRoutes);
app.use(cors()); // Разрешаем запросы с мобильного устройства
app.use(express.json()); // Позволяет читать JSON из запросов
app.use(express.urlencoded({ extended: true }));

// 3. Базовые маршруты для проверки
app.get('/', (req, res) => {
  res.json({ 
    message: 'Сервер ООО "Тетра" работает',
    version: '1.2.0 (Full Stack)',
    timestamp: new Date().toISOString()
  });
});

// Проверка здоровья сервера и базы данных
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

// 4. Подключение маршрутов API
// Все запросы, начинающиеся с этих путей, пойдут в соответствующие файлы
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tasks', taskRoutes);

// 5. Обработка ошибок (если маршрут не найден)
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден. Проверьте URL запроса.' });
});

// Глобальная обработка ошибок сервера
app.use((err, req, res, next) => {
  console.error('🔥 Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// 6. Запуск сервера
// '0.0.0.0' означает, что сервер слушает все сетевые интерфейсы (доступен по Wi-Fi)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер успешно запущен на порту ${PORT}`);
  console.log(`🌐 Доступен в локальной сети. Проверь свой IP командой ipconfig`);
});


// Функция для создания таблиц
const createTables = async () => {
  try {
    const client = await pool.connect();
    
    // Таблица отделов
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);
    console.log('✅ Таблица departments создана');

    // Таблица сотрудников
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        tab_number VARCHAR(50) UNIQUE NOT NULL,
        department_id INT REFERENCES departments(id),
        position VARCHAR(100)
      )
    `);
    console.log('✅ Таблица employees создана');

    // Таблица пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        employee_id INT REFERENCES employees(id)
      )
    `);
    console.log('✅ Таблица users создана');

    // Таблица смен
    await client.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employees(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'open',
        break_duration INT DEFAULT 0
      )
    `);
    console.log('✅ Таблица shifts создана');

    // Создаем тестового админа
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO departments (name, description) 
      VALUES ('IT отдел', 'Разработка')
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO employees (full_name, tab_number, department_id, position) 
      VALUES ('Администратор', '0001', 1, 'Админ')
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO users (login, password_hash, role, employee_id) 
      VALUES ('admin', $1, 'admin', 1)
      ON CONFLICT (login) DO NOTHING
    `, [hashedPassword]);
    
    console.log('✅ Тестовые данные созданы');
    client.release();
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  }
};

// Вызываем функцию перед запуском сервера
createTables();

module.exports = app;