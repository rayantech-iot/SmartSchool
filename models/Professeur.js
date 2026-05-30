// models/Professeur.js — Modèle représentant un professeur
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PROFESSEUR — hérite de UTILISATEUR
 * Acteur central de la gestion pédagogique
 * Peut être affecté à plusieurs matières et plusieurs classes
 */
const Professeur = sequelize.define('Professeur', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  utilisateur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'utilisateurs', key: 'id' },
    comment: 'Référence vers le compte utilisateur'
  },
  specialite: {
    type: DataTypes.STRING(100), allowNull: true,
    comment: 'Spécialité principale du professeur'
  },
  grade: {
    type: DataTypes.STRING(50), allowNull: true,
    comment: 'Grade académique (ex: Certifié, Agrégé)'
  },
  date_embauche: { type: DataTypes.DATEONLY, allowNull: true }
}, { tableName: 'professeurs' });

module.exports = Professeur;
