// models/Parent.js — Modèle représentant un parent d'élève
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PARENT — hérite de ELEVE dans la hiérarchie fonctionnelle
 * Le parent accède aux mêmes données que son enfant
 * Il peut en plus justifier les absences et contacter les professeurs
 */
const Parent = sequelize.define('Parent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  utilisateur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'utilisateurs', key: 'id' }
  },
  eleve_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'eleves', key: 'id' },
    comment: 'Enfant associé à ce parent'
  },
  lien: {
    type: DataTypes.ENUM('père', 'mère', 'tuteur', 'autre'),
    defaultValue: 'tuteur',
    comment: 'Lien de parenté avec l\'élève'
  },
  profession: { type: DataTypes.STRING(100), allowNull: true }
}, { tableName: 'parents' });

module.exports = Parent;
