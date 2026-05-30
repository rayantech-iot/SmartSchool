// ============================================================
// services/accountInvitationService.js — Création compte + invitation
// ============================================================
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Utilisateur, Parent, Eleve } = require('../models');
const passwordResetService = require('./passwordResetService');
const mailService = require('./mailService');

const ROLE_LABELS = {
  eleve: 'Élève',
  parent: 'Parent',
  professeur: 'Professeur',
  admin: 'Administrateur'
};

async function genererMotDePasseAleatoire() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Envoie l'email d'activation (lien 48 h pour définir le mot de passe)
 */
async function envoyerInvitation(req, utilisateur, typeCompte = null) {
  const role = typeCompte || utilisateur.type;
  const { token } = await passwordResetService.creerLienActivation(utilisateur.id);
  const url = passwordResetService.construireUrl(req, token);
  await mailService.envoyerActivation({
    to: utilisateur.email,
    prenom: utilisateur.prenom,
    url,
    roleLabel: ROLE_LABELS[role] || role
  });
  return url;
}

/**
 * Crée un compte parent lié à un élève (email seul) et envoie l'invitation
 */
async function creerParentPourEleve(req, { eleveId, email, lien, nomEleve }) {
  const emailNorm = email.toLowerCase().trim();
  if (!emailNorm) return null;

  let utilisateur = await Utilisateur.findOne({ where: { email: emailNorm } });

  if (utilisateur) {
    if (utilisateur.type !== 'parent') {
      throw new Error(`L'email ${emailNorm} est déjà utilisé par un compte ${utilisateur.type}.`);
    }
    const lienExiste = await Parent.findOne({
      where: { utilisateur_id: utilisateur.id, eleve_id: eleveId }
    });
    if (!lienExiste) {
      await Parent.create({
        utilisateur_id: utilisateur.id,
        eleve_id: eleveId,
        lien: lien || 'tuteur'
      });
    }
    const url = await envoyerInvitation(req, utilisateur, 'parent');
    return { utilisateur, url, existant: true };
  }

  const localPart = emailNorm.split('@')[0].replace(/[._]/g, ' ');
  const hash = await bcrypt.hash(await genererMotDePasseAleatoire(), 12);

  utilisateur = await Utilisateur.create({
    nom: nomEleve || 'Parent',
    prenom: localPart.charAt(0).toUpperCase() + localPart.slice(1),
    email: emailNorm,
    mot_de_passe: hash,
    type: 'parent',
    statut: 'actif',
    doit_changer_mot_de_passe: true
  });

  await Parent.create({
    utilisateur_id: utilisateur.id,
    eleve_id: eleveId,
    lien: lien || 'tuteur'
  });

  const url = await envoyerInvitation(req, utilisateur, 'parent');
  return { utilisateur, url, existant: false };
}

/**
 * Crée un compte avec mot de passe aléatoire + invitation par email
 */
async function creerCompteAvecInvitation(req, { nom, prenom, email, type, telephone, statut = 'actif' }) {
  const hash = await bcrypt.hash(await genererMotDePasseAleatoire(), 12);
  const utilisateur = await Utilisateur.create({
    nom,
    prenom,
    email: email.toLowerCase().trim(),
    mot_de_passe: hash,
    type,
    telephone: telephone || null,
    statut,
    doit_changer_mot_de_passe: true
  });
  const url = await envoyerInvitation(req, utilisateur, type);
  return { utilisateur, url };
}

module.exports = {
  ROLE_LABELS,
  envoyerInvitation,
  creerParentPourEleve,
  creerCompteAvecInvitation,
  genererMotDePasseAleatoire
};
