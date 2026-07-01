const db = require('../config/db');
const { ClasseMatiere, Eleve } = require('../models');

async function getCoefficientPourEleve(eleveId, matiereId, fallback = 1) {
  const eleve = await db.getOne('SELECT classe_id FROM eleves WHERE id = ?', [eleveId]);
  if (!eleve?.classe_id) return fallback;

  const liaison = await ClasseMatiere.findOne({
    where: { classe_id: eleve.classe_id, matiere_id: matiereId }
  });
  if (liaison?.coefficient != null) return parseFloat(liaison.coefficient);
  return fallback;
}

async function getCoefficientPourClasse(classeId, matiereId, fallback = 1) {
  const liaison = await ClasseMatiere.findOne({
    where: { classe_id: classeId, matiere_id: matiereId }
  });
  if (liaison?.coefficient != null) return parseFloat(liaison.coefficient);
  return fallback;
}

module.exports = {
  getCoefficientPourEleve,
  getCoefficientPourClasse
};
