// ============================================================
// controllers/authController.js — Authentification SmartSchool
// ============================================================
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { Utilisateur, Eleve, Professeur, Parent, Admin } = require('../models');
const { clearSessionUser } = require('../middlewares/authMiddleware');
const activityLog = require('../services/activityLogService');
const passwordResetService = require('../services/passwordResetService');

const TYPES_VALIDES = ['admin', 'professeur', 'eleve', 'parent'];

const creerSession = (utilisateur, profilId) => ({
  id: utilisateur.id,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  email: utilisateur.email,
  type: utilisateur.type,
  profilId
});

exports.showLogin = (req, res) => {
  const u = req.session?.user;
  if (!u || !u.id || !u.type || !TYPES_VALIDES.includes(u.type)) {
    clearSessionUser(req);
    return res.render('auth/login', {
      titre: 'Connexion — SmartSchool',
      layout: 'layouts/auth'
    });
  }
  return res.redirect(`/${u.type}/dashboard`);
};

exports.login = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect('/login');
  }

  const email = req.body.email.toLowerCase().trim();
  const { motDePasse } = req.body;

  try {
    const utilisateur = await Utilisateur.findOne({ where: { email } });

    if (!utilisateur) {
      await activityLog.log(req, 'TENTATIVE_CONNEXION_ECHOUEE', { email }, null);
      req.flash('error', 'Email ou mot de passe incorrect.');
      return res.redirect('/login');
    }

    if (utilisateur.statut === 'en_attente') {
      await activityLog.log(req, 'TENTATIVE_CONNEXION_COMPTE_EN_ATTENTE', { email }, utilisateur.id);
      req.flash('error', 'Votre inscription est en cours de validation par l\'administration.');
      return res.redirect('/login');
    }

    if (utilisateur.statut !== 'actif') {
      await activityLog.log(req, 'TENTATIVE_CONNEXION_COMPTE_INACTIF', { email }, utilisateur.id);
      req.flash('error', 'Votre compte a été désactivé. Contactez l\'administrateur.');
      return res.redirect('/login');
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      await activityLog.log(req, 'TENTATIVE_CONNEXION_ECHOUEE', { email }, utilisateur.id);
      req.flash('error', 'Email ou mot de passe incorrect.');
      return res.redirect('/login');
    }

    let profilSpecifique = null;
    if (utilisateur.type === 'professeur') {
      profilSpecifique = await Professeur.findOne({ where: { utilisateur_id: utilisateur.id } });
    } else if (utilisateur.type === 'eleve') {
      profilSpecifique = await Eleve.findOne({ where: { utilisateur_id: utilisateur.id } });
    } else if (utilisateur.type === 'parent') {
      profilSpecifique = await Parent.findOne({ where: { utilisateur_id: utilisateur.id } });
    } else if (utilisateur.type === 'admin') {
      profilSpecifique = await Admin.findOne({ where: { utilisateur_id: utilisateur.id } });
    }

    if (!profilSpecifique && utilisateur.type !== 'parent') {
      clearSessionUser(req);
      req.flash('error', 'Profil utilisateur incomplet. Contactez l\'administration.');
      return res.redirect('/login');
    }

    await utilisateur.update({ derniere_connexion: new Date() });
    req.session.user = creerSession(utilisateur, profilSpecifique?.id || 0);
    req.session.derniereActivite = Date.now();

    await activityLog.log(req, 'CONNEXION_REUSSIE', { type: utilisateur.type }, utilisateur.id);

    if (utilisateur.doit_changer_mot_de_passe) {
      req.flash('info', 'Définissez votre mot de passe via le lien reçu par email, ou changez-le ici si déjà connecté.');
      return res.redirect('/auth/changer-mot-de-passe');
    }

    req.flash('success', `Bienvenue, ${utilisateur.prenom} ${utilisateur.nom} !`);
    const redirections = {
      admin: '/admin/dashboard',
      professeur: '/professeur/dashboard',
      eleve: '/eleve/dashboard',
      parent: '/parent/dashboard'
    };
    return res.redirect(redirections[utilisateur.type] || '/login');
  } catch (err) {
    console.error('Erreur connexion:', err);
    req.flash('error', 'Une erreur est survenue. Veuillez réessayer.');
    return res.redirect('/login');
  }
};

exports.showChangerMotDePasse = (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  res.render('auth/changerMotDePasse', {
    titre: 'Changer votre mot de passe — SmartSchool',
    layout: 'layouts/auth',
    user: req.session.user
  });
};

exports.changerMotDePasse = async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');

  const { motDePasseActuel, motDePasse, motDePasseConfirm } = req.body;

  if (!motDePasse || motDePasse.length < 8) {
    req.flash('error', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
    return res.redirect('/auth/changer-mot-de-passe');
  }
  if (motDePasse !== motDePasseConfirm) {
    req.flash('error', 'Les mots de passe ne correspondent pas.');
    return res.redirect('/auth/changer-mot-de-passe');
  }

  try {
    const utilisateur = await Utilisateur.findByPk(req.session.user.id);
    if (motDePasseActuel) {
      const ok = await bcrypt.compare(motDePasseActuel, utilisateur.mot_de_passe);
      if (!ok) {
        req.flash('error', 'Mot de passe actuel incorrect.');
        return res.redirect('/auth/changer-mot-de-passe');
      }
    }

    const hash = await bcrypt.hash(motDePasse, 12);
    await utilisateur.update({ mot_de_passe: hash, doit_changer_mot_de_passe: false });
    await activityLog.log(req, 'CHANGEMENT_MOT_DE_PASSE', null, utilisateur.id);

    req.flash('success', 'Mot de passe mis à jour avec succès.');
    const dash = `/${utilisateur.type}/dashboard`;
    return res.redirect(dash);
  } catch (err) {
    req.flash('error', 'Erreur lors du changement de mot de passe.');
    return res.redirect('/auth/changer-mot-de-passe');
  }
};

/** Lien de réinitialisation (valable 1 h) — page publique */
exports.showResetPassword = async (req, res) => {
  const enregistrement = await passwordResetService.validerToken(req.params.token);
  if (!enregistrement) {
    req.flash('error', 'Ce lien est invalide ou a expiré. Demandez un nouveau lien à l\'administration.');
    return res.redirect('/login');
  }
  res.render('auth/resetPassword', {
    titre: 'Nouveau mot de passe — SmartSchool',
    layout: 'layouts/auth',
    token: req.params.token,
    email: enregistrement.utilisateur.email
  });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { motDePasse, motDePasseConfirm } = req.body;

  if (!motDePasse || motDePasse.length < 8) {
    req.flash('error', 'Le mot de passe doit contenir au moins 8 caractères.');
    return res.redirect(`/auth/reinitialiser/${token}`);
  }
  if (motDePasse !== motDePasseConfirm) {
    req.flash('error', 'Les mots de passe ne correspondent pas.');
    return res.redirect(`/auth/reinitialiser/${token}`);
  }

  const enregistrement = await passwordResetService.validerToken(token);
  if (!enregistrement) {
    req.flash('error', 'Lien expiré ou invalide.');
    return res.redirect('/login');
  }

  const hash = await bcrypt.hash(motDePasse, 12);
  await enregistrement.utilisateur.update({ mot_de_passe: hash, doit_changer_mot_de_passe: false });
  await passwordResetService.marquerUtilise(token);
  await activityLog.log(req, 'CHANGEMENT_MOT_DE_PASSE', { via: 'lien_reset' }, enregistrement.utilisateur.id);

  req.flash('success', 'Mot de passe mis à jour. Vous pouvez vous connecter.');
  return res.redirect('/login');
};

exports.logout = async (req, res) => {
  const userId = req.session?.user?.id;
  if (userId) {
    await activityLog.log(req, 'DECONNEXION', null, userId);
  }
  req.session.destroy((err) => {
    if (err) console.error('Erreur déconnexion:', err);
    res.clearCookie('smartschool.sid');
    res.redirect('/login');
  });
};
