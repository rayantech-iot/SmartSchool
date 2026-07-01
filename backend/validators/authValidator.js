const { isValidEmail, isNotEmpty } = require('../utils/validation');

exports.validateLogin = (req) => {
  const errors = [];
  if (!isValidEmail(req.body.email)) errors.push('Adresse email invalide.');
  if (!isNotEmpty(req.body.motDePasse)) errors.push('Le mot de passe est obligatoire.');
  return errors;
};
