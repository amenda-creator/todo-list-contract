const { Tables } = require('../../Constants/Tables').Tables;
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const settings = require('../../settings.json').settings;

class ClusterManagementService {
  constructor(message) {
    this.message = message;
    this.db = new SqliteDatabase(settings.dbPath);
    this.context = null;
  }

  async updateClusterConfig() {
    if (!global.__hpctx) return { error: 'Cluster context not available.' };
    const ctx = global.__hpctx;
    const hpConfig = await ctx.getConfig();
    let unl = hpConfig.unl || [];

    if (this.message.data && this.message.data.action === 'add') {
      if (!unl.includes(this.message.data.publicKey)) unl.push(this.message.data.publicKey);
      else return { error: 'UNL already exists.' };
    } else if (this.message.data && this.message.data.action === 'remove') {
      if (unl.includes(this.message.data.publicKey)) {
        unl = unl.filter(k => k !== this.message.data.publicKey);
        hpConfig.unl = unl;
      } else return { error: 'UNL does not exist.' };
    } else return { error: "Invalid action. Use 'add' or 'remove'." };

    const result = await ctx.updateConfig(hpConfig);
    return { success: result };
  }

  async getClusterUnl() {
    if (!global.__hpctx) return { error: 'Cluster context not available.' };
    const hpConfig = await global.__hpctx.getConfig();
    return { success: { unl: hpConfig.unl } };
  }

  async getContractVersion() {
    try {
      this.db.open();
      const rows = await this.db.runSelectQuery(`SELECT Version FROM ${Tables.CONTRACTVERSION} ORDER BY Id DESC LIMIT 1`);
      if (rows && rows.length > 0) return { success: { version: rows[0].Version } };
      return { success: { version: 1 } };
    } catch (e) {
      return { error: e.message || String(e) };
    } finally { this.db.close(); }
  }

  async updateClusterDetails() {
    return { error: 'Not implemented in this sample.' };
  }
}

module.exports = ClusterManagementService;
