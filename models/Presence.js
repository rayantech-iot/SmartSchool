// models/Presence.js — Modèle des présences par séance
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PRESENCE — enregistrée par le professeur séance par séance
 * Si statut = 'absent', crée automatiquement une entrée Absence
 */
const Presence = sequelize.define('Presence', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  statut: {
    type: DataTypes.ENUM('présent', 'absent', 'retard', 'excusé'),
    allowNull: false,
    comment: 'Statut de présence de l\'élève'
  },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  heure_debut: { type: DataTypes.TIME, allowNull: true },
  observation: { type: DataTypes.STRING(200), allowNull: true },
  eleve_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'eleves', key: 'id' }
  },
  seance_id: {
    type: DataTypes.INTEGER, allowNull: true,
    references: { model: 'seances', key: 'id' }
  },
  professeur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'professeurs', key: 'id' }
  }
}, { tableName: 'presences' });

module.exports = Presence;
