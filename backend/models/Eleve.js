const db = require('../config/db');
const TABLE = 'eleves';

async function trouverAvecUtilisateur(id) {
  const sql = `SELECT e.*, u.nom, u.prenom, u.email, u.telephone, u.statut
               FROM \`${TABLE}\` e
               JOIN utilisateurs u ON u.id = e.utilisateur_id
               WHERE e.id = ?`;
  return db.getOne(sql, [id]);
}

async function listerAvecUtilisateur(where = {}) {
  let sql = `SELECT e.*, u.nom, u.prenom, u.email, u.telephone
             FROM \`${TABLE}\` e
             JOIN utilisateurs u ON u.id = e.utilisateur_id`;
  const params = [];
  const keys = Object.keys(where);
  if (keys.length) {
    const clauses = keys.map(k => `e.\`${k}\` = ?`);
    sql += ' WHERE ' + clauses.join(' AND ');
    params.push(...Object.values(where));
  }
  return db.query(sql, params);
}

const Eleve = {
  TABLE,

  async findByPk(id) {
    const row = await db.getOne(`SELECT * FROM \`${TABLE}\` WHERE id = ?`, [id]);
    if (row) row.utilisateur = () => null;
    return row;
  },

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
    if (opts.order) {
      const orders = opts.order.map(o => Array.isArray(o) ? `\`${o[0]}\` ${o[1]}` : `\`${o}\``);
      sql += ' ORDER BY ' + orders.join(', ');
    }
    const row = await db.getOne(sql, params);
    if (row && opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'utilisateur') row.utilisateur = row.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.utilisateur_id]) : null;
        if (inc.as === 'classe') row.classe = row.classe_id ? await db.getOne('SELECT * FROM classes WHERE id = ?', [row.classe_id]) : null;
      }
    }
    return row;
  },

  async findAll(opts = {}) {
    let sql = `SELECT * FROM \`${TABLE}\``;
    const params = [];
    const joins = [];

    if (opts.include) {
      for (const inc of opts.include) {
        if (inc.as === 'utilisateur') {
          joins.push(`LEFT JOIN utilisateurs AS util_${TABLE} ON util_${TABLE}.id = \`${TABLE}\`.utilisateur_id`);
        }
        if (inc.as === 'classe') {
          joins.push(`LEFT JOIN classes AS classe_${TABLE} ON classe_${TABLE}.id = \`${TABLE}\`.classe_id`);
        }
        if (inc.as === 'parents') {
          joins.push(`LEFT JOIN parents AS parents_${TABLE} ON parents_${TABLE}.eleve_id = \`${TABLE}\`.id`);
        }
      }
      if (joins.length) sql += ' ' + joins.join(' ');
    }

    if (opts.where) {
      const keys = Object.keys(opts.where);
      if (keys.length) {
        const clauses = keys.map(k => {
          const val = opts.where[k];
          if (val !== null && typeof val === 'object' && val.constructor?.name === 'Object') {
            const entries = Object.entries(val);
            return entries.map(([op, v]) => {
              if (op === 'in' || op === 'Op.in') {
                const arr = Array.isArray(v) ? v : [v];
                return `\`${k}\` IN (${arr.map(() => '?').join(',')})`;
              }
              return `\`${k}\` = ?`;
            }).join(' AND ');
          }
          return `\`${k}\` = ?`;
        }).flat();
        sql += ' WHERE ' + clauses.join(' AND ');
      }
      for (const k of keys) {
        const val = opts.where[k];
        if (val !== null && typeof val === 'object' && val.constructor?.name === 'Object') {
          for (const v of Object.values(val)) {
            if (Array.isArray(v)) params.push(...v);
            else params.push(v);
          }
        } else {
          params.push(val);
        }
      }
    }

    if (opts.order) {
      const orders = opts.order.map(o => {
        if (Array.isArray(o)) return `\`${o[0]}\` ${o[1]}`;
        return `\`${o}\``;
      });
      sql += ' ORDER BY ' + orders.join(', ');
    }

    const rows = await db.query(sql, params);

    if (opts.include) {
      for (const row of rows) {
        for (const inc of opts.include) {
          if (inc.as === 'utilisateur') {
            const u = row.utilisateur_id ? await db.getOne('SELECT * FROM utilisateurs WHERE id = ?', [row.utilisateur_id]) : null;
            row.utilisateur = u;
          }
          if (inc.as === 'classe') {
            const c = row.classe_id ? await db.getOne('SELECT * FROM classes WHERE id = ?', [row.classe_id]) : null;
            row.classe = c;
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

  async count(where = {}) {
    return db.count(TABLE, where);
  },

  trouverAvecUtilisateur,
  listerAvecUtilisateur
};

module.exports = Eleve;
