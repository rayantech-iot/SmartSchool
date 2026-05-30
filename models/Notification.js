// ============================================================
// models/Notification.js — Alertes in-app (absence, note, message)
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * NOTIFICATION — alerte un utilisateur (parent surtout) d'un événement
 */
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'utilisateurs', key: 'id' }
  },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: true },
  type: {
    type: DataTypes.ENUM('absence', 'note', 'message', 'devoir', 'systeme'),
    defaultValue: 'systeme'
  },
  lien: { type: DataTypes.STRING(255), allowNull: true, comment: 'URL relative de redirection' },
  lu: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'notifications' });

module.exports = Notification;
