// ============================================================
// middlewares/csrfMiddleware.js — Protection CSRF (équivalent csurf)
// Génère et valide un token par session pour tous les formulaires POST
// ============================================================
const crypto = require('crypto');

/**
 * Génère ou récupère le token CSRF de la session courante
 * @param {object} req - Requête Express
 * @returns {string} Token CSRF
 */
const genererToken = (req) => {
  if (!req.session) return '';
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(32).toString('hex');
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto
      .createHmac('sha256', req.session.csrfSecret)
      .update('smartschool-csrf-v1')
      .digest('hex');
  }
  return req.session.csrfToken;
};

/** Régénère le token après un POST validé */
const regenererToken = (req) => {
  if (!req.session?.csrfSecret) return '';
  req.session.csrfToken = crypto
    .createHmac('sha256', req.session.csrfSecret)
    .update('smartschool-csrf-v1')
    .digest('hex');
  return req.session.csrfToken;
};

/**
 * Injecte le token CSRF dans res.locals pour les vues EJS
 * Usage dans les formulaires : <%- include('partials/csrfField') %>
 */
exports.injectCsrfToken = (req, res, next) => {
  res.locals.csrfToken = genererToken(req);
  next();
};

/**
 * Valide le token CSRF sur les requêtes modifiant des données
 * Comportement identique à csurf({ cookie: false }) avec sessions Express
 */
exports.csrfProtection = (req, res, next) => {
  const methodesSansCsrf = ['GET', 'HEAD', 'OPTIONS'];
  if (methodesSansCsrf.includes(req.method)) {
    return next();
  }

  const tokenSoumis = req.body._csrf || req.headers['x-csrf-token'];
  const tokenSession = req.session && req.session.csrfToken;

  if (!tokenSoumis || !tokenSession || tokenSoumis !== tokenSession) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ error: 'Token CSRF invalide ou expiré.' });
    }
    req.flash('error', 'Session expirée ou token de sécurité invalide. Veuillez réessayer.');
    return res.status(403).render('errors/403', {
      titre: 'Requête refusée — SmartSchool',
      message: 'Protection CSRF : le formulaire a expiré ou a été modifié. Rechargez la page et réessayez.',
      user: req.session?.user || null
    });
  }

  regenererToken(req);
  next();
};

module.exports.genererToken = genererToken;
module.exports.regenererToken = regenererToken;
