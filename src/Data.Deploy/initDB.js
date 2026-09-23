const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const settings = require('../settings.json').settings;
const { Tables } = require('../Constants/Tables').Tables;

class DBInitializer {
  static async init() {
    const dbPath = settings.dbPath;
    if (!fs.existsSync(dbPath)) {
      const db = new sqlite3.Database(dbPath);
      await run(db, `PRAGMA foreign_keys = ON`);

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.CONTRACTVERSION} (
        Id INTEGER,
        Version INTEGER NOT NULL,
        Description TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.SQLSCRIPTMIGRATIONS} (
        Id INTEGER,
        Sprint TEXT NOT NULL,
        ScriptName TEXT NOT NULL,
        ExecutedTimestamp TEXT,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      await run(db, `CREATE TABLE IF NOT EXISTS ${Tables.TODO} (
        Id INTEGER,
        Description TEXT NOT NULL,
        Status TEXT DEFAULT 'Pending',
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      db.close();
    }

    const scriptsDir = settings.dbScriptsFolderPath;
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
  }
}

function run(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve({ lastId: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { DBInitializer };
