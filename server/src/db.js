/**
 * db.js — Postgres connection pool using pg.
 * Reads DATABASE_URL from environment variables.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  /**
   * Execute a parameterized query.
   * @param {string} text - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<import('pg').QueryResult>}
   */
  query: (text, params) => pool.query(text, params),
  pool,
};
