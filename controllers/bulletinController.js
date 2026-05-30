// ============================================================
// controllers/bulletinController.js — Génération des bulletins
// ============================================================
const { Bulletin, Eleve, Classe, Note, Matiere, Utilisateur, Parent } = require('../models');
const { Op } = require('sequelize');
const { getCoefficientPourEleve } = require('../services/matiereHelper');
const { getProfesseurParUtilisateur, getClassesDuProfesseur } = require('../services/professeurHelper');
const { getAnneeScolaireCourante } = require('../services/schoolYearService');
const { notifierEleveEtParents } = require('../services/notificationService');

function appreciationPourMoyenne(moyenneGenerale) {
  if (moyenneGenerale === null) return '';
  const moy = parseFloat(moyenneGenerale);
  if (moy >= 16) return 'Excellent — Félicitations du conseil de classe';
  if (moy >= 14) return 'Très bien — Encouragements du conseil de classe';
  if (moy >= 12) return 'Bien — Satisfaisant, continuez vos efforts';
  if (moy >= 10) return 'Assez bien — Résultats encourageants';
  if (moy >= 8) return 'Passable — Des efforts sont nécessaires';
  return 'Insuffisant — Travail insuffisant, redoublez d\'efforts';
}

async function genererBulletinEleve(eleveId, periode, anneeScolaire) {
  const eleve = await Eleve.findByPk(eleveId, {
    include: [
      { model: Utilisateur, as: 'utilisateur' },
      { model: Classe, as: 'classe' }
    ]
  });
  if (!eleve) return null;

  const notes = await Note.findAll({
    where: { eleve_id: eleveId, periode },
    include: [{ model: Matiere, as: 'matiere' }]
  });

  let somme = 0;
  let totalCoeff = 0;
  for (const note of notes) {
    const coeff = await getCoefficientPourEleve(eleveId, note.matiere_id, 1);
    somme += parseFloat(note.valeur) * coeff;
    totalCoeff += coeff;
  }
  const moyenneGenerale = totalCoeff > 0 ? (somme / totalCoeff).toFixed(2) : null;
  const appreciation = appreciationPourMoyenne(moyenneGenerale);
  const annee = anneeScolaire || getAnneeScolaireCourante();

  const [bulletin, cree] = await Bulletin.findOrCreate({
    where: { eleve_id: eleveId, periode, annee_scolaire: annee },
    defaults: {
      classe_id: eleve.classe_id,
      moyenne_generale: moyenneGenerale,
      appreciation_generale: appreciation,
      date_generation: new Date()
    }
  });

  if (!cree) {
    await bulletin.update({
      moyenne_generale: moyenneGenerale,
      appreciation_generale: appreciation,
      date_generation: new Date()
    });
  }

  await notifierEleveEtParents(eleveId, {
    titre: 'Bulletin disponible',
    contenu: `Votre bulletin (${periode}) est disponible. Moyenne : ${moyenneGenerale || '—'}/20`,
    type: 'note',
    lien: '/eleve/notes'
  });

  return bulletin;
}

exports.generer = async (req, res) => {
  try {
    const { eleve_id, periode, annee_scolaire } = req.body;
    const bulletin = await genererBulletinEleve(eleve_id, periode, annee_scolaire);
    if (!bulletin) {
      req.flash('error', 'Élève introuvable.');
      return res.redirect('back');
    }
    req.flash('success', `Bulletin généré — Moyenne : ${bulletin.moyenne_generale || 'N/A'}/20`);
    return res.redirect(`/professeur/bulletin/${bulletin.id}`);
  } catch (err) {
    console.error('Erreur génération bulletin:', err);
    req.flash('error', 'Erreur lors de la génération du bulletin.');
    return res.redirect('back');
  }
};

/** Génère et publie les bulletins de toute une classe */
exports.publierClasse = async (req, res) => {
  try {
    const { classe_id, periode, annee_scolaire } = req.body;
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    const classes = await getClassesDuProfesseur(professeur);
    if (!classes.some((c) => String(c.id) === String(classe_id))) {
      req.flash('error', 'Classe non autorisée.');
      return res.redirect('/professeur/bulletin');
    }

    const eleves = await Eleve.findAll({ where: { classe_id } });
    let nb = 0;
    for (const eleve of eleves) {
      await genererBulletinEleve(eleve.id, periode, annee_scolaire);
      nb += 1;
    }
    req.flash('success', `${nb} bulletin(s) généré(s) et envoyé(s) aux élèves et parents.`);
    return res.redirect('/professeur/bulletin');
  } catch (err) {
    console.error('Erreur publication bulletins classe:', err);
    req.flash('error', 'Erreur lors de la publication des bulletins.');
    return res.redirect('/professeur/bulletin');
  }
};

/**
 * Affiche un bulletin avec toutes ses notes par matière
 */
exports.show = async (req, res) => {
  try {
    const bulletin = await Bulletin.findByPk(req.params.id, {
      include: [
        {
          model: Eleve, as: 'eleve',
          include: [
            { model: Utilisateur, as: 'utilisateur' },
            { model: Classe, as: 'classe' }
          ]
        },
        { model: Classe, as: 'classe' }
      ]
    });

    if (!bulletin) {
      req.flash('error', 'Bulletin introuvable.');
      return res.redirect('back');
    }

    // Contrôle d'accès : un élève ne voit que son propre bulletin
    if (req.session.user.type === 'eleve') {
      const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
      if (bulletin.eleve_id !== eleve.id) {
        return res.status(403).render('errors/403', { titre: 'Accès interdit', user: req.session.user });
      }
    }

    // Contrôle d'accès : un parent ne voit que le bulletin de son enfant
    if (req.session.user.type === 'parent') {
      const parent = await Parent.findOne({ where: { utilisateur_id: req.session.user.id } });
      if (!parent || bulletin.eleve_id !== parent.eleve_id) {
        return res.status(403).render('errors/403', {
          titre: 'Accès interdit',
          message: "Vous ne pouvez consulter que le bulletin de votre enfant.",
          user: req.session.user
        });
      }
    }

    // Notes par matière pour ce bulletin
    const notes = await Note.findAll({
      where: { eleve_id: bulletin.eleve_id, periode: bulletin.periode },
      include: [{ model: Matiere, as: 'matiere' }],
      order: [['matiere', 'nom', 'ASC']]
    });

    // Grouper les notes par matière
    const noteParMatiere = {};
    for (const note of notes) {
      const key = note.matiere_id;
      if (!noteParMatiere[key]) {
        noteParMatiere[key] = { matiere: note.matiere, notes: [], moyenne: 0 };
      }
      noteParMatiere[key].notes.push(note);
    }
    // Calcul moyenne par matière
    for (const key in noteParMatiere) {
      const groupe = noteParMatiere[key];
      const moy = groupe.notes.reduce((s, n) => s + parseFloat(n.valeur), 0) / groupe.notes.length;
      groupe.moyenne = moy.toFixed(2);
    }

    const role = req.session.user.type;
    const vuesBulletin = { professeur: 'professeur/bulletin', eleve: 'eleve/bulletin', parent: 'parent/bulletin' };
    const vueBulletin = vuesBulletin[role] || 'eleve/bulletin';

    res.render(vueBulletin, {
      titre: `Bulletin — ${bulletin.periode} — SmartSchool`,
      bulletin, noteParMatiere: Object.values(noteParMatiere),
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur affichage bulletin:', err);
    req.flash('error', 'Erreur lors du chargement du bulletin.');
    res.redirect('back');
  }
};

/**
 * Affiche la page de génération de bulletin (vue professeur)
 */
exports.index = async (req, res) => {
  try {
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    if (!professeur) {
      req.flash('error', 'Profil professeur introuvable.');
      return res.redirect('/professeur/dashboard');
    }
    const classes = await getClassesDuProfesseur(professeur, [{
      model: Eleve,
      as: 'eleves',
      include: [{ model: Utilisateur, as: 'utilisateur' }]
    }]);

    res.render('professeur/bulletin', {
      titre: 'Bulletins scolaires — SmartSchool',
      classes: classes || [],
      anneeScolaire: getAnneeScolaireCourante(),
      user: req.session.user,
      bulletin: null
    });
  } catch (err) {
    console.error('Erreur index bulletin:', err);
    return res.redirect('/professeur/dashboard');
  }
};
