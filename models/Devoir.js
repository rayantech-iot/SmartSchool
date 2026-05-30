// models/Devoir.js — Modèle des devoirs publiés par les professeurs
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * DEVOIR — publié par un professeur pour une classe précise
 * Toujours destiné à une seule classe
 */
const Devoir = sequelize.define('Devoir', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titre: { type: DataTypes.STRING(200), allowNull: false, comment: 'Titre du devoir' },
  description: { type: DataTypes.TEXT, allowNull: true, comment: 'Contenu et consignes du devoir' },
  date_limite: { type: DataTypes.DATEONLY, allowNull: false, comment: 'Date de remise du devoir' },
  date_publication: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  professeur_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'professeurs', key: 'id' },
    comment: 'Professeur ayant publié le devoir'
  },
  classe_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'classes', key: 'id' },
    comment: 'Classe ciblée — obligatoire'
  },
  matiere_id: {
    type: DataTypes.INTEGER, allowNull: true,
    references: { model: 'matieres', key: 'id' }
  },
  statut: {
    type: DataTypes.ENUM('publié', 'brouillon', 'archivé'),
    defaultValue: 'publié'
  },
  fichier: {
    type: DataTypes.STRING(500), allowNull: true,
    comment: 'Chemin du fichier joint (PDF, DOCX, JPG, PNG)'
  },
  fichier_nom: {
    type: DataTypes.STRING(255), allowNull: true,
    comment: 'Nom original du fichier pour l\'affichage'
  }
}, { tableName: 'devoirs' });

module.exports = Devoir;
