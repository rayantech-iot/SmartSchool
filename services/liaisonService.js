// ============================================================
// services/liaisonService.js — Liaison parent ↔ élève
// ============================================================
const { Eleve, Parent, DemandeLiaison, Utilisateur } = require('../models');
const mailService = require('./mailService');

async function trouverEleveParIdentite(matricule, dateNaissance) {
  return Eleve.findOne({
    where: {
      matricule: matricule.trim().toUpperCase(),
      date_naissance: dateNaissance
    },
    include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }]
  });
}

async function lierParentAEleve(utilisateurId, eleveId, lien = 'tuteur') {
  const existant = await Parent.findOne({
    where: { utilisateur_id: utilisateurId, eleve_id: eleveId }
  });
  if (existant) return existant;
  return Parent.create({
    utilisateur_id: utilisateurId,
    eleve_id: eleveId,
    lien
  });
}

async function demanderLiaison({ utilisateurId, email, matricule, dateNaissance, lien }) {
  const eleve = await trouverEleveParIdentite(matricule, dateNaissance);
  if (!eleve) {
    return { ok: false, erreur: 'Aucun élève trouvé avec ce matricule et cette date de naissance.' };
  }

  const emailNorm = email.toLowerCase().trim();

  if (utilisateurId) {
    const dejaLie = await Parent.findOne({
      where: { utilisateur_id: utilisateurId, eleve_id: eleve.id }
    });
    if (dejaLie) {
      return { ok: true, auto: true, message: 'Vous êtes déjà lié à cet élève.' };
    }

    await lierParentAEleve(utilisateurId, eleve.id, lien);
    const user = await Utilisateur.findByPk(utilisateurId);
    const nomEleve = eleve.utilisateur
      ? `${eleve.utilisateur.prenom} ${eleve.utilisateur.nom}`
      : eleve.matricule;
    if (user) {
      await mailService.envoyerLiaisonValidee({
        to: user.email,
        prenom: user.prenom,
        nomEleve
      });
    }
    return { ok: true, auto: true, message: 'Liaison établie avec succès avec votre enfant.' };
  }

  const demandeExistante = await DemandeLiaison.findOne({
    where: { email: emailNorm, eleve_id: eleve.id, statut: 'en_attente' }
  });
  if (demandeExistante) {
    return { ok: false, erreur: 'Une demande de liaison est déjà en cours pour cet élève.' };
  }

  await DemandeLiaison.create({
    utilisateur_id: null,
    email: emailNorm,
    eleve_id: eleve.id,
    matricule: matricule.trim().toUpperCase(),
    date_naissance_eleve: dateNaissance,
    lien: lien || 'tuteur',
    statut: 'en_attente'
  });

  return {
    ok: true,
    auto: false,
    message: 'Demande enregistrée. L\'administration va la valider sous peu.'
  };
}

async function validerDemande(demandeId) {
  const demande = await DemandeLiaison.findByPk(demandeId, {
    include: [{ model: Eleve, as: 'eleve', include: [{ model: Utilisateur, as: 'utilisateur' }] }]
  });
  if (!demande || demande.statut !== 'en_attente') return null;

  let utilisateur = demande.utilisateur_id
    ? await Utilisateur.findByPk(demande.utilisateur_id)
    : await Utilisateur.findOne({ where: { email: demande.email, type: 'parent' } });

  if (!utilisateur) {
    return { ok: false, erreur: 'Compte parent introuvable. Le parent doit d\'abord s\'inscrire.' };
  }

  await lierParentAEleve(utilisateur.id, demande.eleve_id, demande.lien);
  await demande.update({ statut: 'valide', utilisateur_id: utilisateur.id });

  const nomEleve = demande.eleve?.utilisateur
    ? `${demande.eleve.utilisateur.prenom} ${demande.eleve.utilisateur.nom}`
    : demande.matricule;

  await mailService.envoyerLiaisonValidee({
    to: utilisateur.email,
    prenom: utilisateur.prenom,
    nomEleve
  });

  return { ok: true, demande };
}

async function refuserDemande(demandeId, messageAdmin) {
  const demande = await DemandeLiaison.findByPk(demandeId);
  if (!demande || demande.statut !== 'en_attente') return null;
  await demande.update({ statut: 'refuse', message_admin: messageAdmin || null });
  return demande;
}

module.exports = {
  trouverEleveParIdentite,
  lierParentAEleve,
  demanderLiaison,
  validerDemande,
  refuserDemande
};
