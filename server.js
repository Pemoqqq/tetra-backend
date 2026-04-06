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

module.exports = app;