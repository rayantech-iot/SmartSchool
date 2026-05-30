// ============================================================
// middlewares/sessionInactivityMiddleware.js — Expiration 2h inactivité
// ============================================================
const INACTIVITE_MS = 2 * 60 * 60 * 1000;

exports.gererInactivite = (req, res, next) => {
  if (!req.session) return next();

  const now = Date.now();
  if (req.session.derniereActivite && now - req.session.derniereActivite > INACTIVITE_MS) {
    return req.session.destroy(() => {
      res.clearCookie('smartschool.sid');
      req.flash('error', 'Session expirée après 2 heures d\'inactivité. Veuillez vous reconnecter.');
      return res.redirect('/login');
    });
  }

  req.session.derniereActivite = now;
  next();
};
