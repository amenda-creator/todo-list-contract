const { ServiceTypes } = require('../constants');
const ClusterManagementController = require('../Controllers/ClusterManagement.Controller');
const UpgradeController = require('../Controllers/Upgrade.Controller');
const ToDoController = require('../Controllers/ToDo.Controller');

class Controller {
  async handleRequest(user, message, isReadOnly) {
    let result = {};

    if (message.Service === ServiceTypes.UPGRADE) {
      const ctrl = new UpgradeController(message);
      result = await ctrl.handleRequest();
    } else if (message.Service === ServiceTypes.CLUSTER) {
      const ctrl = new ClusterManagementController(message);
      result = await ctrl.handleRequest();
    } else if (message.Service === ServiceTypes.TODO) {
      const ctrl = new ToDoController(message);
      result = await ctrl.handleRequest();
    } else {
      result = { error: 'Invalid Service' };
    }

    if (isReadOnly) await user.send(result);
    else await user.send(message.promiseId ? { promiseId: message.promiseId, ...result } : result);
  }
}

module.exports = Controller;
