const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function insert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const columns = keys.map(k => `\`${k}\``).join(', ');
  const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`;
  const [result] = await pool.execute(sql, Object.values(data));
  return { id: result.insertId, insertId: result.insertId };
}

async function update(table, data, where) {
  const setClauses = Object.keys(data).map(k => `\`${k}\` = ?`).join(', ');
  const setValues = Object.values(data);
  const whereClauses = Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
  const whereValues = Object.values(where);
  const sql = `UPDATE \`${table}\` SET ${setClauses} WHERE ${whereClauses}`;
  const [result] = await pool.execute(sql, [...setValues, ...whereValues]);
  return { affectedRows: result.affectedRows };
}

async function remove(table, where) {
  const whereClauses = Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
  const sql = `DELETE FROM \`${table}\` WHERE ${whereClauses}`;
  const [result] = await pool.execute(sql, Object.values(where));
  return { affectedRows: result.affectedRows };
}

async function count(table, where = {}) {
  if (where && where.where && !Array.isArray(where)) where = where.where;
  const whereClauses = Object.keys(where).length
    ? 'WHERE ' + Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ')
    : '';
  const sql = `SELECT COUNT(*) AS total FROM \`${table}\` ${whereClauses}`;
  const rows = await query(sql, Object.values(where));
  return rows[0].total;
}

async function testConnection() {
  try {
    await pool.getConnection();
    console.log('Connexion MySQL établie avec succès.');
  } catch (error) {
    console.error('Impossible de se connecter à MySQL:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, query, getOne, insert, update, remove, count, testConnection };
