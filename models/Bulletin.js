// models/Bulletin.js — Modèle des bulletins scolaires
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * BULLETIN — généré par le professeur pour un élève et une période
 * Agrège toutes les notes pour calculer la moyenne générale
 */
const Bulletin = sequelize.define('Bulletin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  periode: {
    type: DataTypes.ENUM('trimestre1', 'trimestre2', 'trimestre3', 'semestre1', 'semestre2', 'annuel'),
    allowNull: false
  },
  annee_scolaire: { type: DataTypes.STRING(9), allowNull: false, defaultValue: '2024-2025' },
  moyenne_generale: {
    type: DataTypes.DECIMAL(4, 2), allowNull: true,
    comment: 'Moyenne générale calculée automatiquement'
  },
  rang: { type: DataTypes.INTEGER, allowNull: true, comment: 'Rang dans la classe' },
  appreciation_generale: { type: DataTypes.TEXT, allowNull: true },
  date_generation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  eleve_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'eleves', key: 'id' }
  },
  classe_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'classes', key: 'id' }
  }
}, { tableName: 'bulletins' });

module.exports = Bulletin;
