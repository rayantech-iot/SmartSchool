const db = require('../config/db');
const TABLE = 'utilisateurs';

const Utilisateur = {
  TABLE,

  async findByPk(id, opts = {}) {
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]);
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'profilEleve') row.profilEleve = await db.getOne('SELECT * FROM eleves WHERE utilisateur_id = ?', [row.id]);
      }
    }
    return row;
  },

  async findOne(opts = {}) {
    const where = opts.where || opts;
    const keys = Object.keys(where);
    const clauses = keys.map(k => `\`${k}\` = ?`).join(' AND ');
    return db.getOne(`SELECT * FROM \`${TABLE}\` WHERE ${clauses}`, Object.values(where));
  },

  async findAll(opts = {}) {
    let sql = `SELECT * FROM \`${TABLE}\``;
    const params = [];
    if (opts.where) {
      const keys = Object.keys(opts.where);
      const clauses = keys.map(k => `\`${k}\` = ?`);
      sql += ' WHERE ' + clauses.join(' AND ');
      params.push(...Object.values(opts.where));
    }
    if (opts.order) {
      const orders = opts.order.map(o => {
        if (Array.isArray(o)) return `\`${o[0]}\` ${o[1]}`;
        return `\`${o}\``;
      });
      sql += ' ORDER BY ' + orders.join(', ');
    }
    if (opts.limit) sql += ' LIMIT ?';
    if (opts.limit) params.push(opts.limit);
    if (opts.offset) sql += ' OFFSET ?';
    if (opts.offset) params.push(opts.offset);
    const rows = await db.query(sql, params);
    if (opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'profilEleve') {
          for (const row of rows) {
            const e = await db.getOne('SELECT * FROM eleves WHERE utilisateur_id = ?', [row.id]);
            if (e) {
              row.profilEleve = e;
              if (inc.include) {
                for (const sub of inc.include) {
                  if (sub.as === 'classe') row.profilEleve.classe = e.classe_id ? await db.getOne('SELECT * FROM classes WHERE id = ?', [e.classe_id]) : null;
                }
              }
            }
          }
        }
      }
    }
    return rows;
  },

  async create(data) {
    const now = new Date();
    return db.insert(TABLE, { ...data, created_at: now, updated_at: now });
  },

  async update(data, opts = {}) {
    data.updated_at = new Date();
    return db.update(TABLE, data, opts.where || { id: data.id });
  },

  async destroy(opts = {}) {
    return db.remove(TABLE, opts.where || {});
  },

  async count(opts = {}) {
    const where = opts.where || opts;
    return db.count(TABLE, where);
  }
};

module.exports = Utilisateur;
