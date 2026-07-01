const db = require('../config/db');
const { Bulletin, Eleve } = require('../models');
const { getCoefficientPourEleve } = require('./matiereHelper');

async function calculerMoyenneEleve(eleveId, periode) {
  const notes = await db.query(
    `SELECT n.*, m.coefficient AS m_coefficient
     FROM notes n
     LEFT JOIN matieres m ON m.id = n.matiere_id
     WHERE n.eleve_id = ? AND n.periode = ?`,
    [eleveId, periode]
  );
  if (!notes.length) return null;

  let somme = 0;
  let totalCoeff = 0;
  for (const note of notes) {
    const coeff = await getCoefficientPourEleve(eleveId, note.matiere_id, parseFloat(note.m_coefficient) || 1);
    somme += parseFloat(note.valeur) * coeff;
    totalCoeff += coeff;
  }
  return totalCoeff > 0 ? parseFloat((somme / totalCoeff).toFixed(2)) : null;
}

async function recalculerBulletinsPourMatiere(matiereId) {
  const notes = await db.query(
    `SELECT DISTINCT eleve_id, periode FROM notes WHERE matiere_id = ?`,
    [matiereId]
  );

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
      await Bulletin.update({ moyenne_generale: moyenne }, { where: { id: bulletin.id } });
    }
  }
}

module.exports = {
  calculerMoyenneEleve,
  recalculerBulletinsPourMatiere
};
