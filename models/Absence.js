// models/Absence.js — Modèle des absences (créées automatiquement)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ABSENCE — créée automatiquement quand une présence est marquée 'absent'
 * Le parent peut justifier l'absence en ajoutant un motif
 */
const Absence = sequelize.define('Absence', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  justifiee: {
    type: DataTypes.BOOLEAN, defaultValue: false,
    comment: 'L\'absence a-t-elle été justifiée par le parent ?'
  },
  motif: {
    type: DataTypes.TEXT, allowNull: true,
    comment: 'Motif de l\'absence fourni par le parent'
  },
  date_justification: { type: DataTypes.DATE, allowNull: true },
  eleve_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'eleves', key: 'id' }
  },
  presence_id: {
    type: DataTypes.INTEGER, allowNull: true,
    references: { model: 'presences', key: 'id' },
    comment: 'Présence source ayant déclenché cette absence'
  },
  seance_id: {
    type: DataTypes.INTEGER, allowNull: true,
    references: { model: 'seances', key: 'id' }
  }
}, { tableName: 'absences' });

module.exports = Absence;
