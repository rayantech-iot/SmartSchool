// ============================================================
// controllers/noteController.js — Gestion des notes
// ============================================================
const { validationResult } = require('express-validator');
const { Note, Eleve, Matiere, Classe, Utilisateur } = require('../models');
const { getProfesseurParUtilisateur, getClassesDuProfesseur } = require('../services/professeurHelper');
const { recalculerBulletinsPourMatiere } = require('../services/moyenneRecalcService');

const recalculerMoyenne = async (eleveId, matiereId, periode) => {
  const notes = await Note.findAll({
    where: { eleve_id: eleveId, matiere_id: matiereId, periode }
  });
  if (!notes.length) return null;
  const somme = notes.reduce((acc, n) => acc + parseFloat(n.valeur), 0);
  return (somme / notes.length).toFixed(2);
};

exports.index = async (req, res) => {
  try {
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    if (!professeur) {
      req.flash('error', 'Profil professeur introuvable. Contactez l\'administration.');
      return res.redirect('/professeur/dashboard');
    }

    const classes = await getClassesDuProfesseur(professeur, [
      { model: Eleve, as: 'eleves', include: [{ model: Utilisateur, as: 'utilisateur' }] }
    ]);
    const matieres = await professeur.getMatieres();

    let notes = [];
    let elevesClasse = [];
    const { classe_id, matiere_id, periode } = req.query;

    if (classe_id && matiere_id && periode) {
      const classe = classes.find((c) => String(c.id) === String(classe_id));
      if (classe) {
        elevesClasse = classe.eleves || [];
        const ids = elevesClasse.map((e) => e.id);
        if (ids.length) {
          notes = await Note.findAll({
            where: { matiere_id, periode, eleve_id: ids },
            include: [{ model: Eleve, as: 'eleve' }]
          });
        }
      }
    }

    res.render('professeur/notes', {
      titre: 'Gestion des notes — SmartSchool',
      classes: classes || [],
      matieres: matieres || [],
      notes,
      elevesClasse,
      filtres: { classe_id, matiere_id, periode },
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur notes index:', err);
    req.flash('error', 'Erreur lors du chargement des notes.');
    return res.redirect('/professeur/dashboard');
  }
};

exports.store = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    const errorMsg = erreurs.array()[0].msg;
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: errorMsg });
    }
    req.flash('error', errorMsg);
    return res.redirect('back');
  }

  try {
    const professeur = await getProfesseurParUtilisateur(req.session.user.id);
    if (!professeur) {
      const errorMsg = 'Profil professeur introuvable.';
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('/professeur/notes');
    }

    const { eleve_id, matiere_id, valeur, type_evaluation, periode, date_evaluation, appreciation } = req.body;

    const note = await Note.create({
      eleve_id,
      matiere_id,
      valeur: parseFloat(valeur),
      type_evaluation,
      periode,
      date_evaluation: date_evaluation || new Date(),
      appreciation,
      professeur_id: professeur.id
    });

    await recalculerMoyenne(eleve_id, matiere_id, periode);
    try {
      await recalculerBulletinsPourMatiere(matiere_id);
    } catch (e) {
      console.warn('Recalcul bulletin:', e.message);
    }

    const { notifierEleveEtParents } = require('../services/notificationService');
    const matiere = await Matiere.findByPk(matiere_id);
    await notifierEleveEtParents(eleve_id, {
      titre: 'Nouvelle note publiée',
      contenu: `${matiere ? matiere.nom : 'Matière'} : ${valeur}/20`,
      type: 'note',
      lien: '/eleve/notes'
    });

    const successMsg = `Note de ${valeur}/20 enregistrée avec succès.`;
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: successMsg, note });
    }
    req.flash('success', successMsg);
    return res.redirect('back');
  } catch (err) {
    console.error('Erreur création note:', err);
    const errorMsg = "Erreur lors de l'enregistrement de la note.";
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error', errorMsg);
    return res.redirect('back');
  }
};

exports.update = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      const errorMsg = 'Note introuvable.';
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('back');
    }

    const { valeur, type_evaluation, appreciation } = req.body;
    await note.update({ valeur: parseFloat(valeur), type_evaluation, appreciation });
    await recalculerMoyenne(note.eleve_id, note.matiere_id, note.periode);

    const successMsg = 'Note mise à jour avec succès.';
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: successMsg, note });
    }
    req.flash('success', successMsg);
    return res.redirect('back');
  } catch (err) {
    console.error('Erreur mise à jour note:', err);
    const errorMsg = 'Erreur lors de la mise à jour.';
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error', errorMsg);
    return res.redirect('back');
  }
};

exports.destroy = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      const errorMsg = 'Note introuvable.';
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('back');
    }

    const { eleve_id, matiere_id, periode } = note;
    await note.destroy();
    await recalculerMoyenne(eleve_id, matiere_id, periode);

    const successMsg = 'Note supprimée avec succès.';
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: successMsg });
    }
    req.flash('success', successMsg);
    return res.redirect('back');
  } catch (err) {
    console.error('Erreur suppression note:', err);
    const errorMsg = 'Erreur lors de la suppression.';
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error', errorMsg);
    return res.redirect('back');
  }
};

exports.getMoyenne = async (req, res) => {
  const { eleve_id, matiere_id, periode } = req.query;
  const moyenne = await recalculerMoyenne(eleve_id, matiere_id, periode);
  res.json({ moyenne });
};
