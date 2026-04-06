const Shift = require('../models/Shift');
const pool = require('../config/database');

class ShiftController {
  static async startShift(req, res) {
  try {
    // Получаем employee_id из токена авторизации
    const employeeId = req.user.employee_id;
    
    if (!employeeId) {
      return res.status(400).json({ 
        error: 'Не найден ID сотрудника в токене авторизации' 
      });
    }
    
    const shiftDate = new Date().toISOString().split('T')[0];
    const startTime = new Date();

    // Проверка активной смены
    const activeShift = await Shift.findActiveShift(employeeId);
    if (activeShift) {
      return res.status(400).json({ 
        error: 'У вас уже есть активная смена. Завершите её перед началом новой.' 
      });
    }

    // Создание новой смены
    const shift = await Shift.create(employeeId, shiftDate, startTime);

    res.status(201).json({
      message: 'Смена успешно начата',
      shift
    });
  } catch (error) {
    console.error('Ошибка начала смены:', error);
    res.status(500).json({ error: 'Ошибка при начале смены' });
  }
}

    static async endShift(req, res) {
    try {
      const { shift_id } = req.body;
      
      if (!shift_id) {
        return res.status(400).json({ error: 'Не указан ID смены' });
      }

      const endTime = new Date();

      // Обновляем запись в базе данных: ставим время конца и статус 'completed'
      const result = await pool.query(
        `UPDATE shifts 
         SET end_time = $1, status = 'completed', sync_status = 'synced' 
         WHERE id = $2 
         RETURNING *`,
        [endTime, shift_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Смена не найдена' });
      }

      res.json({
        message: 'Смена успешно завершена',
        shift: result.rows[0]
      });
    } catch (error) {
      console.error('Ошибка завершения смены:', error);
      res.status(500).json({ error: 'Ошибка при завершении смены' });
    }
  }

  static async getMyShifts(req, res) {
    try {
      const employeeId = req.query.employee_id || req.user.employee_id;
      
      if (!employeeId) {
        return res.status(400).json({ error: 'Не указан ID сотрудника' });
      }

      const shifts = await Shift.findByEmployeeId(employeeId);

      res.json({
        shifts,
        count: shifts.length
      });
    } catch (error) {
      console.error('Ошибка получения смен:', error);
      res.status(500).json({ error: 'Ошибка при получении смен' });
    }
  }

  static async getActiveShift(req, res) {
    try {
      const employeeId = req.query.employee_id || req.user.employee_id;
      
      if (!employeeId) {
        return res.status(400).json({ error: 'Не указан ID сотрудника' });
      }

      const shift = await Shift.findActiveShift(employeeId);

      if (!shift) {
        return res.json({
          message: 'Активная смена не найдена',
          shift: null
        });
      }

      res.json({ shift });
    } catch (error) {
      console.error('Ошибка получения активной смены:', error);
      res.status(500).json({ error: 'Ошибка при получении активной смены' });
    }
  }

  static async getDepartmentShifts(req, res) {
    try {
      const { department_id, start_date, end_date } = req.query;

      if (!department_id || !start_date || !end_date) {
        return res.status(400).json({ 
          error: 'Необходимы параметры: department_id, start_date, end_date' 
        });
      }

      const shifts = await Shift.findByDepartment(department_id, start_date, end_date);

      res.json({
        shifts,
        count: shifts.length
      });
    } catch (error) {
      console.error('Ошибка получения смен подразделения:', error);
      res.status(500).json({ error: 'Ошибка при получении смен подразделения' });
    }
  }
}

module.exports = ShiftController;