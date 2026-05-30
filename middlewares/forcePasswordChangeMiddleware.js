// ============================================================
// middlewares/forcePasswordChangeMiddleware.js
// ============================================================
const { Utilisateur } = require('../models');

const ROUTES_EXEMPTES = [
  '/auth/changer-mot-de-passe',
  '/logout',
  '/login'
];

exports.verifierChangementMotDePasse = async (req, res, next) => {
  if (!req.session?.user?.id) return next();

  const path = req.path;
  if (ROUTES_EXEMPTES.some((r) => path === r || path.startsWith(r + '/'))) {
    return next();
  }

  try {
    const u = await Utilisateur.findByPk(req.session.user.id, {
      attributes: ['doit_changer_mot_de_passe']
    });
    if (u?.doit_changer_mot_de_passe) {
      return res.redirect('/auth/changer-mot-de-passe');
    }
    next();
  } catch (err) {
    next(err);
  }
};
