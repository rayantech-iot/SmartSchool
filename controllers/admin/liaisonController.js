// controllers/admin/liaisonController.js — Validation demandes parent ↔ élève
const { DemandeLiaison, Eleve, Utilisateur, Classe } = require('../../models');
const liaisonService = require('../../services/liaisonService');
const accountInvitationService = require('../../services/accountInvitationService');
const activityLog = require('../../services/activityLogService');
const { getAnneeScolaireCourante } = require('../../services/schoolYearService');

exports.index = async (req, res) => {
  try {
    const demandes = await DemandeLiaison.findAll({
      where: { statut: 'en_attente' },
      include: [
        { model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom', 'email'] },
        {
          model: Eleve,
          as: 'eleve',
          include: [{ model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'prenom'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const inscriptionsEleves = await Utilisateur.findAll({
      where: { type: 'eleve', statut: 'en_attente' },
      include: [{
        model: Eleve,
        as: 'profilEleve',
        include: [{ model: Classe, as: 'classe' }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const classes = await Classe.findAll({
      where: { annee_scolaire: getAnneeScolaireCourante() },
      order: [['niveau', 'ASC'], ['nom', 'ASC']]
    });

    res.render('admin/demandes', {
      titre: 'Demandes & inscriptions — SmartSchool',
      demandes,
      inscriptionsEleves,
      classes,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur chargement des demandes.');
    res.redirect('/admin/dashboard');
  }
};

exports.validerLiaison = async (req, res) => {
  try {
    const result = await liaisonService.validerDemande(parseInt(req.params.id, 10));
    if (!result?.ok) {
      req.flash('error', result?.erreur || 'Demande introuvable.');
    } else {
      await activityLog.log(req, 'VALIDATION_LIAISON', { demandeId: req.params.id });
      req.flash('success', 'Liaison parent ↔ élève validée. Email envoyé au parent.');
    }
    return res.redirect('/admin/demandes');
  } catch (err) {
    req.flash('error', 'Erreur lors de la validation.');
    return res.redirect('/admin/demandes');
  }
};

exports.refuserLiaison = async (req, res) => {
  try {
    await liaisonService.refuserDemande(parseInt(req.params.id, 10), req.body.message);
    await activityLog.log(req, 'REFUS_LIAISON', { demandeId: req.params.id });
    req.flash('success', 'Demande refusée.');
    return res.redirect('/admin/demandes');
  } catch (err) {
    req.flash('error', 'Erreur.');
    return res.redirect('/admin/demandes');
  }
};

exports.activerEleve = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id, {
      include: [{ model: Eleve, as: 'profilEleve' }]
    });
    if (!utilisateur || utilisateur.type !== 'eleve') {
      req.flash('error', 'Élève introuvable.');
      return res.redirect('/admin/demandes');
    }

    const { classe_id } = req.body;
    if (classe_id && utilisateur.profilEleve) {
      await utilisateur.profilEleve.update({ classe_id: parseInt(classe_id, 10) });
    }

    await utilisateur.update({ statut: 'actif' });
    await accountInvitationService.envoyerInvitation(req, utilisateur, 'eleve');
    await activityLog.log(req, 'ACTIVATION_INSCRIPTION_ELEVE', { id: utilisateur.id });
    req.flash('success', `Compte de ${utilisateur.prenom} ${utilisateur.nom} activé. Email d'activation envoyé.`);
    return res.redirect('/admin/demandes');
  } catch (err) {
    req.flash('error', 'Erreur activation.');
    return res.redirect('/admin/demandes');
  }
};

exports.refuserEleve = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (utilisateur) await utilisateur.update({ statut: 'inactif' });
    req.flash('success', 'Inscription élève refusée.');
    return res.redirect('/admin/demandes');
  } catch (err) {
    req.flash('error', 'Erreur.');
    return res.redirect('/admin/demandes');
  }
};
