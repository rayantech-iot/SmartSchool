// ============================================================
// controllers/professeurController.js — Dashboard et vues professeur
// ============================================================
const { Professeur, Classe, Eleve, Devoir, Note, Seance, EmploiDuTemps, Message, Matiere, Utilisateur } = require('../models');
const { redirectToLogin } = require('../middlewares/authMiddleware');

/**
 * Dashboard principal du professeur
 * Affiche : ses classes, l'emploi du temps du jour, les devoirs récents, messages non lus
 */
exports.dashboard = async (req, res) => {
  try {
    const professeur = await Professeur.findOne({
      where: { utilisateur_id: req.session.user.id },
      include: [{ model: Utilisateur, as: 'utilisateur' }]
    });

    if (!professeur) {
      return redirectToLogin(req, res, 'Profil professeur introuvable.');
    }

    const classes = await professeur.getClasses();
    const matieres = await professeur.getMatieres();

    // Séances du jour
    const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const jourAujourdhui = joursSemaine[new Date().getDay()];
    const seancesAujourdhui = await Seance.findAll({
      where: { professeur_id: professeur.id, jour: jourAujourdhui },
      include: [
        { model: Matiere, as: 'matiere' },
        { model: EmploiDuTemps, as: 'emploiDuTemps', include: [{ model: Classe, as: 'classe' }] }
      ],
      order: [['heure_debut', 'ASC']]
    });

    // Devoirs récents publiés
    const devoirsRecents = await Devoir.findAll({
      where: { professeur_id: professeur.id },
      include: [{ model: Classe, as: 'classe' }, { model: Matiere, as: 'matiere' }],
      order: [['date_publication', 'DESC']],
      limit: 5
    });

    // Nombre de messages non lus
    const messagesNonLus = await Message.count({
      where: { destinataire_id: req.session.user.id, lu: false }
    });

    // Nombre total d'élèves dans les classes du professeur
    let totalEleves = 0;
    for (const classe of classes) {
      const count = await Eleve.count({ where: { classe_id: classe.id } });
      totalEleves += count;
    }

    res.render('professeur/dashboard', {
      titre: 'Tableau de bord — SmartSchool',
      professeur, classes, matieres,
      seancesAujourdhui, devoirsRecents,
      messagesNonLus, totalEleves,
      jourAujourdhui, user: req.session.user
    });
  } catch (err) {
    console.error('Erreur dashboard professeur:', err);
    return redirectToLogin(req, res, 'Erreur lors du chargement du tableau de bord.');
  }
};
