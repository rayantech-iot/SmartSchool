// ============================================================
// models/Eleve.js — Modèle représentant un élève
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ELEVE — hérite de UTILISATEUR (via utilisateur_id)
 * L'élève est le bénéficiaire principal du système
 * Il appartient à une classe et a accès à ses notes, devoirs, présences
 */
const Eleve = sequelize.define('Eleve', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilisateurs',
      key: 'id'
    },
    comment: 'Référence vers le compte utilisateur'
  },
  classe_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'classes',
      key: 'id'
    },
    comment: 'Classe dans laquelle est inscrit l\'élève'
  },
  matricule: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'Numéro de matricule de l\'élève'
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date de naissance de l\'élève'
  },
  lieu_naissance: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'eleves'
});

module.exports = Eleve;
