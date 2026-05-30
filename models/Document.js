// models/Document.js — Modèle des documents personnels des élèves
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * DOCUMENT — fichier déposé par l'élève dans son espace personnel
 * Types acceptés : pdf, docx, jpg, png — limite 5MB
 * Le chemin physique est stocké en base
 */
const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom_original: { type: DataTypes.STRING(255), allowNull: false, comment: 'Nom original du fichier' },
  nom_stockage: {
    type: DataTypes.STRING(255), allowNull: false,
    comment: 'Nom unique généré pour le stockage (uuid)'
  },
  chemin: {
    type: DataTypes.STRING(500), allowNull: false,
    comment: 'Chemin complet vers le fichier sur le serveur'
  },
  type_mime: { type: DataTypes.STRING(50), allowNull: true },
  taille: { type: DataTypes.INTEGER, allowNull: true, comment: 'Taille du fichier en octets' },
  description: { type: DataTypes.STRING(300), allowNull: true },
  eleve_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'eleves', key: 'id' }
  }
}, { tableName: 'documents' });

module.exports = Document;
