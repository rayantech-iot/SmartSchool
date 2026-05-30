// ============================================================
// services/moyenneRecalcService.js — Recalcul moyennes / bulletins
// ============================================================
const { Note, Bulletin, Eleve, Matiere } = require('../models');
const { getCoefficientPourEleve } = require('./matiereHelper');

async function calculerMoyenneEleve(eleveId, periode) {
  const notes = await Note.findAll({
    where: { eleve_id: eleveId, periode },
    include: [{ model: Matiere, as: 'matiere' }]
  });
  if (!notes.length) return null;

  let somme = 0;
  let totalCoeff = 0;
  for (const note of notes) {
    const coeff = await getCoefficientPourEleve(eleveId, note.matiere_id, parseFloat(note.matiere?.coefficient) || 1);
    somme += parseFloat(note.valeur) * coeff;
    totalCoeff += coeff;
  }
  return totalCoeff > 0 ? parseFloat((somme / totalCoeff).toFixed(2)) : null;
}

/**
 * Recalcule les bulletins après modification d'un coefficient de matière
 */
async function recalculerBulletinsPourMatiere(matiereId) {
  const notes = await Note.findAll({
    where: { matiere_id: matiereId },
    attributes: ['eleve_id', 'periode'],
    group: ['eleve_id', 'periode']
  });

  const traite = new Set();
  for (const n of notes) {
    const key = `${n.eleve_id}-${n.periode}`;
    if (traite.has(key)) continue;
    traite.add(key);

    const eleve = await Eleve.findByPk(n.eleve_id);
    if (!eleve) continue;

    const moyenne = await calculerMoyenneEleve(n.eleve_id, n.periode);
    if (moyenne === null) continue;

    const bulletin = await Bulletin.findOne({
      where: { eleve_id: n.eleve_id, periode: n.periode }
    });
    if (bulletin) {
      await bulletin.update({ moyenne_generale: moyenne });
    }
  }
}

module.exports = {
  calculerMoyenneEleve,
  recalculerBulletinsPourMatiere
};
