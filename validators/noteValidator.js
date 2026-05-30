// validators/noteValidator.js
const { body } = require('express-validator');

exports.noteValidator = [
  body('valeur').isFloat({ min: 0, max: 20 }).withMessage('La note doit être entre 0 et 20'),
  body('eleve_id').isInt().withMessage("L'identifiant de l'élève est invalide"),
  body('matiere_id').isInt().withMessage('La matière est obligatoire'),
  body('periode').notEmpty().withMessage('La période est obligatoire'),
  body('type_evaluation').notEmpty().withMessage("Le type d'évaluation est obligatoire")
];
