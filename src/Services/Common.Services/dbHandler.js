const sqlite3 = require('sqlite3').verbose();

const DataTypes = {
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  NULL: 'NULL'
};

class SqliteDatabase {
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.openConnections = 0;
    this.db = null;
  }

  open() {
    if (this.openConnections <= 0) {
      this.db = new sqlite3.Database(this.dbFile);
      this.openConnections = 1;
    } else this.openConnections++;
  }

  close() {
    if (this.openConnections <= 1) {
      if (this.db) this.db.close();
      this.db = null;
      this.openConnections = 0;
    } else this.openConnections--;
  }

  runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params ? params : [], function (err) {
        if (err) return reject(err);
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }

  runSelectQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  insertValue(tableName, value) { return this.insertValues(tableName, [value]); }

  async insertValues(tableName, values) {
    if (!values.length) return { lastId: 0, changes: 0 };
    const columnNames = Object.keys(values[0]);
    let rowValueStr = '';
    let rowValues = [];
    for (const val of values) {
      rowValueStr += '(';
      for (const columnName of columnNames) {
        rowValueStr += '?,';
        rowValues.push(val[columnName] ?? null);
      }
      rowValueStr = rowValueStr.slice(0, -1) + '),';
    }
    rowValueStr = rowValueStr.slice(0, -1);
    const query = `INSERT INTO ${tableName}(${columnNames.join(', ')}) VALUES ${rowValueStr}`;
    return await this.runQuery(query, rowValues);
  }

  async updateValue(tableName, value, filter = null) {
    const cols = Object.keys(value);
    let valueStr = cols.map((c) => `${c} = ?`).join(', ');
    let params = cols.map((c) => value[c] ?? null);

    let filterStr = '1';
    if (filter) {
      const fcols = Object.keys(filter);
      filterStr = fcols.map((c) => `${c} = ?`).join(' AND ');
      params = params.concat(fcols.map((c) => filter[c] ?? null));
    }

    const query = `UPDATE ${tableName} SET ${valueStr} WHERE ${filterStr};`;
    return await this.runQuery(query, params);
  }

  async deleteValues(tableName, filter = null) {
    let filterStr = '1';
    let params = [];
    if (filter) {
      const fcols = Object.keys(filter);
      filterStr = fcols.map((c) => `${c} = ?`).join(' AND ');
      params = fcols.map((c) => filter[c] ?? null);
    }
    const query = `DELETE FROM ${tableName} WHERE ${filterStr};`;
    return await this.runQuery(query, params);
  }

  async findById(tableName, id) {
    const query = `SELECT * FROM ${tableName} WHERE Id = ?`;
    const rows = await this.runSelectQuery(query, [id]);
    return rows && rows[0];
  }

  async getLastRecord(tableName) {
    const query = `SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT 1`;
    const rows = await this.runSelectQuery(query, []);
    return rows && rows[0];
  }
}

module.exports = { SqliteDatabase, DataTypes };
