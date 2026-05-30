// ============================================================
// config/session.js — Configuration des sessions Express
// ============================================================
require('dotenv').config();

/**
 * Options de configuration pour express-session
 * La session stocke les informations de l'utilisateur connecté
 */
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'smartschool_default_secret',
  resave: false,              // Ne pas sauvegarder si non modifiée
  saveUninitialized: false,   // Ne pas créer de session vide
  name: 'smartschool.sid',    // Nom du cookie de session
  cookie: {
    httpOnly: true,           // Inaccessible depuis JavaScript côté client
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
    maxAge: 2 * 60 * 60 * 1000, // 2 heures
    sameSite: 'lax'
  },
  rolling: true // Prolonge la session à chaque requête (inactivité gérée séparément)
};

module.exports = sessionConfig;
