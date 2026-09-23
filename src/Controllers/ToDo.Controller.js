const ToDoService = require('../Services/Domain.Services/ToDo.service');

class ToDoController {
  constructor(message) {
    this.message = message;
    this.service = new ToDoService(message);
  }

  async handleRequest() {
    const action = this.message.Action;
    if (action === 'AddTask') return await this.service.addTask();
    if (action === 'CompleteTask') return await this.service.completeTask();
    if (action === 'GetAllTasks') return await this.service.getAllTasks();
    return { error: 'Invalid action' };
  }
}

module.exports = ToDoController;
