// validators/presenceValidator.js
const { body } = require('express-validator');

exports.presenceValidator = [
  body('statut').isIn(['présent', 'absent', 'retard', 'excusé']).withMessage('Statut invalide'),
  body('date').isDate().withMessage('La date est invalide'),
  body('eleve_id').isInt().withMessage("L'identifiant de l'élève est invalide")
];
