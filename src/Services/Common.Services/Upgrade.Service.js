const { SqliteDatabase } = require('./dbHandler');
const { Tables } = require('../../Constants/Tables').Tables;
const settings = require('../../settings.json').settings;
const fs = require('fs');

class UpgradeService {
  constructor(message) {
    this.message = message;
    this.db = new SqliteDatabase(settings.dbPath);
  }

  async upgradeContract() {
    const payload = this.message.data || {};
    try {
      this.db.open();
      const last = await this.db.runSelectQuery(`SELECT Version FROM ${Tables.CONTRACTVERSION} ORDER BY Id DESC LIMIT 1`);
      const currentVersion = (last && last[0] && parseInt(last[0].Version)) || 1;
      const incomingVersion = parseInt(payload.version);
      if (!incomingVersion || incomingVersion <= currentVersion) {
        return { error: 'Invalid version. Must be greater than current.' };
      }

      if (payload.content) {
        fs.writeFileSync(settings.newContractZipFileName, Buffer.from(payload.content));
        const sh = `#!/bin/bash\n! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\nzip_file=\"${settings.newContractZipFileName}\"\nunzip -o -d ./ \"$zip_file\" >>/dev/null\nrm \"$zip_file\" >>/dev/null\n`;
        fs.writeFileSync(settings.postExecutionScriptName, sh);
        fs.chmodSync(settings.postExecutionScriptName, 0o777);
      }

      await this.db.insertValue(Tables.CONTRACTVERSION, {
        Version: incomingVersion,
        Description: payload.description || '',
        CreatedOn: new Date().toISOString(),
        LastUpdatedOn: new Date().toISOString()
      });

      return { success: { version: incomingVersion } };
    } catch (e) {
      return { error: e.message || String(e) };
    } finally { this.db.close(); }
  }
}

module.exports = UpgradeService;
