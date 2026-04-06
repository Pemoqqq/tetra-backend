const Task = require('../models/Task');

class TaskController {
  static async createTask(req, res) {
    try {
      const { title, description, priority } = req.body;
      const employeeId = req.user.employee_id;

      if (!title) {
        return res.status(400).json({ error: 'Введите название задачи' });
      }

      const newTask = await Task.create(employeeId, { title, description, priority });
      res.status(201).json({ message: 'Задача создана', task: newTask });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка при создании задачи' });
    }
  }

  static async getTasks(req, res) {
    try {
      const employeeId = req.user.employee_id;
      const { shift_id } = req.query; // Можно получить задачи только текущей смены
      
      const tasks = await Task.getByEmployee(employeeId, shift_id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка загрузки задач' });
    }
  }

  static async completeTask(req, res) {
    try {
      const { id } = req.body;
      const updatedTask = await Task.complete(id);
      if (!updatedTask) return res.status(404).json({ error: 'Задача не найдена' });
      
      res.json({ message: 'Задача выполнена', task: updatedTask });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка при обновлении задачи' });
    }
  }
}

module.exports = TaskController;