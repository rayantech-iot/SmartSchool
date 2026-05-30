// ============================================================
// controllers/presenceController.js — Gestion des présences
// ============================================================
const { Op } = require('sequelize');
const { Presence, Absence, Eleve, Seance, Classe, Matiere, EmploiDuTemps, Utilisateur } = require('../models');
const { getProfesseurParUtilisateur, getClassesDuProfesseur } = require('../services/professeurHelper');
const { jourScolaireDepuisDate } = require('../utils/dateSchool');

exports.index = async (req, res) => {
  try {
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    if (!professeur) {
      req.flash('error', 'Profil professeur introuvable.');
      return res.redirect('/professeur/dashboard');
    }

    const classes = await getClassesDuProfesseur(professeur);
    const { classe_id, date } = req.query;
    const dateAppel = date || new Date().toISOString().split('T')[0];

    let eleves = [];
    let presences = [];
    let seances = [];

    if (classe_id && date) {
      const idsClassesProf = classes.map((c) => c.id);
      if (!idsClassesProf.includes(parseInt(classe_id, 10))) {
        req.flash('error', 'Cette classe ne vous est pas affectée.');
        return res.redirect('/professeur/presences');
      }

      const classe = await Classe.findByPk(classe_id, {
        include: [{
          model: Eleve,
          as: 'eleves',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        }]
      });
      eleves = classe ? classe.eleves : [];

      const jour = jourScolaireDepuisDate(dateAppel);
      const emplois = await EmploiDuTemps.findAll({
        where: { classe_id: parseInt(classe_id, 10), actif: true },
        attributes: ['id']
      });
      const edtIds = emplois.map((e) => e.id);

      if (jour && edtIds.length) {
        seances = await Seance.findAll({
          where: {
            professeur_id: professeur.id,
            emploi_du_temps_id: { [Op.in]: edtIds },
            jour
          },
          include: [{ model: Matiere, as: 'matiere' }],
          order: [['heure_debut', 'ASC']]
        });
      }

      presences = await Presence.findAll({
        where: { date: dateAppel, professeur_id: professeur.id },
        include: [{ model: Eleve, as: 'eleve' }]
      });
    }

    res.render('professeur/presences', {
      titre: 'Gestion des présences — SmartSchool',
      classes: classes || [],
      eleves,
      presences,
      seances,
      filtres: { classe_id, date: dateAppel },
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur présences:', err);
    req.flash('error', 'Erreur lors du chargement des présences.');
    return res.redirect('/professeur/dashboard');
  }
};

exports.store = async (req, res) => {
  try {
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    if (!professeur) {
      req.flash('error', 'Profil professeur introuvable.');
      return res.redirect('/professeur/presences');
    }

    const { presences, date, seance_id } = req.body;
    const presencesArray = Array.isArray(presences) ? presences : [presences];

    for (const p of presencesArray) {
      const existante = await Presence.findOne({
        where: { eleve_id: p.eleve_id, date, seance_id: seance_id || null }
      });

      if (existante) {
        await existante.update({ statut: p.statut, observation: p.observation });
        if (p.statut === 'absent') {
          const absExistante = await Absence.findOne({ where: { presence_id: existante.id } });
          if (!absExistante) {
            await Absence.create({
              eleve_id: p.eleve_id,
              date,
              presence_id: existante.id,
              seance_id: seance_id || null,
              justifiee: false
            });
            const { notifierParentsEleve } = require('../services/notificationService');
            await notifierParentsEleve(p.eleve_id, {
              titre: 'Absence enregistrée',
              contenu: `Absence enregistrée le ${date}.`,
              type: 'absence',
              lien: '/parent/absences'
            });
          }
        }
      } else {
        const nouvellePresence = await Presence.create({
          eleve_id: p.eleve_id,
          statut: p.statut,
          date,
          seance_id: seance_id || null,
          observation: p.observation,
          professeur_id: professeur.id
        });

        if (p.statut === 'absent') {
          await Absence.create({
            eleve_id: p.eleve_id,
            date,
            presence_id: nouvellePresence.id,
            seance_id: seance_id || null,
            justifiee: false
          });
          const { notifierParentsEleve } = require('../services/notificationService');
          await notifierParentsEleve(p.eleve_id, {
            titre: 'Absence enregistrée',
            contenu: `Une absence a été enregistrée le ${date}.`,
            type: 'absence',
            lien: '/parent/absences'
          });
        }
      }
    }

    req.flash('success', 'Présences enregistrées avec succès.');
    return res.redirect('back');
  } catch (err) {
    console.error('Erreur enregistrement présences:', err);
    req.flash('error', "Erreur lors de l'enregistrement des présences.");
    return res.redirect('back');
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    const { classe_id, date } = req.query;

    if (!classe_id || !date) {
      req.flash('error', 'Classe et date requis pour l\'export.');
      return res.redirect('/professeur/presences');
    }

    const presences = await Presence.findAll({
      where: { date, professeur_id: professeur.id },
      include: [{
        model: Eleve,
        as: 'eleve',
        include: [{ model: Utilisateur, as: 'utilisateur' }],
        where: { classe_id }
      }]
    });

    const lignes = ['Nom;Prénom;Statut;Observation;Date'];
    for (const p of presences) {
      if (!p.eleve || !p.eleve.utilisateur) continue;
      const nom = p.eleve.utilisateur.nom;
      const prenom = p.eleve.utilisateur.prenom;
      const obs = (p.observation || '').replace(/;/g, ',');
      lignes.push(`${nom};${prenom};${p.statut};${obs};${date}`);
    }

    const csv = '\uFEFF' + lignes.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="presences_${date}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('Erreur export présences:', err);
    req.flash('error', "Erreur lors de l'export.");
    return res.redirect('back');
  }
};
