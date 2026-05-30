// validators/devoirValidator.js
const { body } = require('express-validator');

exports.devoirValidator = [
  body('titre').notEmpty().withMessage('Le titre est obligatoire').isLength({ max: 200 }),
  body('date_limite').isDate().withMessage('La date limite est invalide'),
  body('classe_id').isInt().withMessage('La classe est obligatoire'),
  body('matiere_id').isInt().withMessage('La matière est obligatoire')
];
