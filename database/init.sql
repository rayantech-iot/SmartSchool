CREATE DATABASE IF NOT EXISTS smartschool
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartschool;

CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(30) DEFAULT NULL,
  type ENUM('admin','professeur','eleve','parent') NOT NULL,
  statut ENUM('actif','inactif','en_attente') NOT NULL DEFAULT 'en_attente',
  type_utilisateur VARCHAR(50) DEFAULT NULL,
  doit_changer_mot_de_passe TINYINT(1) NOT NULL DEFAULT 0,
  derniere_connexion DATETIME DEFAULT NULL,
  rgpd_consent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_statut (statut),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS professeurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL UNIQUE,
  specialite VARCHAR(100) DEFAULT NULL,
  grade VARCHAR(50) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_professeur_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL UNIQUE,
  niveau_acces VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS classes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  niveau VARCHAR(50) NOT NULL,
  cycle VARCHAR(20) DEFAULT NULL,
  salle VARCHAR(20) DEFAULT NULL,
  capacite INT UNSIGNED NOT NULL DEFAULT 30,
  annee_scolaire VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_annee_scolaire (annee_scolaire),
  INDEX idx_niveau (niveau),
  INDEX idx_cycle (cycle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Élèves
-- =============================
CREATE TABLE IF NOT EXISTS eleves (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL UNIQUE,
  classe_id INT UNSIGNED DEFAULT NULL,
  matricule VARCHAR(30) DEFAULT NULL UNIQUE,
  date_naissance DATE DEFAULT NULL,
  lieu_naissance VARCHAR(100) DEFAULT NULL,
  sexe ENUM('M','F') DEFAULT NULL,
  adresse TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_classe_id (classe_id),
  CONSTRAINT fk_eleve_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_eleve_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Parents
-- =============================
CREATE TABLE IF NOT EXISTS parents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL UNIQUE,
  eleve_id INT UNSIGNED DEFAULT NULL,
  lien VARCHAR(50) DEFAULT NULL,
  profession VARCHAR(100) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_eleve_id (eleve_id),
  CONSTRAINT fk_parent_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Matières
-- =============================
CREATE TABLE IF NOT EXISTS matieres (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  code VARCHAR(10) DEFAULT NULL,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  volume_horaire INT UNSIGNED NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Liaison Classe ↔ Matière
-- =============================
CREATE TABLE IF NOT EXISTS classe_matieres (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classe_id INT UNSIGNED NOT NULL,
  matiere_id INT UNSIGNED NOT NULL,
  coefficient DECIMAL(4,2) NOT NULL DEFAULT 2.00,
  volume_horaire_hebdo INT UNSIGNED NOT NULL DEFAULT 2,
  UNIQUE KEY uk_classe_matiere (classe_id, matiere_id),
  CONSTRAINT fk_cm_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Liaison Professeur ↔ Classe
-- =============================
CREATE TABLE IF NOT EXISTS professeur_classes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  professeur_id INT UNSIGNED NOT NULL,
  classe_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uk_prof_classe (professeur_id, classe_id),
  CONSTRAINT fk_pc_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Liaison Professeur ↔ Matière
-- =============================
CREATE TABLE IF NOT EXISTS professeur_matieres (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  professeur_id INT UNSIGNED NOT NULL,
  matiere_id INT UNSIGNED NOT NULL,
  UNIQUE KEY uk_prof_matiere (professeur_id, matiere_id),
  CONSTRAINT fk_pm_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Devoirs
-- =============================
CREATE TABLE IF NOT EXISTS devoirs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classe_id INT UNSIGNED NOT NULL,
  matiere_id INT UNSIGNED NOT NULL,
  professeur_id INT UNSIGNED NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  date_rendu DATETIME DEFAULT NULL,
  fichier VARCHAR(255) DEFAULT NULL,
  note_sur DECIMAL(4,1) NOT NULL DEFAULT 20.0,
  publie TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_classe_id (classe_id),
  INDEX idx_matiere_id (matiere_id),
  INDEX idx_professeur_id (professeur_id),
  CONSTRAINT fk_devoir_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_devoir_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
  CONSTRAINT fk_devoir_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Notes
-- =============================
CREATE TABLE IF NOT EXISTS notes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eleve_id INT UNSIGNED NOT NULL,
  devoir_id INT UNSIGNED DEFAULT NULL,
  matiere_id INT UNSIGNED NOT NULL,
  classe_id INT UNSIGNED NOT NULL,
  professeur_id INT UNSIGNED NOT NULL,
  valeur DECIMAL(5,2) NOT NULL,
  appreciation VARCHAR(255) DEFAULT NULL,
  trimestre TINYINT UNSIGNED DEFAULT NULL,
  semestre VARCHAR(20) DEFAULT NULL,
  annee_scolaire VARCHAR(20) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_eleve_id (eleve_id),
  INDEX idx_matiere_id (matiere_id),
  INDEX idx_classe_id (classe_id),
  INDEX idx_devoir_id (devoir_id),
  CONSTRAINT fk_note_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_devoir FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE SET NULL,
  CONSTRAINT fk_note_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Bulletins
-- =============================
CREATE TABLE IF NOT EXISTS bulletins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eleve_id INT UNSIGNED NOT NULL,
  classe_id INT UNSIGNED NOT NULL,
  trimestre TINYINT UNSIGNED DEFAULT NULL,
  annee_scolaire VARCHAR(20) NOT NULL,
  moyenne_generale DECIMAL(5,2) DEFAULT NULL,
  appreciation TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bulletin (eleve_id, classe_id, trimestre, annee_scolaire),
  CONSTRAINT fk_bulletin_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
  CONSTRAINT fk_bulletin_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Emplois du temps
-- =============================
CREATE TABLE IF NOT EXISTS emplois_du_temps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classe_id INT UNSIGNED NOT NULL,
  semestre VARCHAR(20) NOT NULL DEFAULT 'annuel',
  actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_edt_classe_semestre (classe_id, semestre),
  CONSTRAINT fk_edt_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Séances
-- =============================
CREATE TABLE IF NOT EXISTS seances (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  emploi_du_temps_id INT UNSIGNED NOT NULL,
  matiere_id INT UNSIGNED NOT NULL,
  professeur_id INT UNSIGNED NOT NULL,
  jour VARCHAR(15) NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle VARCHAR(20) DEFAULT NULL,
  type_seance VARCHAR(50) DEFAULT 'cours',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_edt_id (emploi_du_temps_id),
  INDEX idx_professeur_id (professeur_id),
  INDEX idx_matiere_id (matiere_id),
  CONSTRAINT fk_seance_edt FOREIGN KEY (emploi_du_temps_id) REFERENCES emplois_du_temps(id) ON DELETE CASCADE,
  CONSTRAINT fk_seance_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
  CONSTRAINT fk_seance_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Présences
-- =============================
CREATE TABLE IF NOT EXISTS presences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seance_id INT UNSIGNED NOT NULL,
  eleve_id INT UNSIGNED NOT NULL,
  professeur_id INT UNSIGNED NOT NULL,
  statut ENUM('present','absent','retard') NOT NULL DEFAULT 'present',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_presence_seance_eleve (seance_id, eleve_id),
  CONSTRAINT fk_presence_seance FOREIGN KEY (seance_id) REFERENCES seances(id) ON DELETE CASCADE,
  CONSTRAINT fk_presence_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
  CONSTRAINT fk_presence_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Absences
-- =============================
CREATE TABLE IF NOT EXISTS absences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eleve_id INT UNSIGNED NOT NULL,
  presence_id INT UNSIGNED DEFAULT NULL,
  seance_id INT UNSIGNED DEFAULT NULL,
  justifiee TINYINT(1) NOT NULL DEFAULT 0,
  motif TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_eleve_id (eleve_id),
  INDEX idx_presence_id (presence_id),
  CONSTRAINT fk_absence_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
  CONSTRAINT fk_absence_presence FOREIGN KEY (presence_id) REFERENCES presences(id) ON DELETE SET NULL,
  CONSTRAINT fk_absence_seance FOREIGN KEY (seance_id) REFERENCES seances(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Messages
-- =============================
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expediteur_id INT UNSIGNED NOT NULL,
  destinataire_id INT UNSIGNED NOT NULL,
  sujet VARCHAR(255) NOT NULL,
  corps TEXT NOT NULL,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  lu_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_expediteur (expediteur_id),
  INDEX idx_destinataire (destinataire_id),
  INDEX idx_lu (lu),
  CONSTRAINT fk_message_expediteur FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_destinataire FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Documents
-- =============================
CREATE TABLE IF NOT EXISTS documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eleve_id INT UNSIGNED DEFAULT NULL,
  professeur_id INT UNSIGNED DEFAULT NULL,
  classe_id INT UNSIGNED DEFAULT NULL,
  matiere_id INT UNSIGNED DEFAULT NULL,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  chemin VARCHAR(500) NOT NULL,
  taille INT UNSIGNED DEFAULT 0,
  description TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_eleve_id (eleve_id),
  INDEX idx_professeur_id (professeur_id),
  INDEX idx_classe_id (classe_id),
  INDEX idx_matiere_id (matiere_id),
  CONSTRAINT fk_doc_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_professeur FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE SET NULL,
  CONSTRAINT fk_doc_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
  CONSTRAINT fk_doc_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Notifications
-- =============================
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  titre VARCHAR(255) NOT NULL,
  message TEXT DEFAULT NULL,
  type ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  lu TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_lu (lu),
  CONSTRAINT fk_notif_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Password reset tokens
-- =============================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expire_le DATETIME NOT NULL,
  utilise TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_token (token),
  CONSTRAINT fk_prt_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Logs d'activité (audit trail)
-- =============================
CREATE TABLE IF NOT EXISTS logs_activite (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  ip_adresse VARCHAR(45) DEFAULT NULL,
  date_action DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_action (action),
  INDEX idx_date_action (date_action),
  CONSTRAINT fk_log_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Demandes de liaison parent-élève
-- =============================
CREATE TABLE IF NOT EXISTS demandes_liaison (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  eleve_id INT UNSIGNED NOT NULL,
  code VARCHAR(10) NOT NULL,
  statut ENUM('en_attente','valide','refuse') NOT NULL DEFAULT 'en_attente',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_eleve_id (eleve_id),
  INDEX idx_code (code),
  INDEX idx_statut (statut),
  CONSTRAINT fk_dl_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_dl_eleve FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
