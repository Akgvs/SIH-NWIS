import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

/**
 * Helper: run a query and return rows.
 * @param {string} text   SQL query
 * @param {any[]}  params Parameterised values
 */
export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/**
 * Helper: return the first row or null.
 */
export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}
