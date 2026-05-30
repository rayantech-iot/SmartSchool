// ============================================================
// models/Matiere.js — Modèle des matières enseignées
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * MATIERE — représente une matière enseignée (Maths, Français, etc.)
 * Chaque matière a un coefficient pour le calcul de la moyenne pondérée
 */
const Matiere = sequelize.define('Matiere', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom de la matière (ex: Mathématiques, Français)'
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Code court de la matière (ex: MATH, FR)'
  },
  coefficient: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    defaultValue: 1.0,
    comment: 'Coefficient par défaut (peut varier par classe via ClasseMatiere)'
  },
  volume_horaire: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    comment: 'Volume horaire hebdomadaire en heures'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'matieres'
});

module.exports = Matiere;
