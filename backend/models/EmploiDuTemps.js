const db = require('../config/db');
const TABLE = 'emplois_du_temps';

const EmploiDuTemps = {
  TABLE,
  async findByPk(id, opts = {}) {
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]);
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'classe') row.classe = row.classe_id ? await db.getOne('SELECT * FROM classes WHERE id = ?', [row.classe_id]) : null;
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
    let sql = `SELECT id FROM \`${TABLE}\``;
    const params = [];
    if (opts.attributes) sql = `SELECT ${opts.attributes.join(', ')} FROM \`${TABLE}\``;
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

module.exports = EmploiDuTemps;
