// ============================================================
// services/notificationService.js — Création des alertes in-app
// ============================================================
const { Notification, Parent, Eleve } = require('../models');

/**
 * Crée une notification pour un utilisateur
 */
async function notifier(utilisateurId, { titre, contenu, type, lien }) {
  if (!utilisateurId) return null;
  return Notification.create({
    utilisateur_id: utilisateurId,
    titre,
    contenu,
    type: type || 'systeme',
    lien: lien || null,
    lu: false
  });
}

/**
 * Notifie tous les parents d'un élève
 */
async function notifierParentsEleve(eleveId, payload) {
  const parents = await Parent.findAll({ where: { eleve_id: eleveId } });
  for (const p of parents) {
    await notifier(p.utilisateur_id, payload);
  }
}

/**
 * Notifie l'élève et ses parents
 */
async function notifierEleveEtParents(eleveId, payload) {
  const eleve = await Eleve.findByPk(eleveId);
  if (eleve) {
    await notifier(eleve.utilisateur_id, payload);
  }
  await notifierParentsEleve(eleveId, payload);
}

module.exports = { notifier, notifierParentsEleve, notifierEleveEtParents };
