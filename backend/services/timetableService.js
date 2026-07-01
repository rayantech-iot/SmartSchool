const db = require('../config/db');
const { Seance, EmploiDuTemps, Classe, ClasseMatiere, Professeur, Matiere } = require('../models');
const { JOURS_SEMAINE, CRENEAUX_HORAIRES, creneauxSeChevauchent, chevauchePause, normaliserHeure } = require('../config/schoolConfig');
const { getAnneeScolaireCourante } = require('./schoolYearService');
const classService = require('./classService');

function dureeMinutes(debut, fin) {
  const [h1, m1] = normaliserHeure(debut).split(':').map(Number);
  const [h2, m2] = normaliserHeure(fin).split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function dureeHeures(debut, fin) {
  return dureeMinutes(debut, fin) / 60;
}

async function conflitProfesseur(professeurId, jour, heureDebut, heureFin, excludeSeanceId = null) {
  const params = [professeurId, jour];
  let sql = 'SELECT * FROM seances WHERE professeur_id = ? AND jour = ?';
  if (excludeSeanceId) { sql += ' AND id != ?'; params.push(excludeSeanceId); }
  const seances = await db.query(sql, params);
  return seances.some((s) => creneauxSeChevauchent(heureDebut, heureFin, s.heure_debut, s.heure_fin));
}

async function conflitClasse(emploiDuTempsId, jour, heureDebut, heureFin, excludeSeanceId = null) {
  const params = [emploiDuTempsId, jour];
  let sql = 'SELECT * FROM seances WHERE emploi_du_temps_id = ? AND jour = ?';
  if (excludeSeanceId) { sql += ' AND id != ?'; params.push(excludeSeanceId); }
  const seances = await db.query(sql, params);
  return seances.some((s) => creneauxSeChevauchent(heureDebut, heureFin, s.heure_debut, s.heure_fin));
}

async function conflitSalle(salle, jour, heureDebut, heureFin, excludeSeanceId = null) {
  if (!salle || !salle.trim()) return false;
  const params = [salle.trim(), jour];
  let sql = 'SELECT * FROM seances WHERE salle = ? AND jour = ?';
  if (excludeSeanceId) { sql += ' AND id != ?'; params.push(excludeSeanceId); }
  const seances = await db.query(sql, params);
  return seances.some((s) => creneauxSeChevauchent(heureDebut, heureFin, s.heure_debut, s.heure_fin));
}

async function professeurEnseigneMatiere(professeurId, matiereId) {
  const rows = await db.query('SELECT 1 FROM professeur_matieres WHERE professeur_id = ? AND matiere_id = ? LIMIT 1', [professeurId, matiereId]);
  return rows.length > 0;
}

async function validerSeance({ emploi_du_temps_id, jour, heure_debut, heure_fin, matiere_id, professeur_id, salle, excludeSeanceId }) {
  const erreurs = [];
  const debut = normaliserHeure(heure_debut);
  const fin = normaliserHeure(heure_fin);

  if (!JOURS_SEMAINE.includes(jour)) erreurs.push('Jour invalide.');
  if (fin <= debut) erreurs.push('L\'heure de fin doit être après l\'heure de début.');
  if (dureeMinutes(debut, fin) < 30) erreurs.push('Durée minimale : 30 minutes.');
  if (chevauchePause(debut, fin)) erreurs.push('Ce créneau chevauche une pause obligatoire (10h-10h30 ou 12h-14h).');

  const enseigne = await professeurEnseigneMatiere(professeur_id, matiere_id);
  if (!enseigne) erreurs.push('Ce professeur n\'est pas affecté à cette matière.');

  if (await conflitProfesseur(professeur_id, jour, debut, fin, excludeSeanceId)) erreurs.push('Conflit horaire : ce professeur a déjà un cours sur ce créneau.');
  if (await conflitClasse(emploi_du_temps_id, jour, debut, fin, excludeSeanceId)) erreurs.push('Conflit horaire : cette classe a déjà un cours sur ce créneau.');
  if (salle && await conflitSalle(salle, jour, debut, fin, excludeSeanceId)) erreurs.push('Conflit de salle : cette salle est déjà occupée sur ce créneau.');

  return erreurs;
}

function melanger(tableau) {
  const arr = [...tableau];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function genererSlotsPossibles() {
  const slots = [];
  for (const jour of JOURS_SEMAINE) {
    for (const creneau of CRENEAUX_HORAIRES) {
      slots.push({ jour, creneau });
    }
  }
  return melanger(slots);
}

async function genererPourClasse(classeId, opts = {}) {
  const classe = await Classe.findByPk(classeId);
  if (!classe) return { ok: false, erreurs: ['Classe introuvable.'], libelle: '?' };

  const libelle = classService.getLibelleComplet(classe.niveau, classe.nom);
  let emploi = await EmploiDuTemps.findOne({ where: { classe_id: classeId, actif: true } });
  if (!emploi) {
    const result = await EmploiDuTemps.create({ classe_id: classeId, annee_scolaire: '2025-2026', semestre: 'annuel', actif: 1, date_debut: opts.date_debut || null, date_fin: opts.date_fin || null });
    emploi = await EmploiDuTemps.findByPk(result.id);
  } else if (opts.date_debut || opts.date_fin) {
    await EmploiDuTemps.update({ date_debut: opts.date_debut || null, date_fin: opts.date_fin || null }, { where: { id: emploi.id } });
  }
  if (!emploi) return { ok: false, erreurs: ['Aucun emploi du temps actif pour cette classe.'], libelle };

  const liaisons = await db.query(
    `SELECT cm.*, m.id AS m_id, m.nom AS m_nom, m.code AS m_code, m.coefficient AS m_coefficient, m.volume_horaire AS m_volume_horaire
     FROM classe_matieres cm
     JOIN matieres m ON m.id = cm.matiere_id
     WHERE cm.classe_id = ?`,
    [classeId]
  );
  liaisons.forEach(l => { l.matiere = { id: l.m_id, nom: l.m_nom, code: l.m_code, coefficient: l.m_coefficient, volume_horaire: l.m_volume_horaire }; });

  if (liaisons.length === 0) return { ok: false, erreurs: ['Configurez d\'abord les matières de cette classe.'], libelle };

  await Seance.destroy({ where: { emploi_du_temps_id: emploi.id } });

  const erreurs = [];
  let seancesCreees = 0;
  const salleClasse = classe.salle || null;

  for (const liaison of liaisons) {
    let volume = parseFloat(liaison.volume_horaire_hebdo);
    if (!volume) {
      const vh = parseFloat(liaison.m_volume_horaire);
      volume = vh ? Math.round(vh / 36) : 2;
    }
    const matiere = liaison.matiere;

    const profs = await db.query(
      `SELECT p.* FROM professeurs p
       JOIN professeur_matieres pm ON pm.professeur_id = p.id
       WHERE pm.matiere_id = ?`,
      [matiere.id]
    );
    if (!profs || profs.length === 0) { erreurs.push(`${matiere.nom} : aucun professeur affecté.`); continue; }

    let heuresPlacees = 0;
    const slots = genererSlotsPossibles();

    for (const { jour, creneau } of slots) {
      if (heuresPlacees >= volume - 0.01) break;
      const debut = creneau.debut;
      const fin = creneau.fin;
      const duree = dureeHeures(debut, fin);

      let place = false;
      for (const prof of melanger(profs)) {
        const validation = await validerSeance({ emploi_du_temps_id: emploi.id, jour, heure_debut: debut, heure_fin: fin, matiere_id: matiere.id, professeur_id: prof.id, salle: salleClasse });
        if (validation.length === 0) {
          await Seance.create({ emploi_du_temps_id: emploi.id, jour, heure_debut: debut, heure_fin: fin, salle: salleClasse, matiere_id: matiere.id, professeur_id: prof.id });
          heuresPlacees += duree;
          seancesCreees++;
          place = true;
          break;
        }
      }
    }

    if (heuresPlacees < volume - 0.01) {
      erreurs.push(`${matiere.nom} : ${heuresPlacees.toFixed(1)}h/${volume}h placées (manque de créneaux ou conflits prof).`);
    }
  }

  return { ok: erreurs.length === 0, seancesCreees, erreurs, libelle };
}

async function genererPourToutesLesClasses(opts = {}) {
  const annee = getAnneeScolaireCourante();
  const classes = await Classe.findAll({ where: { annee_scolaire: annee }, order: [['cycle', 'ASC'], ['niveau', 'ASC'], ['nom', 'ASC']] });
  const resultats = [];
  for (const classe of classes) {
    resultats.push({ classe_id: classe.id, ...(await genererPourClasse(classe.id, opts)) });
  }
  return resultats;
}

module.exports = { validerSeance, conflitProfesseur, conflitClasse, conflitSalle, professeurEnseigneMatiere, dureeHeures, genererPourClasse, genererPourToutesLesClasses };
