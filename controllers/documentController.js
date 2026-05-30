// ============================================================
// controllers/documentController.js — Documents personnels élèves
// ============================================================
const path = require('path');
const fs = require('fs');
const { Document, Eleve } = require('../models');

/**
 * Liste les documents de l'élève connecté
 */
exports.index = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const documents = await Document.findAll({
      where: { eleve_id: eleve.id },
      order: [['createdAt', 'DESC']]
    });

    res.render('eleve/documents', {
      titre: 'Mes documents — SmartSchool',
      documents, user: req.session.user
    });
  } catch (err) {
    console.error('Erreur documents:', err);
    req.flash('error', 'Erreur lors du chargement des documents.');
    res.redirect('/eleve/dashboard');
  }
};

/**
 * Enregistre un document uploadé via Multer
 */
exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Aucun fichier sélectionné.');
      return res.redirect('back');
    }

    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });

    await Document.create({
      nom_original: req.file.originalname,
      nom_stockage: req.file.filename,
      chemin: req.file.path,
      type_mime: req.file.mimetype,
      taille: req.file.size,
      description: req.body.description || '',
      eleve_id: eleve.id
    });

    req.flash('success', `Document "${req.file.originalname}" déposé avec succès.`);
    return res.redirect('/eleve/documents');
  } catch (err) {
    console.error('Erreur upload document:', err);
    req.flash('error', "Erreur lors du dépôt du document.");
    return res.redirect('back');
  }
};

/**
 * Télécharge un document (vérifie que l'élève est propriétaire)
 */
exports.download = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const document = await Document.findOne({
      where: { id: req.params.id, eleve_id: eleve.id }
    });

    if (!document) {
      req.flash('error', 'Document introuvable ou accès non autorisé.');
      return res.redirect('back');
    }

    const cheminFichier = path.join(__dirname, '../public/uploads', document.nom_stockage);
    if (!fs.existsSync(cheminFichier)) {
      req.flash('error', 'Fichier introuvable sur le serveur.');
      return res.redirect('back');
    }

    res.download(cheminFichier, document.nom_original);
  } catch (err) {
    console.error('Erreur téléchargement:', err);
    req.flash('error', 'Erreur lors du téléchargement.');
    res.redirect('back');
  }
};

/**
 * Supprime un document de l'espace personnel
 */
exports.destroy = async (req, res) => {
  try {
    const eleve = await Eleve.findOne({ where: { utilisateur_id: req.session.user.id } });
    const document = await Document.findOne({
      where: { id: req.params.id, eleve_id: eleve.id }
    });

    if (!document) {
      req.flash('error', 'Document introuvable.');
      return res.redirect('back');
    }

    // Suppression physique du fichier
    const cheminFichier = path.join(__dirname, '../public/uploads', document.nom_stockage);
    if (fs.existsSync(cheminFichier)) {
      fs.unlinkSync(cheminFichier);
    }

    await document.destroy();
    req.flash('success', 'Document supprimé avec succès.');
    return res.redirect('/eleve/documents');
  } catch (err) {
    console.error('Erreur suppression document:', err);
    req.flash('error', 'Erreur lors de la suppression.');
    res.redirect('back');
  }
};
