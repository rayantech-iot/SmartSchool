// ============================================================
// models/Classe.js — Modèle des classes scolaires
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CLASSE — représente une classe scolaire (ex: 6ème A, 3ème B, Terminale C)
 * Créée et gérée par l'administrateur
 * Contient des élèves et est associée à un emploi du temps
 */
const Classe = sequelize.define('Classe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cycle: {
    type: DataTypes.ENUM('primaire', 'college', 'lycee'),
    allowNull: false,
    defaultValue: 'lycee',
    comment: 'Cycle : primaire, collège ou lycée'
  },
  nom: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Section automatique (A, B, C…)'
  },
  niveau: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Niveau scolaire (CP1, Sixième, Terminale…)'
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 40,
    comment: 'Nombre maximum d\'élèves dans la classe'
  },
  annee_scolaire: {
    type: DataTypes.STRING(9),
    allowNull: false,
    defaultValue: '2024-2025',
    comment: 'Année scolaire (ex: 2024-2025)'
  },
  salle: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Salle principale de la classe'
  }
}, {
  tableName: 'classes'
});

module.exports = Classe;
