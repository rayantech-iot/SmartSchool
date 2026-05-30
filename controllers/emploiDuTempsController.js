// ============================================================
// controllers/emploiDuTempsController.js
// ============================================================
const { EmploiDuTemps, Seance, Classe, Matiere, Professeur, Eleve, Utilisateur } = require('../models');
const timetableService = require('../services/timetableService');
const activityLog = require('../services/activityLogService');
const { PAUSES, CRENEAUX_HORAIRES, construireTimelineJour } = require('../config/schoolConfig');

exports.show = async (req, res) => {
  try {
    let emploiDuTemps = null;
    let seances = [];
    const role = req.session.user.type;

    if (role === 'professeur') {
      const professeur = await Professeur.findOne({ where: { utilisateur_id: req.session.user.id } });
      if (!professeur) {
        req.flash('error', 'Profil professeur introuvable.');
        return res.redirect(`/${role}/dashboard`);
      }
      seances = await Seance.findAll({
        where: { professeur_id: professeur.id },
        include: [
          { model: Matiere, as: 'matiere' },
          { model: EmploiDuTemps, as: 'emploiDuTemps', include: [{ model: Classe, as: 'classe' }] }
        ],
        order: [['jour', 'ASC'], ['heure_debut', 'ASC']]
      });
    } else if (role === 'eleve') {
      const eleve = await Eleve.findOne({
        where: { utilisateur_id: req.session.user.id },
        include: [{ model: Classe, as: 'classe' }]
      });
      if (eleve?.classe_id) {
        emploiDuTemps = await EmploiDuTemps.findOne({ where: { classe_id: eleve.classe_id, actif: true } });
        if (emploiDuTemps) {
          seances = await Seance.findAll({
            where: { emploi_du_temps_id: emploiDuTemps.id },
            include: [
              { model: Matiere, as: 'matiere' },
              { model: Professeur, as: 'professeur', include: [{ model: Utilisateur, as: 'utilisateur' }] }
            ],
            order: [['jour', 'ASC'], ['heure_debut', 'ASC']]
          });
        }
      }
    } else if (role === 'parent') {
      const { Parent } = require('../models');
      const parent = await Parent.findOne({
        where: { utilisateur_id: req.session.user.id },
        include: [{ model: Eleve, as: 'enfant' }]
      });
      if (parent?.enfant?.classe_id) {
        emploiDuTemps = await EmploiDuTemps.findOne({ where: { classe_id: parent.enfant.classe_id, actif: true } });
        if (emploiDuTemps) {
          seances = await Seance.findAll({
            where: { emploi_du_temps_id: emploiDuTemps.id },
            include: [
              { model: Matiere, as: 'matiere' },
              { model: Professeur, as: 'professeur', include: [{ model: Utilisateur, as: 'utilisateur' }] }
            ],
            order: [['jour', 'ASC'], ['heure_debut', 'ASC']]
          });
        }
      }
    }

    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const planning = {};
    jours.forEach((j) => { planning[j] = []; });
    seances.forEach((s) => { if (planning[s.jour]) planning[s.jour].push(s); });

    res.render(role === 'professeur' ? 'professeur/emploiDuTemps' : 'eleve/emploiDuTemps', {
      titre: 'Emploi du temps — SmartSchool',
      planning,
      jours,
      emploiDuTemps,
      pauses: PAUSES,
      creneaux: CRENEAUX_HORAIRES,
      construireTimelineJour,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur emploi du temps:', err);
    req.flash('error', "Erreur lors du chargement de l'emploi du temps.");
    res.redirect('back');
  }
};

exports.addSeance = async (req, res) => {
  try {
    const { emploi_du_temps_id, jour, heure_debut, heure_fin, salle, matiere_id, professeur_id } = req.body;
    const erreurs = await timetableService.validerSeance({
      emploi_du_temps_id, jour, heure_debut, heure_fin, matiere_id, professeur_id, salle
    });
    if (erreurs.length) {
      req.flash('error', erreurs.join(' '));
      return res.redirect('/admin/emploiDuTemps');
    }

    const emploi = await EmploiDuTemps.findByPk(emploi_du_temps_id, { include: [{ model: Classe, as: 'classe' }] });
    await Seance.create({
      emploi_du_temps_id, jour, heure_debut, heure_fin,
      salle: salle || emploi?.classe?.salle || null,
      matiere_id, professeur_id
    });

    await activityLog.log(req, 'CREATION_SEANCE', { emploi_du_temps_id, jour, matiere_id, professeur_id });
    req.flash('success', 'Séance ajoutée avec succès.');
    return res.redirect('/admin/emploiDuTemps?classe_id=' + (emploi?.classe_id || ''));
  } catch (err) {
    req.flash('error', "Erreur lors de l'ajout de la séance.");
    return res.redirect('/admin/emploiDuTemps');
  }
};

exports.updateSeance = async (req, res) => {
  try {
    const seance = await Seance.findByPk(req.params.id);
    if (!seance) {
      req.flash('error', 'Séance introuvable.');
      return res.redirect('/admin/emploiDuTemps');
    }

    const { jour, heure_debut, heure_fin, salle, matiere_id, professeur_id } = req.body;
    const erreurs = await timetableService.validerSeance({
      emploi_du_temps_id: seance.emploi_du_temps_id,
      jour, heure_debut, heure_fin, matiere_id, professeur_id, salle,
      excludeSeanceId: seance.id
    });
    if (erreurs.length) {
      req.flash('error', erreurs.join(' '));
      return res.redirect('/admin/emploiDuTemps');
    }

    await seance.update({ jour, heure_debut, heure_fin, salle, matiere_id, professeur_id });
    await activityLog.log(req, 'MODIFICATION_SEANCE', { id: seance.id });
    req.flash('success', 'Séance modifiée.');
    return res.redirect('/admin/emploiDuTemps');
  } catch (err) {
    req.flash('error', 'Erreur lors de la modification.');
    return res.redirect('/admin/emploiDuTemps');
  }
};

exports.deleteSeance = async (req, res) => {
  try {
    await Seance.destroy({ where: { id: req.params.id } });
    await activityLog.log(req, 'SUPPRESSION_SEANCE', { id: req.params.id });
    req.flash('success', 'Séance supprimée.');
    return res.redirect('/admin/emploiDuTemps');
  } catch (err) {
    req.flash('error', 'Erreur lors de la suppression.');
    return res.redirect('/admin/emploiDuTemps');
  }
};
