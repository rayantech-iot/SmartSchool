const { validationResult } = require('express-validator');
const { Devoir, Professeur, Classe, Matiere } = require('../models');
const fs = require('fs');
const path = require('path');


exports.index = async (req, res) => {
  try {
    const professeur = await Professeur.findOne({ where: { utilisateur_id: req.session.user.id } });
    const devoirs = await Devoir.findAll({
      where: { professeur_id: professeur.id },
      include: [
        { model: Classe, as: 'classe' },
        { model: Matiere, as: 'matiere' }
      ],
      order: [['date_publication', 'DESC']]
    });
    const classes = await professeur.getClasses();
    const matieres = await professeur.getMatieres();

    res.render('professeur/devoirs', {
      titre: 'Gestion des devoirs — SmartSchool',
      devoirs, classes, matieres, user: req.session.user
    });
  } catch (err) {
    console.error('Erreur devoirs:', err);
    req.flash('error', 'Erreur lors du chargement des devoirs.');
    res.redirect('/professeur/dashboard');
  }
};

exports.store = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    req.flash('error', erreurs.array()[0].msg);
    return res.redirect('back');
  }

  try {
    const professeur = await Professeur.findOne({ where: { utilisateur_id: req.session.user.id } });
    const { titre, description, date_limite, classe_id, matiere_id } = req.body;

    const data = {
      titre, description, date_limite, classe_id, matiere_id,
      professeur_id: professeur.id,
      date_publication: new Date(),
      statut: 'publié'
    };

    if (req.file) {
      data.fichier = req.file.filename;
      data.fichier_nom = req.file.originalname;
    }

    await Devoir.create(data);

    req.flash('success', 'Devoir publié avec succès.');
    return res.redirect('/professeur/devoirs');
  } catch (err) {
    console.error('Erreur création devoir:', err);
    req.flash('error', 'Erreur lors de la publication du devoir.');
    return res.redirect('back');
  }
};


exports.update = async (req, res) => {
  try {
    const professeur = await Professeur.findOne({ where: { utilisateur_id: req.session.user.id } });
    const devoir = await Devoir.findOne({
      where: { id: req.params.id, professeur_id: professeur.id }
    });

    if (!devoir) {
      req.flash('error', 'Devoir introuvable ou accès non autorisé.');
      return res.redirect('back');
    }

    const { titre, description, date_limite, classe_id, matiere_id } = req.body;
    const data = { titre, description, date_limite, classe_id, matiere_id };

    if (req.file) {
      
      if (devoir.fichier) {
        const oldPath = path.join(__dirname, '../public/uploads', devoir.fichier);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.fichier = req.file.filename;
      data.fichier_nom = req.file.originalname;
    }

    await devoir.update(data);

    req.flash('success', 'Devoir modifié avec succès.');
    return res.redirect('/professeur/devoirs');
  } catch (err) {
    console.error('Erreur mise à jour devoir:', err);
    req.flash('error', 'Erreur lors de la modification.');
    return res.redirect('back');
  }
};


exports.destroy = async (req, res) => {
  try {
    const professeur = await Professeur.findOne({ where: { utilisateur_id: req.session.user.id } });
    const devoir = await Devoir.findOne({
      where: { id: req.params.id, professeur_id: professeur.id }
    });

    if (!devoir) {
      req.flash('error', 'Devoir introuvable ou accès non autorisé.');
      return res.redirect('back');
    }

    if (devoir.fichier) {
      const filePath = path.join(__dirname, '../public/uploads', devoir.fichier);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await devoir.destroy();
    req.flash('success', 'Devoir supprimé avec succès.');
    return res.redirect('/professeur/devoirs');
  } catch (err) {
    console.error('Erreur suppression devoir:', err);
    req.flash('error', 'Erreur lors de la suppression.');
    return res.redirect('back');
  }
};
