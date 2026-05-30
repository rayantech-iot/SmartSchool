// ============================================================
// controllers/absenceController.js — Gestion des absences
// ============================================================
const { Absence, Eleve, Seance, Utilisateur, Parent } = require('../models');

/**
 * Affiche les absences d'un élève (vue élève ou parent)
 */
exports.index = async (req, res) => {
  try {
    let eleveId;
    if (req.session.user.type === 'eleve') {
      const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
      eleveId = eleve.id;
    } else if (req.session.user.type === 'parent') {
      const parent = await Parent.findOne({ where: { utilisateur_id: req.session.user.id } });
      eleveId = parent.eleve_id;
    }

    const absences = await Absence.findAll({
      where: { eleve_id: eleveId },
      include: [{ model: Seance, as: 'seance', required: false }],
      order: [['date', 'DESC']]
    });

    const totalAbsences = absences.length;
    const absencesJustifiees = absences.filter(a => a.justifiee).length;
    const absencesNonJustifiees = totalAbsences - absencesJustifiees;

    const vue = req.session.user.type === 'parent' ? 'parent/absences' : 'eleve/presences';
    res.render(vue, {
      titre: 'Mes absences — SmartSchool',
      absences, totalAbsences, absencesJustifiees, absencesNonJustifiees,
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur absences:', err);
    req.flash('error', 'Erreur lors du chargement des absences.');
    res.redirect('back');
  }
};

/**
 * Justifie une absence (parent uniquement)
 */
exports.justifier = async (req, res) => {
  try {
    const parent = await Parent.findOne({ where: { utilisateur_id: req.session.user.id } });
    const absence = await Absence.findByPk(req.params.id);

    if (!absence) {
      req.flash('error', 'Absence introuvable.');
      return res.redirect('back');
    }

    // Vérification que le parent justifie bien l'absence de son enfant
    if (absence.eleve_id !== parent.eleve_id) {
      return res.status(403).render('errors/403', {
        titre: 'Accès interdit',
        message: "Vous ne pouvez justifier que les absences de votre enfant.",
        user: req.session.user
      });
    }

    await absence.update({
      justifiee: true,
      motif: req.body.motif,
      date_justification: new Date()
    });

    req.flash('success', "L'absence a été justifiée avec succès.");
    return res.redirect('back');
  } catch (err) {
    console.error('Erreur justification absence:', err);
    req.flash('error', "Erreur lors de la justification de l'absence.");
    return res.redirect('back');
  }
};
