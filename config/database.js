// ============================================================
// config/database.js — Connexion Sequelize avec MySQL
// ============================================================
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Création de l'instance Sequelize avec les variables d'environnement
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nom de la base de données
  process.env.DB_USER,      // Utilisateur MySQL
  process.env.DB_PASSWORD,  // Mot de passe MySQL
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 10,        // Connexions simultanées maximum
      min: 0,
      acquire: 30000, // Délai d'attente avant erreur (ms)
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',     // Support des caractères spéciaux et emojis
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,       // createdAt et updatedAt automatiques
      underscored: true       // Nommage snake_case en base
    }
  }
);

/**
 * Teste la connexion à la base de données au démarrage
 * Arrête le processus si la connexion échoue
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion MySQL établie avec succès.');
  } catch (error) {
    console.error('❌ Impossible de se connecter à MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
