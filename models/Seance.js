// models/Seance.js — Modèle d'une séance dans l'emploi du temps
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * SEANCE — une plage horaire dans l'emploi du temps
 * Associée à une matière, un professeur et une salle
 */
const Seance = sequelize.define('Seance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  jour: {
    type: DataTypes.ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'),
    allowNull: false
  },
  heure_debut: { type: DataTypes.TIME, allowNull: false },
  heure_fin: { type: DataTypes.TIME, allowNull: false },
  salle: { type: DataTypes.STRING(20), allowNull: true },
  emploi_du_temps_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'emplois_du_temps', key: 'id' }
  },
  matiere_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'matieres', key: 'id' }
  },
  professeur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'professeurs', key: 'id' }
  }
}, { tableName: 'seances' });

module.exports = Seance;
