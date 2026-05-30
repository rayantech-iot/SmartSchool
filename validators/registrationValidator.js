// validators/registrationValidator.js
const { body } = require('express-validator');
const { aAuMoinsAns } = require('../utils/age');

exports.inscriptionEleveValidator = [
  body('nom').notEmpty().withMessage('Le nom est obligatoire.').isLength({ max: 50 }),
  body('prenom').notEmpty().withMessage('Le prénom est obligatoire.').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('matricule').optional({ checkFalsy: true }).isLength({ max: 20 }),
  body('date_naissance')
    .isDate().withMessage('Date de naissance invalide.')
    .custom((value) => {
      if (!aAuMoinsAns(value, 6)) {
        throw new Error('L\'élève doit avoir au moins 6 ans pour créer un compte.');
      }
      return true;
    })
];

exports.inscriptionParentValidator = [
  body('nom').notEmpty().withMessage('Le nom est obligatoire.'),
  body('prenom').notEmpty().withMessage('Le prénom est obligatoire.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('matricule').notEmpty().withMessage('Le matricule de l\'enfant est obligatoire.'),
  body('date_naissance_enfant').isDate().withMessage('Date de naissance de l\'enfant invalide.'),
  body('lien').optional().isIn(['père', 'mère', 'tuteur', 'autre'])
];

exports.lierEnfantValidator = [
  body('matricule').notEmpty().withMessage('Matricule obligatoire.'),
  body('date_naissance').isDate().withMessage('Date de naissance invalide.')
];
