const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { Parent, Eleve, Utilisateur } = require('../../models');

function isAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
  next();
}
function isParent(req, res, next) {
  if (req.session.user.type !== 'parent') return res.status(403).json({ error: 'Accès refusé' });
  next();
}
router.use(isAuth, isParent);

async function getParentRow(userId) {
  return Parent.findOne({ where: { utilisateur_id: userId }, include: [{ model: Eleve, as: 'eleve' }] });
}

async function enrichChild(eleve) {
  if (!eleve) return null;
  const [classe] = await db.query(`SELECT nom FROM classes WHERE id=?`, [eleve.classe_id]);
  if (classe) eleve.classe_nom = classe.nom;
  return eleve;
}

router.get('/enfants', async (req, res) => {
  try {
    const parent = await Parent.findOne({ where: { utilisateur_id: req.session.user.id } });
    if (!parent) return res.json({ enfants: [] });
    const rows = await db.query(`SELECT pe.eleve_id, e.matricule, u.nom, u.prenom, e.classe_id, c.nom AS classe_nom
      FROM parent_enfants pe
      JOIN eleves e ON e.id=pe.eleve_id
      JOIN utilisateurs u ON u.id=e.utilisateur_id
      LEFT JOIN classes c ON c.id=e.classe_id
      WHERE pe.parent_id=?`, [parent.id]);
    res.json({ enfants: rows, actif: parent.eleve_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/switch-enfant/:eleveId', async (req, res) => {
  try {
    const [parent] = await db.query(`SELECT id FROM parents WHERE utilisateur_id=?`, [req.session.user.id]);
    if (!parent) return res.status(404).json({ error: 'Profil parent introuvable' });
    const link = await db.getOne(`SELECT id FROM parent_enfants WHERE parent_id=? AND eleve_id=?`, [parent.id, req.params.eleveId]);
    if (!link) return res.status(403).json({ error: 'Cet enfant ne vous est pas lié' });
    await db.update('parents', { eleve_id: parseInt(req.params.eleveId) }, { id: parent.id });
    res.json({ message: 'Enfant sélectionné', eleve_id: parseInt(req.params.eleveId) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ajouter-enfant', async (req, res) => {
  try {
    const { matricule } = req.body;
    if (!matricule) return res.status(400).json({ error: 'Matricule requis' });
    const eleve = await db.getOne(`SELECT id FROM eleves WHERE matricule=?`, [matricule.trim()]);
    if (!eleve) return res.status(404).json({ error: 'Aucun élève trouvé avec ce matricule' });
    const [parent] = await db.query(`SELECT id FROM parents WHERE utilisateur_id=?`, [req.session.user.id]);
    if (!parent) return res.status(404).json({ error: 'Profil parent introuvable' });
    const existing = await db.getOne(`SELECT id, statut FROM demandes_liaison WHERE utilisateur_id=? AND eleve_id=?`, [req.session.user.id, eleve.id]);
    if (existing) {
      if (existing.statut === 'en_attente') return res.status(409).json({ error: 'Une demande est déjà en attente pour cet élève' });
      if (existing.statut === 'approuvé') return res.status(409).json({ error: 'Cet enfant est déjà lié à votre compte' });
    }
    const alreadyLinked = await db.getOne(`SELECT id FROM parent_enfants WHERE parent_id=? AND eleve_id=?`, [parent.id, eleve.id]);
    if (alreadyLinked) return res.status(409).json({ error: 'Cet enfant est déjà lié à votre compte' });
    await db.insert('demandes_liaison', {
      utilisateur_id: req.session.user.id, eleve_id: eleve.id,
      code: matricule.trim(), statut: 'en_attente'
    });
    res.json({ message: 'Demande de liaison envoyée. En attente de validation par l\'administrateur.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function getParent(userId) {
  const parent = await getParentRow(userId);
  if (parent && parent.eleve) await enrichChild(parent.eleve);
  return parent;
}

router.get('/dashboard', async (req, res) => {
  try {
    const parent = await getParent(req.session.user.id);
    if (!parent || !parent.eleve_id) return res.json({ notes: 0, moyenne: 0, absences: 0, nonLus: 0, enfant: null, moyennesParMatiere: [] });
    const [stats] = await db.query(`SELECT
      (SELECT COUNT(*) FROM notes WHERE eleve_id=?) AS notes,
      (SELECT ROUND(COALESCE(AVG(valeur),0),1) FROM notes WHERE eleve_id=?) AS moyenne,
      (SELECT COUNT(*) FROM presences WHERE eleve_id=? AND statut='absent') AS absences`,
      [parent.eleve_id, parent.eleve_id, parent.eleve_id]);
    const [nonLus] = await db.query(`SELECT COUNT(*) AS total FROM messages WHERE destinataire_id=? AND lu=0`, [req.session.user.id]);
    const moyennesParMatiere = await db.query(`SELECT m.nom AS matiere_nom, ROUND(AVG(n.valeur),2) AS moyenne, COUNT(*) AS nb_notes
      FROM notes n JOIN matieres m ON m.id=n.matiere_id WHERE n.eleve_id=? GROUP BY m.id, m.nom`, [parent.eleve_id]);
    res.json({ ...stats, nonLus: nonLus.total, enfant: parent.eleve, moyennesParMatiere });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/bulletins', async (req, res) => {
  try {
    const parent = await getParent(req.session.user.id);
    if (!parent || !parent.eleve_id) return res.json({ bulletins: [] });
    const bulletins = await db.query(`SELECT b.*, c.nom AS classe_nom FROM bulletins b
      JOIN classes c ON c.id=b.classe_id WHERE b.eleve_id=? ORDER BY b.periode`, [parent.eleve_id]);
    res.json({ bulletins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/absences', async (req, res) => {
  try {
    const parent = await getParent(req.session.user.id);
    if (!parent || !parent.eleve_id) return res.json({ absences: [] });
    const absences = await db.query(`SELECT p.id, p.statut, p.created_at,
      s.jour, s.heure_debut, s.heure_fin, m.nom AS matiere_nom FROM presences p
      LEFT JOIN seances s ON s.id=p.seance_id LEFT JOIN matieres m ON m.id=s.matiere_id
      WHERE p.eleve_id=? AND p.statut='absent' ORDER BY p.id DESC`, [parent.eleve_id]);
    res.json({ absences });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages', async (req, res) => {
  try {
    const depuis = new Date(); depuis.setMonth(depuis.getMonth() - 1);
    const messages = await db.query(`SELECT m.*, u.nom, u.prenom, u.type AS expediteur_type FROM messages m
      JOIN utilisateurs u ON u.id=m.expediteur_id WHERE m.destinataire_id=? AND m.created_at>=? ORDER BY m.created_at DESC`,
      [req.session.user.id, depuis]);
    const [nonLus] = await db.query(`SELECT COUNT(*) AS total FROM messages WHERE destinataire_id=? AND lu=0`, [req.session.user.id]);
    res.json({ messages, nonLus: nonLus.total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/emploi-du-temps', async (req, res) => {
  try {
    const parent = await getParent(req.session.user.id);
    if (!parent || !parent.eleve || !parent.eleve.classe_id) return res.json({ seances: [] });
    const edt = await db.query(`SELECT s.*, m.nom AS matiere_nom, m.code, u.nom AS prof_nom, u.prenom AS prof_prenom FROM seances s
      JOIN emplois_du_temps edt ON edt.id=s.emploi_du_temps_id
      JOIN matieres m ON m.id=s.matiere_id
      JOIN professeurs p ON p.id=s.professeur_id JOIN utilisateurs u ON u.id=p.utilisateur_id
      WHERE edt.classe_id=? ORDER BY FIELD(s.jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), s.heure_debut`,
      [parent.eleve.classe_id]);
    res.json({ seances: edt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;