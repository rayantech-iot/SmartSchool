


const db = require('../config/db');

async function genererMatricule() {
  const annee = new Date().getFullYear();
  const prefix = `SS${annee}`;
  const rows = await db.query('SELECT matricule FROM eleves ORDER BY id DESC LIMIT 1');
  const dernier = rows[0];

  let seq = 1;
  if (dernier?.matricule?.startsWith(prefix)) {
    const num = parseInt(dernier.matricule.replace(prefix, ''), 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = { genererMatricule };
