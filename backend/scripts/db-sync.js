require('dotenv').config();
const { testConnection } = require('../config/db');

(async () => {
  try {
    await testConnection();
    console.log('Connexion MySQL OK. (Schema is managed via raw SQL / migrations.)');
    process.exit(0);
  } catch (err) {
    console.error('Erreur connexion:', err.message);
    process.exit(1);
 }
})();
