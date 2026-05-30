// models/Message.js — Modèle de la messagerie interne
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * MESSAGE — système de messagerie interne
 * Un message a un expéditeur et peut avoir plusieurs destinataires
 * Gère envoi individuel et envoi groupé à toute une classe
 */
const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sujet: { type: DataTypes.STRING(200), allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  expediteur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'utilisateurs', key: 'id' },
    comment: 'Utilisateur ayant envoyé le message'
  },
  destinataire_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'utilisateurs', key: 'id' },
    comment: 'Utilisateur destinataire'
  },
  lu: { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'Message lu ou non' },
  date_lecture: { type: DataTypes.DATE, allowNull: true },
  type_envoi: {
    type: DataTypes.ENUM('individuel', 'classe'),
    defaultValue: 'individuel'
  }
}, { tableName: 'messages' });

module.exports = Message;
