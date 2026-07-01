const db = require('../config/db');
const TABLE = 'demandes_liaison';

const DemandeLiaison = {
  TABLE,
  async findByPk(id, opts = {}) {
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]);
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'eleve') row.eleve = row.eleve_id ? await db.getOne('SELECT * FROM eleves WHERE id = ?', [row.eleve_id]) : null;
        if (inc.as === 'utilisateur') row.utilisateur = row.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.utilisateur_id]) : null;
      }
    }
    return row;
  },
  async findOne(opts = {}) {
    const keys = Object.keys(opts.where || {});
    const clauses = keys.map(k => `\`${k}\` = ?`).join(' AND ');
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE ${clauses}`, Object.values(opts.where || {}));
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'eleve') {
          row.eleve = row.eleve_id ? await db.getOne('SELECT * FROM eleves WHERE id = ?', [row.eleve_id]) : null;
          if (row.eleve && inc.include) {
            for (const sub of inc.include) {
              if (sub.as === 'utilisateur') row.eleve.utilisateur = row.eleve.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.eleve.utilisateur_id]) : null;
            }
          }
        }
        if (inc.as === 'utilisateur') row.utilisateur = row.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.utilisateur_id]) : null;
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
    if (opts.order) {
      const orders = opts.order.map(o => Array.isArray(o) ? `\`${o[0]}\` ${o[1]}` : `\`${o}\``);
      sql += ' ORDER BY ' + orders.join(', ');
    }
    const rows = await db.query(sql, params);
    if (opts.include) {
      for (const inc of opts.include) {
        for (const row of rows) {
          if (inc.as === 'eleve') {
            row.eleve = row.eleve_id ? await db.getOne('SELECT * FROM eleves WHERE id = ?', [row.eleve_id]) : null;
            if (row.eleve && inc.include) {
              for (const sub of inc.include) {
                if (sub.as === 'utilisateur') row.eleve.utilisateur = row.eleve.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.eleve.utilisateur_id]) : null;
              }
            }
          }
          if (inc.as === 'utilisateur') row.utilisateur = row.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.utilisateur_id]) : null;
        }
      }
    }
    return rows;
  },
  async create(data) { return db.insert(TABLE, { ...data, created_at: new Date(), updated_at: new Date() }); },
  async update(data, opts = {}) { return db.update(TABLE, { ...data, updated_at: new Date() }, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = DemandeLiaison;
