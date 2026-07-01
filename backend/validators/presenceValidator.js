const { isNotEmpty, isValidDate } = require('../utils/validation');

exports.validatePresence = (req) => {
  const errors = [];
  if (!isNotEmpty(req.body.eleve_id)) errors.push("L'identifiant de l'élève est obligatoire.");
  if (!isNotEmpty(req.body.date) || !isValidDate(req.body.date)) errors.push('La date est invalide.');
  return errors;
};
