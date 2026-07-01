const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const timetableService = require('../../services/timetableService');

function isAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
  next();
}
function isRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.session.user.type)) return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}

router.use(isAuth);

router.get('/dashboard', isRole('admin'), async (req, res) => {
  try {
    const [stats] = await db.query(`SELECT
      (SELECT COUNT(*) FROM utilisateurs WHERE type='eleve' AND statut='actif') AS eleves,
      (SELECT COUNT(*) FROM utilisateurs WHERE type='professeur' AND statut='actif') AS professeurs,
      (SELECT COUNT(*) FROM utilisateurs WHERE type='parent' AND statut='actif') AS parents,
      (SELECT COUNT(*) FROM classes) AS classes,
      (SELECT COUNT(*) FROM matieres) AS matieres,
      (SELECT COUNT(*) FROM demandes_liaison WHERE statut='en_attente') AS demandes`);
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/utilisateurs', isRole('admin'), async (req, res) => {
  try {
    const users = await db.query(`SELECT id, nom, prenom, email, type, telephone, statut, created_at FROM utilisateurs ORDER BY created_at DESC`);
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/utilisateurs/:id', isRole('admin'), async (req, res) => {
  try {
    const [user] = await db.query(`SELECT * FROM utilisateurs WHERE id=?`, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    let profile = null;
    if (user.type === 'eleve') [profile] = await db.query(`SELECT e.*, c.nom AS classe_nom FROM eleves e LEFT JOIN classes c ON c.id=e.classe_id WHERE e.utilisateur_id=?`, [user.id]);
    else if (user.type === 'professeur') [profile] = await db.query(`SELECT * FROM professeurs WHERE utilisateur_id=?`, [user.id]);
    else if (user.type === 'parent') [profile] = await db.query(`SELECT p.*, e.matricule FROM parents p LEFT JOIN eleves e ON e.id=p.eleve_id WHERE p.utilisateur_id=?`, [user.id]);
    else if (user.type === 'admin') [profile] = await db.query(`SELECT * FROM admins WHERE utilisateur_id=?`, [user.id]);
    res.json({ user, profile });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/utilisateurs', isRole('admin'), async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, type, telephone, statut } = req.body;
    if (!nom || !prenom || !email || !motDePasse || !type) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    const existant = await db.getOne(`SELECT id FROM utilisateurs WHERE email=?`, [email.toLowerCase().trim()]);
    if (existant) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    const hash = await bcrypt.hash(motDePasse, 10);
    const { id } = await db.insert('utilisateurs', {
      nom, prenom, email: email.toLowerCase().trim(),
      mot_de_passe: hash, type, telephone: telephone || null,
      statut: statut || 'actif'
    });
    res.status(201).json({ id, message: 'Utilisateur créé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/utilisateurs/:id', isRole('admin'), async (req, res) => {
  try {
    const { nom, prenom, email, type, telephone, statut, motDePasse } = req.body;
    const [user] = await db.query(`SELECT * FROM utilisateurs WHERE id=?`, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const updates = {};
    if (nom !== undefined) updates.nom = nom;
    if (prenom !== undefined) updates.prenom = prenom;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (type !== undefined) updates.type = type;
    if (telephone !== undefined) updates.telephone = telephone;
    if (statut !== undefined) updates.statut = statut;
    if (motDePasse) updates.mot_de_passe = await bcrypt.hash(motDePasse, 10);
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    await db.update('utilisateurs', updates, { id: req.params.id });
    res.json({ message: 'Utilisateur mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/utilisateurs/:id', isRole('admin'), async (req, res) => {
  try {
    const [user] = await db.query(`SELECT * FROM utilisateurs WHERE id=?`, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (user.type === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un administrateur' });
    await db.remove('utilisateurs', { id: req.params.id });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/classes', isRole('admin'), async (req, res) => {
  try {
    const classes = await db.query(`SELECT c.*, (SELECT COUNT(*) FROM eleves WHERE classe_id=c.id) AS nb_eleves FROM classes c ORDER BY c.cycle, c.niveau`);
    res.json(classes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/classes', isRole('admin'), async (req, res) => {
  try {
    const { nom, niveau, cycle, salle, capacite } = req.body;
    if (!nom || !niveau || !cycle) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    const existant = await db.getOne(`SELECT id FROM classes WHERE nom=?`, [nom]);
    if (existant) return res.status(409).json({ error: 'Une classe avec ce nom existe déjà' });
    const { id } = await db.insert('classes', { nom, niveau, cycle, salle: salle || null, capacite: capacite || null });
    res.status(201).json({ id, message: 'Classe créée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/classes/:id', isRole('admin'), async (req, res) => {
  try {
    const { nom, niveau, cycle, salle, capacite } = req.body;
    const [cls] = await db.query(`SELECT * FROM classes WHERE id=?`, [req.params.id]);
    if (!cls) return res.status(404).json({ error: 'Classe introuvable' });
    const updates = {};
    if (nom !== undefined) updates.nom = nom;
    if (niveau !== undefined) updates.niveau = niveau;
    if (cycle !== undefined) updates.cycle = cycle;
    if (salle !== undefined) updates.salle = salle;
    if (capacite !== undefined) updates.capacite = capacite;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Aucune donnée' });
    await db.update('classes', updates, { id: req.params.id });
    res.json({ message: 'Classe modifiée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/classes/:id', isRole('admin'), async (req, res) => {
  try {
    const [cls] = await db.query(`SELECT * FROM classes WHERE id=?`, [req.params.id]);
    if (!cls) return res.status(404).json({ error: 'Classe introuvable' });
    const [count] = await db.query(`SELECT COUNT(*) AS total FROM eleves WHERE classe_id=?`, [req.params.id]);
    if (count.total > 0) return res.status(409).json({ error: `${count.total} élève(s) rattaché(s) à cette classe` });
    await db.remove('classes', { id: req.params.id });
    res.json({ message: 'Classe supprimée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/matieres', isRole('admin'), async (req, res) => {
  try {
    const matieres = await db.query(`SELECT * FROM matieres ORDER BY nom`);
    res.json(matieres);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/matieres', isRole('admin'), async (req, res) => {
  try {
    const { nom, code, coefficient, volume_horaire } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom obligatoire' });
    const existant = await db.getOne(`SELECT id FROM matieres WHERE nom=?`, [nom]);
    if (existant) return res.status(409).json({ error: 'Cette matière existe déjà' });
    const { id } = await db.insert('matieres', { nom, code: code || null, coefficient: coefficient || 1, volume_horaire: volume_horaire || null });
    res.status(201).json({ id, message: 'Matière créée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/matieres/:id', isRole('admin'), async (req, res) => {
  try {
    const { nom, code, coefficient, volume_horaire } = req.body;
    const [mat] = await db.query(`SELECT * FROM matieres WHERE id=?`, [req.params.id]);
    if (!mat) return res.status(404).json({ error: 'Matière introuvable' });
    const updates = {};
    if (nom !== undefined) updates.nom = nom;
    if (code !== undefined) updates.code = code;
    if (coefficient !== undefined) updates.coefficient = coefficient;
    if (volume_horaire !== undefined) updates.volume_horaire = volume_horaire;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Aucune donnée' });
    await db.update('matieres', updates, { id: req.params.id });
    res.json({ message: 'Matière modifiée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/matieres/:id', isRole('admin'), async (req, res) => {
  try {
    const [mat] = await db.query(`SELECT * FROM matieres WHERE id=?`, [req.params.id]);
    if (!mat) return res.status(404).json({ error: 'Matière introuvable' });
    await db.remove('matieres', { id: req.params.id });
    res.json({ message: 'Matière supprimée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/emploi-du-temps', isRole('admin'), async (req, res) => {
  try {
    const classes = await db.query(`SELECT * FROM classes ORDER BY cycle, niveau`);
    const edt = await db.query(`SELECT edt.*, c.nom AS classe_nom FROM emplois_du_temps edt JOIN classes c ON c.id=edt.classe_id ORDER BY c.nom`);
    const seances = await db.query(`SELECT s.*, m.nom AS matiere_nom, m.code AS matiere_code, u.prenom, u.nom FROM seances s
      JOIN matieres m ON m.id=s.matiere_id JOIN professeurs p ON p.id=s.professeur_id JOIN utilisateurs u ON u.id=p.utilisateur_id`);
    const professeurs = await db.query(`SELECT u.id, u.nom, u.prenom, u.email FROM utilisateurs u WHERE u.type='professeur' AND u.statut='actif'`);
    const matieres = await db.query(`SELECT * FROM matieres ORDER BY nom`);
    res.json({ classes, emploisDuTemps: edt, seances, professeurs, matieres });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/emploi-du-temps/auto-generate', isRole('admin'), async (req, res) => {
  try {
    const { classe_id, date_debut, date_fin } = req.body;
    if (!classe_id) return res.status(400).json({ error: 'Veuillez sélectionner une classe.' });
    const resultat = await timetableService.genererPourClasse(parseInt(classe_id), { date_debut, date_fin });
    res.json(resultat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/emploi-du-temps/auto-generate-all', isRole('admin'), async (req, res) => {
  try {
    const { date_debut, date_fin } = req.body;
    const resultats = await timetableService.genererPourToutesLesClasses({ date_debut, date_fin });
    const ok = resultats.filter(r => r.ok).length;
    const erreurs = resultats.filter(r => !r.ok).flatMap(r => r.erreurs);
    res.json({ ok: erreurs.length === 0, total: resultats.length, reussis: ok, echecs: resultats.length - ok, details: resultats, erreurs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/emploi-du-temps/generer', isRole('admin'), async (req, res) => {
  try {
    const { classe_id, matieres, jours } = req.body;
    if (!classe_id || !matieres || !jours) return res.status(400).json({ error: 'Paramètres manquants' });
    const edt = await db.getOne(`SELECT id FROM emplois_du_temps WHERE classe_id=?`, [classe_id]);
    let edtId;
    if (edt) {
      edtId = edt.id;
      await db.remove('seances', { emploi_du_temps_id: edtId });
    } else {
      const result = await db.insert('emplois_du_temps', { classe_id, annee_scolaire: '2025-2026' });
      edtId = result.id;
    }
    let creees = 0;
    for (const m of matieres) {
      for (const j of jours) {
        await db.insert('seances', {
          emploi_du_temps_id: edtId, matiere_id: m.matiere_id,
          professeur_id: m.professeur_id, jour: j.jour,
          heure_debut: j.heure_debut, heure_fin: j.heure_fin
        });
        creees++;
      }
    }
    res.json({ message: `${creees} séance(s) générée(s)`, edtId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/demandes', isRole('admin'), async (req, res) => {
  try {
    const demandes = await db.query(`SELECT dl.*, u.nom, u.prenom, u.email, e.matricule FROM demandes_liaison dl
      JOIN utilisateurs u ON u.id=dl.parent_id JOIN eleves e ON e.id=dl.eleve_id ORDER BY dl.created_at DESC`);
    res.json(demandes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/demandes/:id/valider', isRole('admin'), async (req, res) => {
  try {
    const [d] = await db.query(`SELECT * FROM demandes_liaison WHERE id=?`, [req.params.id]);
    if (!d) return res.status(404).json({ error: 'Demande introuvable' });
    if (d.statut !== 'en_attente') return res.status(409).json({ error: 'Cette demande a déjà été traitée' });
    await db.update('demandes_liaison', { statut: 'approuvé' }, { id: req.params.id });
    const [parent] = await db.query(`SELECT id, eleve_id FROM parents WHERE utilisateur_id=?`, [d.utilisateur_id]);
    if (parent) {
      await db.update('parents', { eleve_id: d.eleve_id }, { utilisateur_id: d.utilisateur_id });
      const existing = await db.getOne(`SELECT id FROM parent_enfants WHERE parent_id=? AND eleve_id=?`, [parent.id, d.eleve_id]);
      if (!existing) await db.insert('parent_enfants', { parent_id: parent.id, eleve_id: d.eleve_id });
    }
    res.json({ message: 'Demande approuvée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/demandes/:id/refuser', isRole('admin'), async (req, res) => {
  try {
    const [d] = await db.query(`SELECT * FROM demandes_liaison WHERE id=?`, [req.params.id]);
    if (!d) return res.status(404).json({ error: 'Demande introuvable' });
    await db.update('demandes_liaison', { statut: 'refusé' }, { id: req.params.id });
    res.json({ message: 'Demande refusée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/evenements', isRole('admin'), async (req, res) => {
  try {
    const logs = await db.query(`SELECT la.*, u.nom, u.prenom, u.type AS user_type FROM log_activites la
      LEFT JOIN utilisateurs u ON u.id=la.utilisateur_id ORDER BY la.created_at DESC LIMIT 100`);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
