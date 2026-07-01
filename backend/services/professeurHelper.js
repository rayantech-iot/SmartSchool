const db = require('../config/db');
const { Professeur } = require('../models');

async function getProfesseurParUtilisateur(utilisateurId) {
  if (!utilisateurId) return null;
  return Professeur.findOne({ where: { utilisateur_id: utilisateurId } });
}

async function getClassesDuProfesseur(professeur) {
  if (!professeur) return [];
  return db.query(
    `SELECT c.* FROM classes c
     JOIN professeur_classes pc ON pc.classe_id = c.id
     WHERE pc.professeur_id = ?`,
    [professeur.id]
  );
}

module.exports = { getProfesseurParUtilisateur, getClassesDuProfesseur };
