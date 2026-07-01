const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../../config/db');
const { Eleve, Utilisateur } = require('../../models');

function isAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
  next();
}
function isEleve(req, res, next) {
  if (req.session.user.type !== 'eleve') return res.status(403).json({ error: 'Accès refusé' });
  next();
}
router.use(isAuth, isEleve);

async function getEleve(userId) {
  return Eleve.findOne({ where: { utilisateur_id: userId } });
}

router.get('/dashboard', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const [stats] = await db.query(`SELECT
      (SELECT COUNT(*) FROM notes WHERE eleve_id=?) AS notes,
      (SELECT COUNT(*) FROM devoirs WHERE classe_id=?) AS devoirs,
      (SELECT COUNT(*) FROM presences WHERE eleve_id=? AND statut='present' AND date=CURDATE()) AS present`,
      [eleve.id, eleve.classe_id, eleve.id]);
    const [nonLus] = await db.query(`SELECT COUNT(*) AS total FROM messages WHERE destinataire_id=? AND lu=0`, [req.session.user.id]);
    res.json({ ...stats, nonLus: nonLus.total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notes', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const notes = await db.query(`SELECT n.*, m.nom AS matiere_nom, m.code FROM notes n
      JOIN matieres m ON m.id=n.matiere_id WHERE n.eleve_id=? ORDER BY n.date_evaluation DESC`, [eleve.id]);
    const moyennes = await db.query(`SELECT m.id AS matiere_id, m.nom AS matiere_nom, ROUND(AVG(n.valeur),2) AS moyenne, COUNT(*) AS nb_notes
      FROM notes n JOIN matieres m ON m.id=n.matiere_id WHERE n.eleve_id=? GROUP BY m.id, m.nom`, [eleve.id]);
    res.json({ notes, moyennes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/devoirs', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const devoirs = await db.query(`SELECT d.*, m.nom AS matiere_nom, m.code, u.nom AS prof_nom, u.prenom AS prof_prenom FROM devoirs d
      JOIN matieres m ON m.id=d.matiere_id JOIN professeurs p ON p.id=d.professeur_id JOIN utilisateurs u ON u.id=p.utilisateur_id
      WHERE d.classe_id=? ORDER BY d.date_limite`, [eleve.classe_id]);
    res.json({ devoirs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/presences', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const presences = await db.query(`SELECT p.id, p.seance_id, p.eleve_id, p.professeur_id, p.statut, p.created_at,
      s.jour, s.heure_debut, s.heure_fin, m.nom AS matiere_nom FROM presences p
      LEFT JOIN seances s ON s.id=p.seance_id LEFT JOIN matieres m ON m.id=s.matiere_id
      WHERE p.eleve_id=? ORDER BY p.id DESC`, [eleve.id]);
    res.json({ presences });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const uploadDir = path.join(__dirname, '../../../frontend/public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

router.get('/documents', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const documents = await db.query(`SELECT * FROM documents WHERE eleve_id=? ORDER BY created_at DESC`, [eleve.id]);
    res.json({ documents });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/documents/upload', upload.single('fichier'), async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
    await db.insert('documents', {
      eleve_id: eleve.id, nom_original: req.file.originalname,
      nom_fichier: req.file.filename, type_mime: req.file.mimetype,
      taille: req.file.size, chemin: req.file.path
    });
    res.json({ message: 'Document uploadé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/emploi-du-temps', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const edt = await db.query(`SELECT s.*, m.nom AS matiere_nom, m.code, u.nom AS prof_nom, u.prenom AS prof_prenom FROM seances s
      JOIN emplois_du_temps edt ON edt.id=s.emploi_du_temps_id
      JOIN matieres m ON m.id=s.matiere_id
      JOIN professeurs p ON p.id=s.professeur_id JOIN utilisateurs u ON u.id=p.utilisateur_id
      WHERE edt.classe_id=? ORDER BY FIELD(s.jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), s.heure_debut`, [eleve.classe_id]);
    res.json({ seances: edt });
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

router.get('/bulletins', async (req, res) => {
  try {
    const eleve = await getEleve(req.session.user.id);
    const bulletins = await db.query(`SELECT b.*, c.nom AS classe_nom FROM bulletins b
      JOIN classes c ON c.id=b.classe_id WHERE b.eleve_id=? ORDER BY b.periode`, [eleve.id]);
    res.json({ bulletins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
