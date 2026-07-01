const db = require('../config/db');
const TABLE = 'classe_matieres';

const ClasseMatiere = {
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
    return db.query(sql, params);
  },
  async create(data) { return db.insert(TABLE, data); },
  async destroy(opts = {}) { return db.remove(TABLE, opts.where || {}); }
};

module.exports = ClasseMatiere;
