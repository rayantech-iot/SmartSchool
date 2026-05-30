// ============================================================
// middlewares/authMiddleware.js — Contrôle d'accès par rôle
// ============================================================
'use strict';

const { Utilisateur } = require('../models');

const TYPES_VALIDES = ['admin', 'professeur', 'eleve', 'parent'];

/**
 * Vérifie que la session contient un utilisateur valide
 */
const sessionValide = (req) => {
  const u = req.session?.user;
  return u && u.id && u.type && TYPES_VALIDES.includes(u.type);
};

/**
 * Supprime l'utilisateur de la session (évite les boucles de redirection)
 */
exports.clearSessionUser = (req) => {
  if (req.session) {
    delete req.session.user;
  }
};

/**
 * Redirige vers /login en effaçant la session utilisateur
 */
exports.redirectToLogin = (req, res, message) => {
  exports.clearSessionUser(req);
  if (message) req.flash('error', message);
  return res.redirect('/login');
};

/**
 * Vérifie qu'un utilisateur est authentifié et toujours actif en base
 */
exports.isAuthenticated = async (req, res, next) => {
  if (!sessionValide(req)) {
    return exports.redirectToLogin(req, res, 'Veuillez vous connecter pour accéder à cette page.');
  }
  try {
    const u = await Utilisateur.findByPk(req.session.user.id, {
      attributes: ['id', 'statut', 'nom', 'prenom', 'email', 'type']
    });
    if (!u) {
      return exports.redirectToLogin(req, res, 'Session invalide. Veuillez vous reconnecter.');
    }
    if (u.statut !== 'actif') {
      return exports.redirectToLogin(req, res, 'Votre compte a été désactivé. Contactez l\'administrateur.');
    }
    req.session.user = {
      ...req.session.user,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      type: u.type
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Vérifie que l'utilisateur possède un des rôles requis
 * @param {...string} roles - Rôles autorisés (ex: 'admin', 'professeur')
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!sessionValide(req)) {
      return exports.redirectToLogin(req, res, 'Accès refusé. Veuillez vous connecter.');
    }
    if (!roles.includes(req.session.user.type)) {
      return res.status(403).render('errors/403', {
        titre: 'Accès interdit — SmartSchool',
        message: "Vous n'avez pas les droits pour accéder à cette page.",
        user: req.session.user
      });
    }
    next();
  };
};

/**
 * Injecte les données de l'utilisateur connecté dans toutes les vues EJS
 * Accessible via res.locals.user dans tous les templates
 */
exports.injectUser = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.flash();
  // Token CSRF disponible dans toutes les vues (formulaires POST)
  if (req.session) {
    const { genererToken } = require('./csrfMiddleware');
    res.locals.csrfToken = genererToken(req);
  }
  next();
};
