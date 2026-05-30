// ============================================================
// models/ClasseMatiere.js — Matière par classe (coef, volume)
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClasseMatiere = sequelize.define('ClasseMatiere', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  classe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'classes', key: 'id' }
  },
  matiere_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'matieres', key: 'id' }
  },
  coefficient: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    defaultValue: 1.0
  },
  volume_horaire_hebdo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    comment: 'Heures par semaine pour cette matière dans cette classe'
  }
}, {
  tableName: 'classe_matieres',
  indexes: [{ unique: true, fields: ['classe_id', 'matiere_id'] }]
});

module.exports = ClasseMatiere;
