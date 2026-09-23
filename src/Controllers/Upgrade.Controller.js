const UpgradeService = require('../Services/Common.Services/Upgrade.Service');

class UpgradeController {
  constructor(message) {
    this.message = message;
    this.service = new UpgradeService(message);
  }

  async handleRequest() {
    try {
      if (this.message.Action === 'UpgradeContract') {
        return await this.service.upgradeContract();
      }
      return { error: 'Invalid upgrade action' };
    } catch (e) {
      return { error: e.message || String(e) };
    }
  }
}

module.exports = UpgradeController;
