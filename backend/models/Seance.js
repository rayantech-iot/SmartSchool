const db = require('../config/db');
const TABLE = 'seances';

const Seance = {
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
      for (const k of keys) {
        const v = opts.where[k];
        if (v !== null && typeof v === 'object' && v.constructor?.name === 'Object') {
          const entries = Object.entries(v);
          for (const [op, val] of entries) {
            if (op === 'Op.in' || op === 'in') {
              sql += (params.length ? '' : ' WHERE ') + (params.length > 0 || keys.indexOf(k) > 0 ? ' AND ' : '') + `\`${k}\` IN (${val.map(() => '?').join(',')})`;
              params.push(...val);
            }
          }
        } else {
          sql += (params.length || keys.indexOf(k) > 0 ? ' AND ' : ' WHERE ') + `\`${k}\` = ?`;
          params.push(v);
        }
      }
    }
    if (opts.order) {
      const orders = opts.order.map(o => Array.isArray(o) ? `\`${o[0]}\` ${o[1]}` : `\`${o}\``);
      sql += ' ORDER BY ' + orders.join(', ');
    }
    const rows = await db.query(sql, params);
    if (opts.include) {
      for (const inc of opts.include) {
        for (const row of rows) {
          if (inc.as === 'matiere' || inc.model?.TABLE === 'matieres') {
            row.matiere = row.matiere_id ? await db.getOne('SELECT * FROM matieres WHERE id = ?', [row.matiere_id]) : null;
          }
          if (inc.as === 'professeur') {
            row.professeur = row.professeur_id ? await db.getOne('SELECT * FROM professeurs WHERE id = ?', [row.professeur_id]) : null;
          }
          if (inc.as === 'emploiDuTemps') {
            row.emploiDuTemps = row.emploi_du_temps_id ? await db.getOne('SELECT * FROM emplois_du_temps WHERE id = ?', [row.emploi_du_temps_id]) : null;
            if (row.emploiDuTemps && inc.include) {
              for (const sub of inc.include) {
                if (sub.as === 'classe') row.emploiDuTemps.classe = row.emploiDuTemps.classe_id ? await db.getOne('SELECT * FROM classes WHERE id = ?', [row.emploiDuTemps.classe_id]) : null;
              }
            }
          }
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

module.exports = Seance;
