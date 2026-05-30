// ============================================================
// controllers/eleveController.js — Dashboard et vues élève
// ============================================================
const { Eleve, Classe, Note, Devoir, Absence, Bulletin, Message, Matiere, Utilisateur } = require('../models');
const { redirectToLogin } = require('../middlewares/authMiddleware');
const { getCoefficientPourEleve } = require('../services/matiereHelper');

/**
 * Dashboard principal de l'élève
 */
exports.dashboard = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({
      where: { utilisateur_id: req.session.user.id },
      include: [
        { model: Classe, as: 'classe' },
        { model: Utilisateur, as: 'utilisateur' }
      ]
    });

    if (!eleve) {
      return redirectToLogin(req, res, 'Profil élève introuvable.');
    }

    // Notes récentes
    const notesRecentes = await Note.findAll({
      where: { eleve_id: eleve.id },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['date_evaluation', 'DESC']],
      limit: 5
    });

    // Devoirs à rendre pour la classe
    const devoirsAVenir = await Devoir.findAll({
      where: { classe_id: eleve.classe_id, statut: 'publié' },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['date_limite', 'ASC']],
      limit: 5
    });

    // Absences non justifiées
    const absencesNonJustifiees = await Absence.count({
      where: { eleve_id: eleve.id, justifiee: false }
    });

    // Messages non lus
    const messagesNonLus = await Message.count({
      where: { destinataire_id: req.session.user.id, lu: false }
    });

    // Calcul de la moyenne générale (toutes matières, période courante)
    const toutesNotes = await Note.findAll({
      where: { eleve_id: eleve.id },
      include: [{ model: Matiere, as: 'matiere' }]
    });

    let moyenneGenerale = null;
    if (toutesNotes.length > 0) {
      let somme = 0;
      let totalCoeff = 0;
      for (const n of toutesNotes) {
        const coeff = await getCoefficientPourEleve(eleve.id, n.matiere_id, 1);
        somme += parseFloat(n.valeur) * coeff;
        totalCoeff += coeff;
      }
      moyenneGenerale = totalCoeff > 0 ? (somme / totalCoeff).toFixed(2) : null;
    }

    // Données pour le graphique Chart.js — notes par matière
    const notesParMatiere = {};
    toutesNotes.forEach(n => {
      const nom = n.matiere.nom;
      if (!notesParMatiere[nom]) notesParMatiere[nom] = [];
      notesParMatiere[nom].push(parseFloat(n.valeur));
    });
    const chartLabels = Object.keys(notesParMatiere);
    const chartData = chartLabels.map(m => {
      const vals = notesParMatiere[m];
      return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2);
    });

    res.render('eleve/dashboard', {
      titre: 'Mon espace — SmartSchool',
      eleve, notesRecentes, devoirsAVenir,
      absencesNonJustifiees, messagesNonLus,
      moyenneGenerale, chartLabels, chartData,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur dashboard élève:', err);
    return redirectToLogin(req, res, 'Erreur lors du chargement du tableau de bord.');
  }
};

/**
 * Page notes de l'élève
 */
exports.notes = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const notes = await Note.findAll({
      where: { eleve_id: eleve.id },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['matiere', 'nom', 'ASC'], ['date_evaluation', 'DESC']]
    });

    // Grouper par matière avec moyenne
    const noteParMatiere = {};
    notes.forEach(n => {
      const key = n.matiere_id;
      if (!noteParMatiere[key]) noteParMatiere[key] = { matiere: n.matiere, notes: [], moyenne: 0 };
      noteParMatiere[key].notes.push(n);
    });
    for (const key in noteParMatiere) {
      const g = noteParMatiere[key];
      g.moyenne = (g.notes.reduce((s, n) => s + parseFloat(n.valeur), 0) / g.notes.length).toFixed(2);
    }

    res.render('eleve/notes', {
      titre: 'Mes notes — SmartSchool',
      noteParMatiere: Object.values(noteParMatiere),
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur notes élève:', err);
    res.redirect('/eleve/dashboard');
  }
};

/**
 * Page devoirs de l'élève
 */
exports.devoirs = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const devoirs = await Devoir.findAll({
      where: { classe_id: eleve.classe_id, statut: 'publié' },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['date_limite', 'ASC']]
    });

    res.render('eleve/devoirs', {
      titre: 'Mes devoirs — SmartSchool',
      devoirs, user: req.session.user
    });
  } catch (err) {
    console.error('Erreur devoirs élève:', err);
    res.redirect('/eleve/dashboard');
  }
};

/**
 * Liste des bulletins de l'élève connecté
 */
exports.bulletins = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const bulletins = await Bulletin.findAll({
      where: { eleve_id: eleve.id },
      order: [['date_generation', 'DESC']]
    });

    res.render('eleve/bulletin', {
      titre: 'Mes bulletins — SmartSchool',
      bulletins,
      bulletin: null,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur liste bulletins élève:', err);
    req.flash('error', 'Erreur lors du chargement des bulletins.');
    res.redirect('/eleve/dashboard');
  }
};

/**
 * Signalement d'une absence par l'élève
 */
exports.signalerAbsence = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const { date, motif } = req.body;

    await Absence.create({
      eleve_id: eleve.id, date,
      justifiee: false,
      motif: motif || 'Signalée par l\'élève'
    });

    req.flash('success', 'Absence signalée avec succès.');
    return res.redirect('/eleve/presences');
  } catch (err) {
    console.error('Erreur signalement absence:', err);
    req.flash('error', "Erreur lors du signalement de l'absence.");
    return res.redirect('back');
  }
};
