// models/Note.js — Modèle des notes des élèves
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * NOTE — saisie par un professeur pour un élève dans une matière
 * La saisie déclenche automatiquement le recalcul de la moyenne
 */
const Note = sequelize.define('Note', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  valeur: {
    type: DataTypes.DECIMAL(4, 2), allowNull: false,
    validate: { min: 0, max: 20 },
    comment: 'Note entre 0 et 20'
  },
  type_evaluation: {
    type: DataTypes.ENUM('devoir', 'composition', 'oral', 'pratique', 'examen'),
    defaultValue: 'devoir',
    comment: 'Type d\'évaluation'
  },
  date_evaluation: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  periode: {
    type: DataTypes.ENUM('trimestre1', 'trimestre2', 'trimestre3', 'semestre1', 'semestre2', 'annuel'),
    allowNull: false,
    comment: 'Période de l\'évaluation'
  },
  appreciation: { type: DataTypes.STRING(200), allowNull: true },
  eleve_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'eleves', key: 'id' }
  },
  matiere_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'matieres', key: 'id' }
  },
  professeur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'professeurs', key: 'id' }
  }
}, { tableName: 'notes' });

module.exports = Note;
