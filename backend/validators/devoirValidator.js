const { isNotEmpty } = require('../utils/validation');

exports.validateDevoir = (req) => {
  const errors = [];
  if (!isNotEmpty(req.body.titre)) errors.push('Le titre est obligatoire.');
  if (!isNotEmpty(req.body.description)) errors.push('La description est obligatoire.');
  if (!isNotEmpty(req.body.date_limite)) errors.push('La date limite est obligatoire.');
  if (!isNotEmpty(req.body.matiere_id)) errors.push('La matière est obligatoire.');
  if (!isNotEmpty(req.body.classe_id)) errors.push('La classe est obligatoire.');
  return errors;
};
