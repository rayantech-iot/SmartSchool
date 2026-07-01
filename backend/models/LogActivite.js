const db = require('../config/db');
const TABLE = 'logs_activite';

const LogActivite = {
  TABLE,
  async create(data) { return db.insert(TABLE, { ...data, created_at: new Date() }); },
  async findAll(opts = {}) {
    let sql = `SELECT * FROM \`${TABLE}\``;
    const params = [];
    if (opts.where) {
      const keys = Object.keys(opts.where);
      sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
      params.push(...Object.values(opts.where));
    }
    if (opts.order) {
      const orders = opts.order.map(o => Array.isArray(o) ? `\`${o[0]}\` ${o[1]}` : `\`${o}\``);
      sql += ' ORDER BY ' + orders.join(', ');
    }
    if (opts.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
    return db.query(sql, params);
  },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = LogActivite;
