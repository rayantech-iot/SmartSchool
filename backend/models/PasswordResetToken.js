const db = require('../config/db');
const TABLE = 'password_reset_tokens';

const PasswordResetToken = {
  TABLE,
  async findByPk(id) { return db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]); },
  async findOne(opts = {}) {
    const keys = Object.keys(opts.where || {});
    const clauses = keys.map(k => `\`${k}\` = ?`).join(' AND ');
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE ${clauses}`, Object.values(opts.where || {}));
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'utilisateur') {
          row.utilisateur = row.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.utilisateur_id]) : null;
        }
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
  async create(data) { const r = await db.insert(TABLE, { ...data, created_at: new Date() }); return { id: r.insertId, ...data }; },
  async update(data, opts = {}) { return db.update(TABLE, data, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = PasswordResetToken;
