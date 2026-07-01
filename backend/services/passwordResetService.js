


const crypto = require('crypto');
const { PasswordResetToken, Utilisateur } = require('../models');

const DUREE_MS = 60 * 60 * 1000; 
const DUREE_ACTIVATION_MS = 48 * 60 * 60 * 1000; 

async function creerToken(utilisateurId, dureeMs) {
  await PasswordResetToken.destroy({ where: { utilisateur_id: utilisateurId } });
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + dureeMs);
  await PasswordResetToken.create({
    utilisateur_id: utilisateurId,
    token,
    expires_at: expiresAt,
    utilise: false
  });
  return { token, expiresAt };
}


async function creerLienReinitialisation(utilisateurId) {
  return creerToken(utilisateurId, DUREE_MS);
}


async function creerLienActivation(utilisateurId) {
  return creerToken(utilisateurId, DUREE_ACTIVATION_MS);
}


async function validerToken(token) {
  const db = require('../config/db');
  const enregistrement = await db.getOne(
    `SELECT prt.*, u.id AS u_id, u.nom AS u_nom, u.prenom AS u_prenom,
            u.email AS u_email, u.type AS u_type
     FROM password_reset_tokens prt
     JOIN utilisateurs u ON u.id = prt.utilisateur_id
     WHERE prt.token = ? AND prt.utilise = false`,
    [token]
  );

  if (!enregistrement) return null;
  if (new Date() > enregistrement.expires_at) {
    await PasswordResetToken.destroy({ where: { id: enregistrement.id } });
    return null;
  }

  enregistrement.utilisateur = {
    id: enregistrement.u_id,
    nom: enregistrement.u_nom,
    prenom: enregistrement.u_prenom,
    email: enregistrement.u_email,
    type: enregistrement.u_type
  };

  return enregistrement;
}

async function marquerUtilise(token) {
  await PasswordResetToken.update({ utilise: true }, { where: { token } });
}

function construireUrl(req, token) {
  const base = process.env.APP_URL || `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/auth/reinitialiser/${token}`;
}

module.exports = {
  DUREE_MS,
  DUREE_ACTIVATION_MS,
  creerLienReinitialisation,
  creerLienActivation,
  validerToken,
  marquerUtilise,
  construireUrl
};
