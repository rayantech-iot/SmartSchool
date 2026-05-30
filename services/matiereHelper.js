// ============================================================
// services/matiereHelper.js — Coefficient par classe / élève
// ============================================================
const { ClasseMatiere, Eleve } = require('../models');

/**
 * Coefficient d'une matière pour un élève (via sa classe)
 */
async function getCoefficientPourEleve(eleveId, matiereId, fallback = 1) {
  const eleve = await Eleve.findByPk(eleveId, { attributes: ['classe_id'] });
  if (!eleve?.classe_id) return fallback;

  const liaison = await ClasseMatiere.findOne({
    where: { classe_id: eleve.classe_id, matiere_id: matiereId }
  });
  if (liaison?.coefficient != null) return parseFloat(liaison.coefficient);
  return fallback;
}

/**
 * Coefficient pour une classe donnée
 */
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
