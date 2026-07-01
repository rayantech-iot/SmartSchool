const db = require('../config/db');
const TABLE = 'presences';

const Presence = {
  TABLE,
  async findByPk(id) { return db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]); },
  async findOne(opts = {}) {
    const keys = Object.keys(opts.where || {});
    const clauses = keys.map(k => `\`${k}\` = ?`).join(' AND ');
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE ${clauses}`, Object.values(opts.where || {}));
    if (row) row.id = row.id;
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
    const rows = await db.query(sql, params);
    if (opts.include) {
      for (const inc of opts.include) {
        for (const row of rows) {
          if (inc.as === 'eleve') {
            row.eleve = row.eleve_id ? await db.getOne('SELECT * FROM eleves WHERE id = ?', [row.eleve_id]) : null;
          }
          if (inc.as === 'professeur') {
            row.professeur = row.professeur_id ? await db.getOne('SELECT * FROM professeurs WHERE id = ?', [row.professeur_id]) : null;
          }
          if (inc.as === 'seance') {
            row.seance = row.seance_id ? await db.getOne('SELECT * FROM seances WHERE id = ?', [row.seance_id]) : null;
          }
        }
      }
    }
    return rows;
  },
  async create(data) {
    const result = await db.insert(TABLE, { ...data, created_at: new Date(), updated_at: new Date() });
    return { id: result.insertId, ...data };
  },
  async update(data, opts = {}) { return db.update(TABLE, { ...data, updated_at: new Date() }, opts.where || { id: data.id }); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); },
  async count(where = {}) { return db.count(TABLE, where); }
};

module.exports = Presence;
