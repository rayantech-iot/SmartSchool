// ============================================================
// controllers/parentController.js — Dashboard et vues parent
// ============================================================
const { Parent, Eleve, Classe, Note, Absence, Devoir, Bulletin, Message, Matiere, Utilisateur } = require('../models');
const { redirectToLogin } = require('../middlewares/authMiddleware');
const { getCoefficientPourEleve } = require('../services/matiereHelper');

/**
 * Dashboard principal du parent
 * Hérite des données de l'élève + fonctionnalités supplémentaires
 */
exports.dashboard = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      where: { utilisateur_id: req.session.user.id },
      include: [{
        model: Eleve, as: 'enfant',
        include: [
          { model: Classe, as: 'classe' },
          { model: Utilisateur, as: 'utilisateur' }
        ]
      }]
    });

    if (!parent || !parent.enfant) {
      return res.render('parent/dashboard', {
        titre: 'Espace Parent — SmartSchool',
        sansEnfant: true,
        user: req.session.user
      });
    }

    const enfant = parent.enfant;

    // Notes récentes de l'enfant
    const notesRecentes = await Note.findAll({
      where: { eleve_id: enfant.id },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['date_evaluation', 'DESC']],
      limit: 5
    });

    // Absences non justifiées
    const absencesNonJustifiees = await Absence.findAll({
      where: { eleve_id: enfant.id, justifiee: false },
      order: [['date', 'DESC']],
      limit: 5
    });

    // Devoirs à venir
    const devoirsAVenir = await Devoir.findAll({
      where: { classe_id: enfant.classe_id, statut: 'publié' },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['date_limite', 'ASC']],
      limit: 5
    });

    // Messagerie
    const messagesNonLus = await Message.count({
      where: { destinataire_id: req.session.user.id, lu: false }
    });

    // Moyenne générale de l'enfant
    const toutesNotes = await Note.findAll({
      where: { eleve_id: enfant.id },
      include: [{ model: Matiere, as: 'matiere' }]
    });
    let moyenneGenerale = null;
    if (toutesNotes.length > 0) {
      let somme = 0;
      let totalCoeff = 0;
      for (const n of toutesNotes) {
        const coeff = await getCoefficientPourEleve(enfant.id, n.matiere_id, 1);
        somme += parseFloat(n.valeur) * coeff;
        totalCoeff += coeff;
      }
      moyenneGenerale = totalCoeff > 0 ? (somme / totalCoeff).toFixed(2) : null;
    }

    res.render('parent/dashboard', {
      titre: 'Espace parent — SmartSchool',
      parent, enfant, notesRecentes,
      absencesNonJustifiees, devoirsAVenir,
      messagesNonLus, moyenneGenerale,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur dashboard parent:', err);
    return redirectToLogin(req, res, 'Erreur lors du chargement du tableau de bord.');
  }
};

/**
 * Liste des bulletins de l'enfant (vue parent)
 */
exports.bulletins = async (req, res) => {
  try {
    const parent = await Parent.findOne({ where: { utilisateur_id: req.session.user.id } });
    if (!parent) {
      return redirectToLogin(req, res, 'Profil parent introuvable.');
    }

    const bulletins = await Bulletin.findAll({
      where: { eleve_id: parent.eleve_id },
      order: [['date_generation', 'DESC']]
    });

    res.render('parent/bulletin', {
      titre: 'Bulletins de mon enfant — SmartSchool',
      bulletins,
      bulletin: null,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur liste bulletins parent:', err);
    req.flash('error', 'Erreur lors du chargement des bulletins.');
    res.redirect('/parent/dashboard');
  }
};
