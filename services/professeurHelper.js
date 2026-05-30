const { Professeur } = require('../models');

async function getProfesseurParUtilisateur(utilisateurId) {
  if (!utilisateurId) return null;
  return Professeur.findOne({ where: { utilisateur_id: utilisateurId } });
}

async function getClassesDuProfesseur(professeur, include = []) {
  if (!professeur) return [];
  return professeur.getClasses({ include });
}

module.exports = { getProfesseurParUtilisateur, getClassesDuProfesseur };
