// ============================================================
// services/passwordResetService.js — Lien de réinitialisation (1h)
// ============================================================
const crypto = require('crypto');
const { PasswordResetToken, Utilisateur } = require('../models');

const DUREE_MS = 60 * 60 * 1000; // 1 heure
const DUREE_ACTIVATION_MS = 48 * 60 * 60 * 1000; // 48 heures — première connexion

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

/**
 * Crée un token de réinitialisation pour un utilisateur (1 h)
 */
async function creerLienReinitialisation(utilisateurId) {
  return creerToken(utilisateurId, DUREE_MS);
}

/**
 * Crée un token d'activation / première connexion (48 h)
 */
async function creerLienActivation(utilisateurId) {
  return creerToken(utilisateurId, DUREE_ACTIVATION_MS);
}

/**
 * Valide un token et retourne l'utilisateur associé
 */
async function validerToken(token) {
  const enregistrement = await PasswordResetToken.findOne({
    where: { token, utilise: false },
    include: [{ model: Utilisateur, as: 'utilisateur' }]
  });

  if (!enregistrement) return null;
  if (new Date() > enregistrement.expires_at) {
    await enregistrement.destroy();
    return null;
  }

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
