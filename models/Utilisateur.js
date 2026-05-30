// ============================================================
// models/Utilisateur.js — Modèle de base pour tous les utilisateurs
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * UTILISATEUR — entité racine de la hiérarchie des acteurs
 * Tous les autres acteurs (Professeur, Eleve, Admin, Parent) héritent de cette entité
 * Le champ 'type' (discriminateur) permet de distinguer les rôles
 */
const Utilisateur = sequelize.define('Utilisateur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique de l\'utilisateur'
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom de famille de l\'utilisateur'
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Prénom de l\'utilisateur'
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: 'Adresse email unique — utilisée pour la connexion'
  },
  mot_de_passe: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Mot de passe hashé avec bcrypt (jamais en clair)'
  },
  type: {
    type: DataTypes.ENUM('admin', 'professeur', 'eleve', 'parent'),
    allowNull: false,
    comment: 'Rôle de l\'utilisateur dans le système'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'en_attente'),
    defaultValue: 'actif',
    comment: 'actif, inactif ou en_attente (inscription à valider)'
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Numéro de téléphone (facultatif)'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Chemin vers la photo de profil'
  },
  derniere_connexion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date et heure de la dernière connexion'
  },
  doit_changer_mot_de_passe: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Forcer le changement de mot de passe à la prochaine connexion'
  }
}, {
  tableName: 'utilisateurs',
  comment: 'Table principale des utilisateurs du système SmartSchool'
});

module.exports = Utilisateur;
