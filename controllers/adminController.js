// ============================================================
// controllers/adminController.js — Dashboard, classes, matières, EDT
// ============================================================
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const {
  Utilisateur, Professeur, Eleve, Classe, Matiere, ClasseMatiere,
  EmploiDuTemps, Seance, Devoir, Note
} = require('../models');
const { redirectToLogin } = require('../middlewares/authMiddleware');
const { getAnneeScolaireCourante, estAnneeScolaireCourante } = require('../services/schoolYearService');
const activityLog = require('../services/activityLogService');
const { recalculerBulletinsPourMatiere } = require('../services/moyenneRecalcService');
const timetableService = require('../services/timetableService');
const classService = require('../services/classService');
const { PAUSES, CRENEAUX_HORAIRES, construireTimelineJour, CYCLES } = require('../config/schoolConfig');

const anneeCourante = () => getAnneeScolaireCourante();

async function countElevesActifs(annee) {
  return Eleve.count({
    include: [
      { model: Classe, as: 'classe', where: { annee_scolaire: annee }, required: true },
      { model: Utilisateur, as: 'utilisateur', where: { statut: 'actif' }, required: true }
    ]
  });
}

async function countProfsActifs() {
  return Professeur.count({
    include: [{
      model: Utilisateur,
      as: 'utilisateur',
      where: { statut: 'actif' },
      required: true
    }]
  });
}

exports.dashboard = async (req, res) => {
  try {
    const annee = anneeCourante();
    const stats = {
      totalEleves: await countElevesActifs(annee),
      totalProfesseurs: await countProfsActifs(),
      totalClasses: await Classe.count({ where: { annee_scolaire: annee } }),
      totalMatieres: await Matiere.count()
    };

    res.render('admin/dashboard', {
      titre: 'Administration — SmartSchool',
      stats,
      anneeScolaire: annee,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur dashboard:', err);
    return redirectToLogin(req, res, 'Erreur lors du chargement du tableau de bord.');
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const annee = req.query.annee || anneeCourante();
    const filtre = req.query.filtre || 'effectifs';

    if (filtre === 'effectifs') {
      return res.json({
        type: 'bar',
        title: 'Effectifs globaux',
        labels: ['Élèves actifs', 'Professeurs actifs', 'Classes', 'Matières'],
        data: [
          await countElevesActifs(annee),
          await countProfsActifs(),
          await Classe.count({ where: { annee_scolaire: annee } }),
          await Matiere.count()
        ],
        annee
      });
    }

    if (filtre === 'roles') {
      const roles = ['eleve', 'professeur', 'parent', 'admin'];
      const labels = ['Élèves', 'Professeurs', 'Parents', 'Admin'];
      const data = await Promise.all(
        roles.map((type) => Utilisateur.count({ where: { type, statut: 'actif' } }))
      );
      return res.json({ type: 'doughnut', title: 'Utilisateurs par rôle', labels, data, annee });
    }

    if (filtre === 'classes_cycle') {
      const labels = Object.values(CYCLES).map((c) => c.label);
      const data = await Promise.all(
        Object.keys(CYCLES).map((cycle) =>
          Classe.count({ where: { cycle, annee_scolaire: annee } })
        )
      );
      return res.json({ type: 'bar', title: 'Classes par cycle', labels, data, annee });
    }

    if (filtre === 'eleves_cycle') {
      const labels = Object.values(CYCLES).map((c) => c.label);
      const data = [];
      for (const cycle of Object.keys(CYCLES)) {
        const classes = await Classe.findAll({ where: { cycle, annee_scolaire: annee }, attributes: ['id'] });
        const ids = classes.map((c) => c.id);
        data.push(ids.length ? await Eleve.count({ where: { classe_id: { [Op.in]: ids } } }) : 0);
      }
      return res.json({ type: 'bar', title: 'Élèves par cycle', labels, data, annee });
    }

    if (filtre === 'remplissage') {
      const classes = await Classe.findAll({
        where: { annee_scolaire: annee },
        include: [{ model: Eleve, as: 'eleves', attributes: ['id'] }],
        order: [['cycle', 'ASC'], ['niveau', 'ASC'], ['nom', 'ASC']]
      });
      return res.json({
        type: 'bar',
        title: 'Remplissage des classes (%)',
        labels: classes.map((c) => classService.getLibelleComplet(c.niveau, c.nom)),
        data: classes.map((c) => Math.round(((c.eleves?.length || 0) / c.capacite) * 100)),
        annee
      });
    }

    return res.status(400).json({ error: 'Filtre inconnu.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ============================================================
// CLASSES
// ============================================================

exports.classes = async (req, res) => {
  try {
    const filtreCycle = req.query.cycle || '';
    const annee = anneeCourante();
    const where = { annee_scolaire: annee };
    if (filtreCycle) where.cycle = filtreCycle;

    const classes = await Classe.findAll({
      where,
      include: [
        { model: Eleve, as: 'eleves' },
        { model: Matiere, as: 'matieres', through: { attributes: ['coefficient', 'volume_horaire_hebdo'] } }
      ],
      order: [['cycle', 'ASC'], ['niveau', 'ASC'], ['nom', 'ASC']]
    });
    const toutesMatieres = await Matiere.findAll({ order: [['nom', 'ASC']] });

    res.render('admin/classes', {
      titre: 'Gestion des classes — SmartSchool',
      classes,
      toutesMatieres,
      cycles: CYCLES,
      filtreCycle,
      anneeScolaire: annee,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
};

exports.apercuClasse = async (req, res) => {
  try {
    const { cycle, niveau } = req.query;
    const apercu = await classService.apercuCreation(cycle, niveau, anneeCourante());
    return res.json(apercu);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.createClasse = async (req, res) => {
  try {
    const { cycle, niveau } = req.body;
    const { classe, libelle } = await classService.creerClasse({
      cycle,
      niveau,
      annee_scolaire: anneeCourante()
    });

    const matiereIds = [].concat(req.body.matieres || []).map(Number).filter(Boolean);
    for (const matiereId of matiereIds) {
      await ClasseMatiere.create({
        classe_id: classe.id,
        matiere_id: matiereId,
        coefficient: parseFloat(req.body[`coef_${matiereId}`]) || 2,
        volume_horaire_hebdo: parseInt(req.body[`vol_${matiereId}`], 10) || 2
      });
    }

    await activityLog.log(req, 'CREATION_CLASSE', { id: classe.id, libelle, cycle, niveau });
    req.flash('success', `Classe "${libelle}" créée — salle ${classe.salle}, capacité ${classe.capacite}.`);
    return res.redirect('/admin/classes');
  } catch (err) {
    req.flash('error', err.message || 'Erreur lors de la création de la classe.');
    return res.redirect('/admin/classes');
  }
};

exports.updateClasseMatieres = async (req, res) => {
  try {
    const classeId = req.params.id;
    const classe = await Classe.findByPk(classeId);
    if (!classe) {
      req.flash('error', 'Classe introuvable.');
      return res.redirect('/admin/classes');
    }

    await ClasseMatiere.destroy({ where: { classe_id: classeId } });
    const matiereIds = [].concat(req.body.matieres || []).map(Number).filter(Boolean);
    for (const matiereId of matiereIds) {
      await ClasseMatiere.create({
        classe_id: classeId,
        matiere_id: matiereId,
        coefficient: parseFloat(req.body[`coef_${matiereId}`]) || 2,
        volume_horaire_hebdo: parseInt(req.body[`vol_${matiereId}`], 10) || 2
      });
    }

    const libelle = classService.getLibelleComplet(classe.niveau, classe.nom);
    await activityLog.log(req, 'MODIFICATION_CLASSE_MATIERES', { classeId, libelle });
    req.flash('success', `Matières de ${libelle} mises à jour.`);
    return res.redirect('/admin/classes');
  } catch (err) {
    req.flash('error', 'Erreur lors de la mise à jour des matières.');
    return res.redirect('/admin/classes');
  }
};

exports.editClasse = async (req, res) => {
  const classe = await Classe.findByPk(req.params.id, { include: [{ model: Eleve, as: 'eleves' }] });
  if (!classe) {
    req.flash('error', 'Classe introuvable.');
    return res.redirect('/admin/classes');
  }
  res.render('admin/classeForm', {
    titre: 'Modifier la classe — SmartSchool',
    classe,
    anneeScolaire: anneeCourante(),
    user: req.session.user
  });
};

exports.updateClasse = async (req, res) => {
  try {
    const classe = await Classe.findByPk(req.params.id, { include: [{ model: Eleve, as: 'eleves' }] });
    if (!classe) {
      req.flash('error', 'Classe introuvable.');
      return res.redirect('/admin/classes');
    }

    const { nom, niveau, capacite } = req.body;
    const cap = parseInt(capacite, 10);
    const nbEleves = classe.eleves?.length || 0;

    if (cap < nbEleves) {
      req.flash('error', `Impossible : ${nbEleves} élève(s) déjà inscrit(s) dans cette classe.`);
      return res.redirect(`/admin/classes/${classe.id}/edit`);
    }

    const existe = await Classe.findOne({
      where: { nom, annee_scolaire: classe.annee_scolaire, id: { [Op.ne]: classe.id } }
    });
    if (existe) {
      req.flash('error', 'Une classe avec ce nom existe déjà pour cette année.');
      return res.redirect(`/admin/classes/${classe.id}/edit`);
    }

    await classe.update({ nom, niveau, capacite: cap });
    await activityLog.log(req, 'MODIFICATION_CLASSE', { id: classe.id, nom, niveau, capacite: cap });
    req.flash('success', 'Classe modifiée avec succès.');
    return res.redirect('/admin/classes');
  } catch (err) {
    req.flash('error', 'Erreur lors de la modification.');
    return res.redirect('/admin/classes');
  }
};

exports.deleteClasse = async (req, res) => {
  try {
    const classe = await Classe.findByPk(req.params.id, { include: [{ model: Eleve, as: 'eleves' }] });
    if (!classe) {
      req.flash('error', 'Classe introuvable.');
      return res.redirect('/admin/classes');
    }

    const nbEleves = classe.eleves?.length || 0;
    if (nbEleves > 0) {
      req.flash('error', `Impossible : ${nbEleves} élève(s) sont rattachés à cette classe.`);
      return res.redirect('/admin/classes');
    }

    const emploi = await EmploiDuTemps.findOne({ where: { classe_id: classe.id } });
    if (emploi) {
      const nbSeances = await Seance.count({ where: { emploi_du_temps_id: emploi.id } });
      if (nbSeances > 0) {
        req.flash('error', `Impossible : ${nbSeances} séance(s) planifiées pour cette classe.`);
        return res.redirect('/admin/classes');
      }
    }

    const nbDevoirs = await Devoir.count({ where: { classe_id: classe.id } });
    if (nbDevoirs > 0) {
      req.flash('error', `Impossible : ${nbDevoirs} devoir(s) rattaché(s) à cette classe.`);
      return res.redirect('/admin/classes');
    }

    if (emploi) await emploi.destroy();
    await ClasseMatiere.destroy({ where: { classe_id: classe.id } });
    await classe.destroy();

    await activityLog.log(req, 'SUPPRESSION_CLASSE', { id: req.params.id, nom: classe.nom });
    req.flash('success', 'Classe supprimée.');
    return res.redirect('/admin/classes');
  } catch (err) {
    req.flash('error', 'Erreur lors de la suppression.');
    return res.redirect('/admin/classes');
  }
};

// ============================================================
// MATIÈRES
// ============================================================

exports.matieres = async (req, res) => {
  try {
    const matieres = await Matiere.findAll({
      include: [{ model: Professeur, as: 'professeurs', attributes: ['id'] }],
      order: [['nom', 'ASC']]
    });
    res.render('admin/matieres', {
      titre: 'Gestion des matières — SmartSchool',
      matieres: matieres.map((m) => ({
        ...m.toJSON(),
        nbProfs: m.professeurs?.length || 0
      })),
      user: req.session.user
    });
  } catch (err) {
    res.redirect('/admin/dashboard');
  }
};

exports.createMatiere = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect('/admin/matieres');
  }

  try {
    const { nom, code, description } = req.body;
    const existe = await Matiere.findOne({ where: { nom } });
    if (existe) {
      req.flash('error', 'Une matière avec ce nom existe déjà.');
      return res.redirect('/admin/matieres');
    }

    const matiere = await Matiere.create({
      nom,
      code: code?.toUpperCase() || nom.substring(0, 4).toUpperCase(),
      coefficient: 1,
      volume_horaire: 0,
      description
    });

    await activityLog.log(req, 'CREATION_MATIERE', { id: matiere.id, nom });
    req.flash('success', `Matière "${nom}" créée. Coef. et volume se configurent par classe.`);
    return res.redirect('/admin/matieres');
  } catch (err) {
    req.flash('error', 'Erreur lors de la création.');
    return res.redirect('/admin/matieres');
  }
};

exports.editMatiere = async (req, res) => {
  const matiere = await Matiere.findByPk(req.params.id);
  if (!matiere) {
    req.flash('error', 'Matière introuvable.');
    return res.redirect('/admin/matieres');
  }
  res.render('admin/matiereForm', { titre: 'Modifier matière', matiere, user: req.session.user });
};

exports.updateMatiere = async (req, res) => {
  try {
    const matiere = await Matiere.findByPk(req.params.id);
    if (!matiere) {
      req.flash('error', 'Matière introuvable.');
      return res.redirect('/admin/matieres');
    }

    const { nom, code, description } = req.body;

    const existe = await Matiere.findOne({ where: { nom, id: { [Op.ne]: matiere.id } } });
    if (existe) {
      req.flash('error', 'Ce nom de matière est déjà utilisé.');
      return res.redirect(`/admin/matieres/${matiere.id}/edit`);
    }

    await matiere.update({
      nom,
      code: code?.toUpperCase() || matiere.code,
      description
    });

    await activityLog.log(req, 'MODIFICATION_MATIERE', { id: matiere.id, nom });
    req.flash('success', 'Matière modifiée.');
    return res.redirect('/admin/matieres');
  } catch (err) {
    req.flash('error', 'Erreur lors de la modification.');
    return res.redirect('/admin/matieres');
  }
};

exports.deleteMatiere = async (req, res) => {
  try {
    const id = req.params.id;
    const nbNotes = await Note.count({ where: { matiere_id: id } });
    const nbSeances = await Seance.count({ where: { matiere_id: id } });
    const nbDevoirs = await Devoir.count({ where: { matiere_id: id } });

    if (nbNotes || nbSeances || nbDevoirs) {
      const parts = [];
      if (nbNotes) parts.push(`${nbNotes} note(s)`);
      if (nbSeances) parts.push(`${nbSeances} séance(s)`);
      if (nbDevoirs) parts.push(`${nbDevoirs} devoir(s)`);
      req.flash('error', `Impossible de supprimer : ${parts.join(', ')} rattaché(s).`);
      return res.redirect('/admin/matieres');
    }

    const matiere = await Matiere.findByPk(id);
    await ClasseMatiere.destroy({ where: { matiere_id: id } });
    await matiere.destroy();

    await activityLog.log(req, 'SUPPRESSION_MATIERE', { id, nom: matiere?.nom });
    req.flash('success', 'Matière supprimée.');
    return res.redirect('/admin/matieres');
  } catch (err) {
    req.flash('error', 'Erreur lors de la suppression.');
    return res.redirect('/admin/matieres');
  }
};

// ============================================================
// EMPLOI DU TEMPS
// ============================================================

exports.emploiDuTemps = async (req, res) => {
  try {
    const classeId = req.query.classe_id ? parseInt(req.query.classe_id, 10) : null;
    const semestre = req.query.semestre || 'annuel';

    const classes = await Classe.findAll({
      where: { annee_scolaire: anneeCourante() },
      order: [['niveau', 'ASC'], ['nom', 'ASC']]
    });

    let classeSelectionnee = null;
    let seances = [];
    let emploiDuTemps = null;

    if (classeId) {
      classeSelectionnee = classes.find((c) => c.id === classeId) || await Classe.findByPk(classeId);
      emploiDuTemps = await EmploiDuTemps.findOne({
        where: { classe_id: classeId, semestre, actif: true }
      });
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

    const professeurs = await Professeur.findAll({
      include: [{ model: Utilisateur, as: 'utilisateur' }, { model: Matiere, as: 'matieres' }]
    });
    const matieres = await Matiere.findAll({ order: [['nom', 'ASC']] });

    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const planning = {};
    jours.forEach((j) => { planning[j] = seances.filter((s) => s.jour === j); });

    res.render('admin/emploiDuTemps', {
      titre: 'Emploi du temps — SmartSchool',
      classes,
      classeSelectionnee,
      classeId,
      semestre,
      planning,
      jours,
      emploiDuTemps,
      professeurs,
      matieres,
      pauses: PAUSES,
      creneaux: CRENEAUX_HORAIRES,
      construireTimelineJour,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
};

exports.genererEmploiDuTemps = async (req, res) => {
  const classeId = req.params.classeId;
  try {
    if (classeId && classeId !== 'all') {
      const resultat = await timetableService.genererPourClasse(parseInt(classeId, 10));
      if (resultat.ok) {
        req.flash('success', `${resultat.libelle} : ${resultat.seancesCreees} séance(s) générée(s).`);
      } else {
        req.flash('warning', `${resultat.libelle} : ${resultat.erreurs.join(' ')} (${resultat.seancesCreees} séance(s) créée(s)).`);
      }
    } else {
      const resultats = await timetableService.genererPourToutesLesClasses();
      const total = resultats.length;
      const ok = resultats.filter((r) => r.ok);
      const partiels = resultats.filter((r) => !r.ok && r.seancesCreees > 0);
      const echecs = resultats.filter((r) => r.seancesCreees === 0 && !r.ok);

      let msg = `Génération globale : ${ok.length}/${total} classe(s) complètes.`;
      if (partiels.length) {
        msg += ` Partielles : ${partiels.map((r) => r.libelle).join(', ')}.`;
      }
      if (echecs.length) {
        msg += ` Échecs : ${echecs.map((r) => `${r.libelle} (${r.erreurs[0] || 'erreur'})`).join(' ; ')}.`;
      }
      const typeFlash = echecs.length === total ? 'error' : (echecs.length || partiels.length ? 'warning' : 'success');
      req.flash(typeFlash, msg);
    }
    return res.redirect(classeId && classeId !== 'all'
      ? `/admin/emploiDuTemps?classe_id=${classeId}`
      : '/admin/emploiDuTemps');
  } catch (err) {
    console.error('Génération EDT:', err);
    req.flash('error', 'Erreur lors de la génération des emplois du temps.');
    return res.redirect(classeId && classeId !== 'all'
      ? `/admin/emploiDuTemps?classe_id=${classeId}`
      : '/admin/emploiDuTemps');
  }
};
