const db = require('../config/db');
const TABLE = 'messages';

const Message = {
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
    const rows = await db.query(sql, params);
    if (opts.include) {
      for (const inc of opts.include) {
        for (const row of rows) {
          if (inc.as === 'expediteur') row.expediteur = row.expediteur_id ? await db.getOne('SELECT id, nom, prenom, email, type FROM utilisateurs WHERE id = ?', [row.expediteur_id]) : null;
          if (inc.as === 'destinataire') row.destinataire = row.destinataire_id ? await db.getOne('SELECT id, nom, prenom, email, type FROM utilisateurs WHERE id = ?', [row.destinataire_id]) : null;
        }
      }
    }
    return rows;
  },
  async create(data) { const r = await db.insert(TABLE, { ...data, created_at: new Date(), updated_at: new Date() }); return { id: r.insertId, ...data }; },
  async update(data, opts = {}) { return db.update(TABLE, { ...data, updated_at: new Date() }, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = Message;
