// models/Admin.js — Modèle représentant un administrateur système
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ADMIN — hérite de UTILISATEUR
 * Gère la structure du système en arrière-plan
 * Crée comptes, classes, matières, emploi du temps
 */
const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  utilisateur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'utilisateurs', key: 'id' }
  },
  niveau_acces: {
    type: DataTypes.ENUM('super_admin', 'admin'),
    defaultValue: 'admin',
    comment: 'Niveau de privilèges administrateur'
  }
}, { tableName: 'admins' });

module.exports = Admin;
