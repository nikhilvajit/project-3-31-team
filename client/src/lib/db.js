/**
 * @fileoverview Database connection management using PostgreSQL
 * @author Dhiraj Atmakuri
 */

const { Pool } = require('pg');

/**
 * Singleton class for managing PostgreSQL database connections
 * @class Database
 * @description
 * Implements the Singleton pattern to ensure a single database connection pool
 * throughout the application. Uses environment variables for configuration:
 * - PG_USER: PostgreSQL username
 * - PG_HOST: Database host address
 * - PG_DATABASE: Database name
 * - PG_PASSWORD: Database password
 * - PG_PORT: Database port number
 */

class Database {
  /**
   * Creates or returns the singleton Database instance
   * @constructor
   * @returns {Database} The singleton Database instance
   */
  constructor() {
    if (!Database.instance) {
      this.pool = new Pool({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT,
      });
      Database.instance = this;
    }
    return Database.instance;
  }

  /**
   * Returns the PostgreSQL connection pool
   * @returns {Pool} PostgreSQL connection pool instance
   */
  getConnection() {
    return this.pool;
  }
}

const dbInstance = new Database();
Object.freeze(dbInstance); // Ensures singleton

module.exports = dbInstance;