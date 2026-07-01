const db = require('../config/db');
const TABLE = 'classes';

const Classe = {
  TABLE,
  async findByPk(id, opts = {}) {
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]);
    if (!row) return null;
    if (opts.include) {
      for (const inc of opts.include) {
        if (inc.model?.TABLE === 'eleves' || inc.as === 'eleves') {
          let sql = 'SELECT e.*, u.nom, u.prenom, u.email, u.telephone FROM eleves e JOIN utilisateurs u ON u.id = e.utilisateur_id WHERE e.classe_id = ?';
          row.eleves = await db.query(sql, [id]);
          if (inc.include) {
            for (const sub of inc.include) {
              if (sub.as === 'utilisateur' || sub.model?.TABLE === 'utilisateurs') {
                for (const e of row.eleves) {
                  e.utilisateur = { nom: e.nom, prenom: e.prenom, email: e.email, telephone: e.telephone };
                }
              }
            }
          }
        }
      }
    }
    return row;
  },
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
    return db.query(sql, params);
  },
  async create(data) { return db.insert(TABLE, { ...data, created_at: new Date(), updated_at: new Date() }); },
  async update(data, opts = {}) { return db.update(TABLE, { ...data, updated_at: new Date() }, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = Classe;
