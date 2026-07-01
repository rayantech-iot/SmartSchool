



const crypto = require('crypto');


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


const regenererToken = (req) => {
  return req.session?.csrfToken || '';
};


exports.injectCsrfToken = (req, res, next) => {
  res.locals.csrfToken = genererToken(req);
  next();
};


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
