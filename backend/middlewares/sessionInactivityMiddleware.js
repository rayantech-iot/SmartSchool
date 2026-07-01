

const isApiRoute = (req) => req.path && req.path.startsWith('/api');

const INACTIVITE_MS = 2 * 60 * 60 * 1000;

exports.gererInactivite = (req, res, next) => {
  if (!req.session) return next();

  const now = Date.now();
  if (req.session.derniereActivite && now - req.session.derniereActivite > INACTIVITE_MS) {
    return req.session.destroy(() => {
      res.clearCookie('smartschool.sid');
      if (isApiRoute(req)) {
        return res.status(401).json({ error: 'Session expirée' });
      }
      if (typeof req.flash === 'function') {
        req.flash('error', 'Session expirée après 2 heures d\'inactivité.');
      }
      return res.redirect('/login');
    });
  }

  req.session.derniereActivite = now;
  next();
};
