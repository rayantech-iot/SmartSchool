// ============================================================
// controllers/registrationController.js — Inscription publique
// ============================================================
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { Utilisateur, Eleve, Parent } = require('../models');
const accountInvitationService = require('../services/accountInvitationService');
const liaisonService = require('../services/liaisonService');
const matriculeService = require('../services/matriculeService');
const mailService = require('../services/mailService');
const activityLog = require('../services/activityLogService');
const { aAuMoinsAns } = require('../utils/age');

exports.showInscription = (req, res) => {
  if (req.session?.user) {
    return res.redirect(`/${req.session.user.type}/dashboard`);
  }
  res.render('auth/inscription', {
    titre: 'Inscription — SmartSchool',
    layout: 'layouts/auth'
  });
};

exports.showInscriptionEleve = (req, res) => {
  res.render('auth/inscriptionEleve', {
    titre: 'Inscription élève — SmartSchool',
    layout: 'layouts/auth'
  });
};

exports.showInscriptionParent = (req, res) => {
  res.render('auth/inscriptionParent', {
    titre: 'Inscription parent — SmartSchool',
    layout: 'layouts/auth'
  });
};

/** Inscription élève : matricule + date naissance OU nouvelle demande */
exports.inscriptionEleve = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect('/inscription/eleve');
  }

  try {
    const { nom, prenom, email, telephone, matricule, date_naissance } = req.body;
    const emailNorm = email.toLowerCase().trim();

    if (!aAuMoinsAns(date_naissance, 6)) {
      req.flash('error', 'L\'élève doit avoir au moins 6 ans pour s\'inscrire.');
      return res.redirect('/inscription/eleve');
    }

    const emailPris = await Utilisateur.findOne({ where: { email: emailNorm } });
    if (emailPris) {
      req.flash('error', 'Cet email est déjà utilisé.');
      return res.redirect('/inscription/eleve');
    }

    const matriculeNorm = (matricule || '').trim().toUpperCase();
    const eleveExistant = matriculeNorm
      ? await liaisonService.trouverEleveParIdentite(matriculeNorm, date_naissance)
      : null;

    if (eleveExistant) {
      req.flash('info', 'Un dossier existe déjà pour cet élève. L\'école vous a envoyé un email d\'activation. Sinon, contactez l\'administration.');
      return res.redirect('/login');
    }

    const matriculeFinal = matriculeNorm || await matriculeService.genererMatricule();

    const matriculePris = await Eleve.findOne({ where: { matricule: matriculeFinal } });
    if (matriculePris) {
      req.flash('error', 'Ce matricule est déjà utilisé.');
      return res.redirect('/inscription/eleve');
    }

    const { utilisateur } = await accountInvitationService.creerCompteAvecInvitation(req, {
      nom,
      prenom,
      email: emailNorm,
      type: 'eleve',
      telephone,
      statut: 'en_attente'
    });

    await Eleve.create({
      utilisateur_id: utilisateur.id,
      matricule: matriculeFinal,
      date_naissance,
      classe_id: null
    });

    await mailService.envoyerInscriptionEnAttente({ to: emailNorm, prenom });

    await activityLog.log(req, 'INSCRIPTION_ELEVE', { email: emailNorm, matricule: matriculeFinal });

    req.flash('success', 'Inscription enregistrée. L\'administration validera votre dossier puis vous recevrez un email pour créer votre mot de passe.');
    return res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de l\'inscription.');
    return res.redirect('/inscription/eleve');
  }
};

/** Inscription parent + liaison enfant */
exports.inscriptionParent = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect('/inscription/parent');
  }

  try {
    const {
      nom, prenom, email, telephone,
      matricule, date_naissance_enfant, lien
    } = req.body;
    const emailNorm = email.toLowerCase().trim();

    let utilisateur = await Utilisateur.findOne({ where: { email: emailNorm } });

    if (utilisateur) {
      if (utilisateur.type !== 'parent') {
        req.flash('error', 'Cet email est déjà utilisé par un autre type de compte.');
        return res.redirect('/inscription/parent');
      }
      await accountInvitationService.envoyerInvitation(req, utilisateur, 'parent');
    } else {
      const result = await accountInvitationService.creerCompteAvecInvitation(req, {
        nom,
        prenom,
        email: emailNorm,
        type: 'parent',
        telephone,
        statut: 'actif'
      });
      utilisateur = result.utilisateur;
    }

    const liaison = await liaisonService.demanderLiaison({
      utilisateurId: utilisateur.id,
      email: emailNorm,
      matricule,
      dateNaissance: date_naissance_enfant,
      lien: lien || 'tuteur'
    });

    if (!liaison.ok) {
      req.flash('error', liaison.erreur);
      return res.redirect('/inscription/parent');
    }

    await activityLog.log(req, 'INSCRIPTION_PARENT', { email: emailNorm, auto: liaison.auto });

    req.flash('success', liaison.auto
      ? 'Compte créé et enfant lié ! Consultez votre email pour définir votre mot de passe.'
      : `${liaison.message} Consultez aussi votre email pour activer votre compte.`);
    return res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de l\'inscription.');
    return res.redirect('/inscription/parent');
  }
};

/** Parent connecté : lier un autre enfant */
exports.lierEnfant = async (req, res) => {
  try {
    const { matricule, date_naissance, lien } = req.body;
    const utilisateur = await Utilisateur.findByPk(req.session.user.id);
    if (!utilisateur || utilisateur.type !== 'parent') {
      req.flash('error', 'Accès refusé.');
      return res.redirect('/parent/dashboard');
    }

    const liaison = await liaisonService.demanderLiaison({
      utilisateurId: utilisateur.id,
      email: utilisateur.email,
      matricule,
      dateNaissance: date_naissance,
      lien: lien || 'tuteur'
    });

    req.flash(liaison.ok ? 'success' : 'error', liaison.ok ? liaison.message : liaison.erreur);
    return res.redirect('/parent/dashboard');
  } catch (err) {
    req.flash('error', 'Erreur lors de la demande de liaison.');
    return res.redirect('/parent/dashboard');
  }
};
