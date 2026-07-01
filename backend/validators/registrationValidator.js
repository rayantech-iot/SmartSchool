const { isValidEmail, isValidName, isValidLength, isValidMatricule, isValidDate, isNotEmpty } = require('../utils/validation');
const { aAuMoinsAns } = require('../utils/age');

exports.validateInscriptionEleve = (req) => {
  const errors = [];
  if (!isValidName(req.body.nom)) errors.push('Le nom est invalide (2-50 caractères).');
  if (!isValidName(req.body.prenom)) errors.push('Le prénom est invalide (2-50 caractères).');
  if (!isValidEmail(req.body.email)) errors.push('Email invalide.');
  if (!isNotEmpty(req.body.date_naissance) || !isValidDate(req.body.date_naissance)) errors.push('Date de naissance invalide.');
  else if (!aAuMoinsAns(req.body.date_naissance, 6)) errors.push("L'élève doit avoir au moins 6 ans.");
  if (req.body.matricule && !isValidMatricule(req.body.matricule)) errors.push('Matricule invalide.');
  return errors;
};

exports.validateInscriptionParent = (req) => {
  const errors = [];
  if (!isValidName(req.body.nom)) errors.push('Le nom est invalide (2-50 caractères).');
  if (!isValidName(req.body.prenom)) errors.push('Le prénom est invalide (2-50 caractères).');
  if (!isValidEmail(req.body.email)) errors.push('Email invalide.');
  if (!isValidMatricule(req.body.matricule)) errors.push('Matricule de l\'enfant invalide.');
  if (!isNotEmpty(req.body.date_naissance_enfant) || !isValidDate(req.body.date_naissance_enfant)) errors.push('Date de naissance de l\'enfant invalide.');
  return errors;
};

exports.validateLierEnfant = (req) => {
  const errors = [];
  if (!isValidMatricule(req.body.matricule)) errors.push('Matricule obligatoire.');
  if (!isNotEmpty(req.body.date_naissance) || !isValidDate(req.body.date_naissance)) errors.push('Date de naissance invalide.');
  return errors;
};
