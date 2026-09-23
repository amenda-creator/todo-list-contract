const { Tables } = require('../../Constants/Tables').Tables;
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const settings = require('../../settings.json').settings;

/**
 * ToDoService
 * -----------
 * Domain/service layer for the contract's **ToDo** functionality.
 *
 * This class encapsulates all database (SQLite) operations for tasks and returns
 * standardized response objects that the controller can send back to users.
 *
 * Call chain (high-level):
 *   startup.js -> Utils/controller.js -> Controllers/ToDo.Controller.js -> this service
 *
 * DB:
 *   Uses `SqliteDatabase` (Common.Services/dbHandler) to talk to the SQLite DB file
 *   configured in `settings.json` (`settings.dbPath`, default: todo.db).
 *
 * Return shapes:
 *   - Success: { success: <payload> }
 *   - Error:   { error: <string> }
 */
class ToDoService {
  /**
   * @param {object} message
   * The incoming request message (parsed in startup.js). Expected shape:
   * {
   *   Service: 'ToDo',
   *   Action: 'AddTask' | 'CompleteTask' | 'GetAllTasks',
   *   data: { ... } // action-specific payload
   * }
   *
   * Side effects:
   * - Stores the request message on `this.message`.
   * - Creates a DB helper instance pointing to the configured sqlite database.
   */
  constructor(message) {
    this.message = message;

    // DB client wrapper used across methods.
    // Note: Each method explicitly opens/closes the connection per request.
    this.db = new SqliteDatabase(settings.dbPath);
  }

  /**
   * addTask()
   * ---------
   * Creates a new ToDo task in the database.
   *
   * Inputs (from message.data):
   *   - description: string (optional)
   *
   * DB operations:
   *   - INSERT into Tables.TODO with fields:
   *     - Description: provided description (or empty string)
   *     - Status: 'Pending'
   *     - CreatedOn: current ISO timestamp
   *     - LastUpdatedOn: current ISO timestamp
   *
   * Return shape:
   *   - On success: { success: { id: <insertedRowId> } }
   *   - On error:   { error: <errorMessage> }
   */
  async addTask() {
    try {
      // Open the SQLite connection for this request.
      this.db.open();

      // Pull description from payload; fallback to empty string to satisfy NOT NULL.
      const desc = (this.message.data && this.message.data.description) || '';

      // Insert the row into the ToDo table.
      const res = await this.db.insertValue(Tables.TODO, {
        Description: desc,
        Status: 'Pending',
        CreatedOn: new Date().toISOString(),
        LastUpdatedOn: new Date().toISOString()
      });

      // The DB helper is expected to return `{ lastId, changes }` for inserts.
      return { success: { id: res.lastId } };
    } catch (e) {
      // Standardize error output as a string.
      return { error: e.message || String(e) };
    } finally {
      // Always close DB connection even if an exception occurs.
      this.db.close();
    }
  }

  /**
   * completeTask()
   * --------------
   * Marks an existing task as completed.
   *
   * Inputs (from message.data):
   *   - id: number (required)
   *
   * DB operations:
   *   - UPDATE Tables.TODO SET:
   *     - Status = 'Completed'
   *     - LastUpdatedOn = current ISO timestamp
   *     WHERE Id = <id>
   *
   * Return shape:
   *   - On success: { success: { changes: <numberOfRowsUpdated> } }
   *     (If the Id does not exist, `changes` is typically 0.)
   *   - On error:   { error: <errorMessage> }
   */
  async completeTask() {
    try {
      // Open the SQLite connection for this request.
      this.db.open();

      // Pull id from payload; fallback 0 means "no match" in typical DB state.
      const id = (this.message.data && this.message.data.id) || 0;

      // Update the matching ToDo row.
      const res = await this.db.updateValue(
        Tables.TODO,
        { Status: 'Completed', LastUpdatedOn: new Date().toISOString() },
        { Id: id }
      );

      // `changes` indicates number of rows updated.
      return { success: { changes: res.changes } };
    } catch (e) {
      // Standardize error output as a string.
      return { error: e.message || String(e) };
    } finally {
      // Always close DB connection even if an exception occurs.
      this.db.close();
    }
  }

  /**
   * getAllTasks()
   * ------------
   * Reads and returns all tasks in the ToDo table.
   *
   * Inputs:
   *   - None (ignores message.data)
   *
   * DB operations:
   *   - SELECT Id, Description, Status, CreatedOn, LastUpdatedOn FROM Tables.TODO
   *
   * Return shape:
   *   - On success: { success: [ { id, description, status, createdOn, lastUpdatedOn }, ... ] }
   *   - On error:   { error: <errorMessage> }
   */
  async getAllTasks() {
    try {
      // Open the SQLite connection for this request.
      this.db.open();

      // Fetch rows from the ToDo table.
      const rows = await this.db.runSelectQuery(
        `SELECT Id, Description, Status, CreatedOn, LastUpdatedOn FROM ${Tables.TODO}`
      );

      // Normalize DB column naming (PascalCase) into API response naming (camelCase).
      const tasks = rows.map(r => ({
        id: r.Id,
        description: r.Description,
        status: r.Status,
        createdOn: r.CreatedOn,
        lastUpdatedOn: r.LastUpdatedOn
      }));

      return { success: tasks };
    } catch (e) {
      // Standardize error output as a string.
      return { error: e.message || String(e) };
    } finally {
      // Always close DB connection even if an exception occurs.
      this.db.close();
    }
  }
}

module.exports = ToDoService;
