// ============================================================
// scripts/db-sync.js — Met à jour le schéma MySQL (ALTER tables)
// Usage : npm run db:sync
// À lancer uniquement après modification des modèles Sequelize
// ============================================================
require('dotenv').config();
const { sequelize } = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion MySQL OK. Synchronisation du schéma (alter)...');
    await sequelize.sync({ alter: true });
    console.log('Schéma synchronisé avec succès.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur sync:', err.message);
    process.exit(1);
  }
})();
