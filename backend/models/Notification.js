const db = require('../config/db');
const TABLE = 'notifications';

const Notification = {
  TABLE,
  async findByPk(id) { return db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]); },
  async findOne(opts = {}) {
    const keys = Object.keys(opts.where || {});
    const clauses = keys.map(k => `\`${k}\` = ?`).join(' AND ');
    return db.getOne(`SELECT * FROM \`${TABLE}\` WHERE ${clauses}`, Object.values(opts.where || {}));
  },
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
  async create(data) {
    const r = await db.insert(TABLE, { ...data, created_at: new Date(), updated_at: new Date() });
    return { id: r.insertId, ...data, lu: data.lu || false };
  },
  async update(data, opts = {}) { return db.update(TABLE, { ...data, updated_at: new Date() }, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) {
    const params = Object.values(where);
    const clauses = Object.keys(where).length ? 'WHERE ' + Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ') : '';
    const rows = await db.query(`SELECT COUNT(*) AS total FROM \`${TABLE}\` ${clauses}`, params);
    return rows[0].total;
  }
};

module.exports = Notification;
