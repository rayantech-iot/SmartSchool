const { isValidNumeric, isNotEmpty } = require('../utils/validation');

exports.validateNote = (req) => {
  const errors = [];
  if (!isValidNumeric(req.body.valeur, 0, 20)) errors.push('La note doit être un nombre entre 0 et 20.');
  if (!isValidNumeric(req.body.eleve_id, 1)) errors.push("L'identifiant de l'élève est invalide.");
  if (!isValidNumeric(req.body.matiere_id, 1)) errors.push('La matière est obligatoire.');
  if (!isNotEmpty(req.body.periode)) errors.push('La période est obligatoire.');
  if (!isNotEmpty(req.body.type_evaluation)) errors.push("Le type d'évaluation est obligatoire.");
  return errors;
};
