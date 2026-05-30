// ============================================================
// validators/authValidator.js — Validation du formulaire de connexion
// ============================================================
const { body } = require('express-validator');

exports.loginValidator = [
  body('email')
    .isEmail().withMessage('Adresse email invalide')
    .normalizeEmail()
    .notEmpty().withMessage("L'email est obligatoire"),
  body('motDePasse')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
];
