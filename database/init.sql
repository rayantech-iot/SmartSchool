-- ============================================================
-- SmartSchool — Script d'initialisation MySQL
-- Exécuter dans MySQL Workbench ou en ligne de commande
-- ============================================================

CREATE DATABASE IF NOT EXISTS smartschool
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartschool;

-- Les tables sont créées automatiquement par Sequelize au démarrage (sequelize.sync)
-- ou via : npm run seed (réinitialise avec données de démo)

-- Vérification
SHOW TABLES;
