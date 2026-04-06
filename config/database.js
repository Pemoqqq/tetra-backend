// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Поддержка как DATABASE_URL (Railway), так и отдельных переменных (локально)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // Резервные значения для локальной разработки
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tetra_time_tracking',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

pool.on('connect', () => {
  console.log('✅ Подключение к базе данных установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к базе данных:', err);
  // Не завершаем процесс при ошибке, просто логируем
});

// Проверка подключения при старте
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка проверки подключения:', err);
  } else {
    console.log('🕐 Время сервера БД:', res.rows[0].now);
  }
});

module.exports = pool;ч