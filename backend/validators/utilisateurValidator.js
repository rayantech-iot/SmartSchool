const { isValidEmail, isValidName, isValidPhone, isValidPassword, isNotEmpty } = require('../utils/validation');

exports.validateCreateUser = (req) => {
  const errors = [];
  if (!isValidName(req.body.nom)) errors.push('Le nom est invalide (2-50 caractères).');
  if (!isValidName(req.body.prenom)) errors.push('Le prénom est invalide (2-50 caractères).');
  if (!isValidEmail(req.body.email)) errors.push('Email invalide.');
  if (!isValidPhone(req.body.telephone)) errors.push('Numéro de téléphone invalide.');
  if (req.body.mot_de_passe && !isValidPassword(req.body.mot_de_passe)) errors.push('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
  if (!isNotEmpty(req.body.type)) errors.push('Le type d\'utilisateur est obligatoire.');
  return errors;
};

exports.validateUpdateUser = (req) => {
  const errors = [];
  if (!isValidName(req.body.nom)) errors.push('Le nom est invalide (2-50 caractères).');
  if (!isValidName(req.body.prenom)) errors.push('Le prénom est invalide (2-50 caractères).');
  if (!isValidEmail(req.body.email)) errors.push('Email invalide.');
  if (req.body.telephone && !isValidPhone(req.body.telephone)) errors.push('Numéro de téléphone invalide.');
  return errors;
};

exports.validateCreateMatiere = (req) => {
  const errors = [];
  const { isNotEmpty } = require('../utils/validation');
  if (!isNotEmpty(req.body.nom)) errors.push('Le nom de la matière est obligatoire.');
  if (!isNotEmpty(req.body.code)) errors.push('Le code matière est obligatoire.');
  return errors;
};
