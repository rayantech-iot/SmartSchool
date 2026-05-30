// ============================================================
// services/matriculeService.js — Génération matricule élève
// ============================================================
const { Eleve } = require('../models');

async function genererMatricule() {
  const annee = new Date().getFullYear();
  const prefix = `SS${annee}`;
  const dernier = await Eleve.findOne({
    where: {},
    order: [['id', 'DESC']],
    attributes: ['matricule']
  });

  let seq = 1;
  if (dernier?.matricule?.startsWith(prefix)) {
    const num = parseInt(dernier.matricule.replace(prefix, ''), 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = { genererMatricule };
