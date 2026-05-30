// ============================================================
// models/LogActivite.js — Journal d'activité / traçabilité
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogActivite = sequelize.define('LogActivite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'utilisateurs', key: 'id' }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_adresse: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  date_action: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'log_activites',
  updatedAt: false,
  createdAt: 'date_action'
});

module.exports = LogActivite;
