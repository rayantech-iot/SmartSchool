// ============================================================
// seeders/demo.js — Données de démonstration SmartSchool
// Usage : npm run seed
// ============================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const { sequelize } = require('../config/database');
const {
  Utilisateur, Professeur, Eleve, Parent, Admin,
  Classe, Matiere, ClasseMatiere, Devoir, Note, Bulletin,
  EmploiDuTemps, Seance, Message, Notification
} = require('../models');
const { getAnneeScolaireCourante } = require('../services/schoolYearService');
const classService = require('../services/classService');

const SALT_ROUNDS = 12;
const ANNEE = getAnneeScolaireCourante();

async function creerUtilisateur({ nom, prenom, email, motDePasse, type, telephone }) {
  const hash = await bcrypt.hash(motDePasse, SALT_ROUNDS);
  return Utilisateur.create({
    nom, prenom, email: email.toLowerCase(), mot_de_passe: hash, type, telephone, statut: 'actif'
  });
}

async function seed() {
  try {
    console.log('🌱 Démarrage du seed SmartSchool...');
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    await sequelize.sync({ force: true });
    console.log('✅ Base de données réinitialisée.');

    const userAdmin = await creerUtilisateur({
      nom: 'ADMIN', prenom: 'Système', email: 'admin@smartschool.tg',
      motDePasse: 'Admin123!', type: 'admin', telephone: '+228 90 00 00 01'
    });
    await Admin.create({ utilisateur_id: userAdmin.id, niveau_acces: 'super_admin' });

    const matiereMaths = await Matiere.create({ nom: 'Mathématiques', code: 'MATH', coefficient: 4, volume_horaire: 4, description: 'Maths générales' });
    const matiereFrancais = await Matiere.create({ nom: 'Français', code: 'FR', coefficient: 3, volume_horaire: 4, description: 'Français' });
    const matierePhysique = await Matiere.create({ nom: 'Physique-Chimie', code: 'PC', coefficient: 3, volume_horaire: 3, description: 'Sciences' });
    const matiereAnglais = await Matiere.create({ nom: 'Anglais', code: 'ANG', coefficient: 2, volume_horaire: 2, description: 'Langue vivante' });

    const { classe: classeTerminale } = await classService.creerClasse({
      cycle: 'lycee', niveau: 'Terminale', annee_scolaire: ANNEE
    });
    const { classe: classe3eme } = await classService.creerClasse({
      cycle: 'college', niveau: 'Troisième', annee_scolaire: ANNEE
    });

    for (const [classe, matieresConfig] of [
      [classeTerminale, [
        [matiereMaths, 4, 4], [matiereFrancais, 3, 4], [matierePhysique, 3, 3], [matiereAnglais, 2, 2]
      ]],
      [classe3eme, [
        [matiereMaths, 3, 4], [matiereFrancais, 3, 4], [matiereAnglais, 2, 2]
      ]]
    ]) {
      for (const [mat, coef, vol] of matieresConfig) {
        await ClasseMatiere.create({
          classe_id: classe.id, matiere_id: mat.id, coefficient: coef, volume_horaire_hebdo: vol
        });
      }
    }

    const userProf = await creerUtilisateur({
      nom: 'KOFFI', prenom: 'Komlan', email: 'prof.koffi@smartschool.tg',
      motDePasse: 'Prof123!', type: 'professeur', telephone: '+228 90 11 22 33'
    });
    const professeur = await Professeur.create({
      utilisateur_id: userProf.id, specialite: 'Mathématiques', grade: 'Certifié', date_embauche: '2018-09-01'
    });
    await professeur.setClasses([classeTerminale, classe3eme]);
    await professeur.setMatieres([matiereMaths, matierePhysique, matiereFrancais]);

    const userProf2 = await creerUtilisateur({
      nom: 'ABLA', prenom: 'Afi', email: 'prof.abla@smartschool.tg',
      motDePasse: 'Prof123!', type: 'professeur', telephone: '+228 90 11 22 34'
    });
    const professeur2 = await Professeur.create({
      utilisateur_id: userProf2.id, specialite: 'Anglais', date_embauche: '2020-09-01'
    });
    await professeur2.setClasses([classeTerminale, classe3eme]);
    await professeur2.setMatieres([matiereAnglais, matiereFrancais]);

    const userEleve = await creerUtilisateur({
      nom: 'AMEDE', prenom: 'Kodjo', email: 'eleve.amede@smartschool.tg',
      motDePasse: 'Eleve123!', type: 'eleve', telephone: '+228 91 22 33 44'
    });
    const eleve = await Eleve.create({
      utilisateur_id: userEleve.id, classe_id: classeTerminale.id,
      matricule: 'SS-2025-001', date_naissance: '2007-03-15', sexe: 'M', lieu_naissance: 'Lomé'
    });

    const userParent = await creerUtilisateur({
      nom: 'AMEDE', prenom: 'Akossiwa', email: 'parent.amede@smartschool.tg',
      motDePasse: 'Parent123!', type: 'parent', telephone: '+228 92 33 44 55'
    });
    await Parent.create({
      utilisateur_id: userParent.id, eleve_id: eleve.id, lien: 'mère', profession: 'Commerçante'
    });

    const emploi = await EmploiDuTemps.findOne({ where: { classe_id: classeTerminale.id } });
    const seancesData = [
      { jour: 'Lundi', heure_debut: '08:00', heure_fin: '10:00', matiere_id: matiereMaths.id, professeur_id: professeur.id },
      { jour: 'Lundi', heure_debut: '10:30', heure_fin: '12:00', matiere_id: matiereFrancais.id, professeur_id: professeur.id },
      { jour: 'Mardi', heure_debut: '08:00', heure_fin: '10:00', matiere_id: matierePhysique.id, professeur_id: professeur.id },
      { jour: 'Mercredi', heure_debut: '14:00', heure_fin: '16:00', matiere_id: matiereAnglais.id, professeur_id: professeur2.id },
      { jour: 'Vendredi', heure_debut: '08:00', heure_fin: '10:00', matiere_id: matiereMaths.id, professeur_id: professeur.id }
    ];
    for (const s of seancesData) {
      await Seance.create({ emploi_du_temps_id: emploi.id, salle: classeTerminale.salle, ...s });
    }

    await Devoir.create({
      titre: 'Exercices sur les fonctions',
      description: 'Faire les exercices 1 à 15 page 42.',
      date_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      statut: 'publié', professeur_id: professeur.id, classe_id: classeTerminale.id, matiere_id: matiereMaths.id
    });

    const notesData = [
      { valeur: 14.5, matiere_id: matiereMaths.id, type_evaluation: 'devoir' },
      { valeur: 16, matiere_id: matiereMaths.id, type_evaluation: 'composition' },
      { valeur: 12, matiere_id: matiereFrancais.id, type_evaluation: 'devoir' },
      { valeur: 13.5, matiere_id: matierePhysique.id, type_evaluation: 'pratique' },
      { valeur: 15, matiere_id: matiereAnglais.id, type_evaluation: 'oral' }
    ];
    for (const n of notesData) {
      await Note.create({
        ...n, eleve_id: eleve.id, professeur_id: professeur.id,
        periode: 'trimestre1', date_evaluation: '2025-10-15', appreciation: 'Bon travail'
      });
    }

    await Bulletin.create({
      eleve_id: eleve.id, classe_id: classeTerminale.id,
      periode: 'trimestre1', annee_scolaire: ANNEE,
      moyenne_generale: 14.2,
      appreciation_generale: 'Très bien — Encouragements',
      date_generation: new Date()
    });

    await Message.create({
      sujet: 'Bienvenue sur SmartSchool',
      contenu: 'Bienvenue sur la plateforme SmartSchool.',
      expediteur_id: userProf.id, destinataire_id: userParent.id,
      type_envoi: 'individuel', lu: false
    });

    await Notification.create({
      utilisateur_id: userParent.id,
      titre: 'Bienvenue',
      contenu: 'Votre espace parent est actif.',
      type: 'systeme', lien: '/parent/dashboard', lu: false
    });

    console.log('\n✅ Seed terminé ! Année scolaire :', ANNEE);
    console.log('  Admin      : admin@smartschool.tg / Admin123!');
    console.log('  Professeur : prof.koffi@smartschool.tg / Prof123!');
    console.log('  Élève      : eleve.amede@smartschool.tg / Eleve123!');
    console.log('  Parent     : parent.amede@smartschool.tg / Parent123!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
  }
}

seed();
