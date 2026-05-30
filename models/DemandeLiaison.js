// ============================================================
// models/DemandeLiaison.js — Demande parent ↔ élève (inscription)
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DemandeLiaison = sequelize.define('DemandeLiaison', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'utilisateurs', key: 'id' },
    comment: 'Compte parent (null si demande par email seul)'
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  eleve_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'eleves', key: 'id' }
  },
  matricule: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  date_naissance_eleve: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  lien: {
    type: DataTypes.ENUM('père', 'mère', 'tuteur', 'autre'),
    defaultValue: 'tuteur'
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'refuse'),
    defaultValue: 'en_attente'
  },
  message_admin: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'demandes_liaison'
});

module.exports = DemandeLiaison;
