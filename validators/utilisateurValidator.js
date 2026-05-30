// validators/utilisateurValidator.js
const { body } = require('express-validator');

exports.createUserValidator = [
  body('nom').notEmpty().withMessage('Le nom est obligatoire.').isLength({ max: 50 }),
  body('prenom').notEmpty().withMessage('Le prénom est obligatoire.').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('type').isIn(['admin', 'professeur', 'eleve', 'parent']).withMessage('Rôle invalide.'),
  body('motDePasse').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Mot de passe : minimum 8 caractères.'),
  body('grade').if(body('type').equals('professeur')).notEmpty().withMessage('Le grade est obligatoire pour un professeur.'),
  body('date_naissance').if(body('type').equals('eleve')).notEmpty().withMessage('La date de naissance est obligatoire pour un élève.'),
  body('classe_id').if(body('type').equals('eleve')).notEmpty().withMessage('La classe est obligatoire pour un élève.'),
  body('eleve_id').if(body('type').equals('parent')).notEmpty().withMessage('Sélectionnez l\'enfant à lier pour le compte parent.')
];

exports.updateUserValidator = [
  body('nom').notEmpty().withMessage('Le nom est obligatoire.'),
  body('prenom').notEmpty().withMessage('Le prénom est obligatoire.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('nouveauMotDePasse').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Nouveau mot de passe : minimum 8 caractères.')
];

exports.createMatiereValidator = [
  body('nom').notEmpty().withMessage('Le nom est obligatoire.').isLength({ max: 50 }),
  body('code').optional({ checkFalsy: true }).isLength({ max: 10 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 })
];
