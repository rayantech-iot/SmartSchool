const db = require('../config/db');
const TABLE = 'parents';

const Parent = {
  TABLE,
  async findByPk(id) { return db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]); },
  async findOne(opts = {}) {
    let sql = `SELECT * FROM \`${TABLE}\``;
    const params = [];
    if (opts.where) {
      const keys = Object.keys(opts.where);
      if (keys.length) {
        sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
        params.push(...Object.values(opts.where));
      }
    }
    const row = await db.getOne(sql, params);
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'enfant') row.enfant = row.eleve_id ? await db.getOne('SELECT * FROM eleves WHERE id = ?', [row.eleve_id]) : null;
      }
    }
    return row;
  },
  async findAll(opts = {}) {
    let sql = `SELECT * FROM \`${TABLE}\``;
    const params = [];
    if (opts.where) {
      const keys = Object.keys(opts.where);
      sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
      params.push(...Object.values(opts.where));
    }
    return db.query(sql, params);
  },
  async create(data) { return db.insert(TABLE, { ...data, created_at: new Date(), updated_at: new Date() }); },
  async update(data, opts = {}) { return db.update(TABLE, { ...data, updated_at: new Date() }, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = Parent;
