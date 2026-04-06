const Schedule = require('../models/Schedule');
const ShiftSwap = require('../models/ShiftSwap');

class ScheduleController {
  // Получить расписание для конкретного сотрудника (Личный кабинет)
  static async getMySchedule(req, res) {
    try {
      const { year, month } = req.params;
      const employeeId = req.user.employee_id; // Берем ID из токена
      const schedule = await Schedule.getByEmployeeMonth(employeeId, year, month);
      res.json(schedule);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка загрузки личного расписания' });
    }
  }

  // Получить расписание для Администратора (Все сотрудники)
  static async getAdminSchedule(req, res) {
    try {
      const { year, month } = req.params;
      const schedule = await Schedule.getAdminSchedule(year, month);
      res.json(schedule);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка загрузки админ-панели расписания' });
    }
  }

  // Назначение смены (С проверкой конфликтов)
  static async assignShift(req, res) {
    try {
      const { employee_id, date, shift_type } = req.body;
      
      if (!employee_id || !date || !shift_type) {
        return res.status(400).json({ error: 'Заполните все поля (ID, дата, тип)' });
      }

      // Вызываем метод модели, который проверяет конфликты
      const result = await Schedule.assign(employee_id, date, shift_type);
      
      res.status(201).json({ message: 'Смена успешно назначена', schedule: result });
    } catch (error) {
      // Обработка ошибки конфликта (409 Conflict)
      if (error.message.includes('Конфликт')) {
        return res.status(409).json({ error: error.message });
      }
      console.error(error);
      res.status(500).json({ error: 'Ошибка при назначении смены' });
    }
  }

  // Получить список всех сотрудников (для выпадающего списка)
  static async getEmployees(req, res) {
    try {
      const employees = await Schedule.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка загрузки списка сотрудников' });
    }
  }

  // Запрос на обмен сменами
  static async requestSwap(req, res) {
    try {
      const { target_id, original_date, target_date } = req.body;
      const requesterId = req.user.employee_id;

      if (!target_id || !original_date || !target_date) {
        return res.status(400).json({ error: 'Не все поля заполнены' });
      }

      const swap = await ShiftSwap.create(requesterId, target_id, original_date, target_date);
      res.status(201).json({ message: 'Заявка на обмен отправлена', swap });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка при создании заявки' });
    }
  }

  // Получить статус моих заявок на обмен
  static async getMySwaps(req, res) {
    try {
      const requesterId = req.user.employee_id;
      const swaps = await ShiftSwap.getByRequester(requesterId);
      res.json(swaps);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка загрузки заявок' });
    }
  }
}

module.exports = ScheduleController;