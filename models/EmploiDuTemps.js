// models/EmploiDuTemps.js — Modèle de l'emploi du temps d'une classe
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EMPLOI_DU_TEMPS — planning hebdomadaire associé à une classe
 * Construit par l'administrateur séance par séance
 */
const EmploiDuTemps = sequelize.define('EmploiDuTemps', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  classe_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'classes', key: 'id' }
  },
  annee_scolaire: { type: DataTypes.STRING(9), allowNull: false, defaultValue: '2024-2025' },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2', 'annuel'),
    defaultValue: 'annuel'
  },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'emplois_du_temps' });

module.exports = EmploiDuTemps;
