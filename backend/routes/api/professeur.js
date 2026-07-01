const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { Professeur, Note, Devoir, Presence, Seance, EmploiDuTemps, Matiere, Classe, Message, Utilisateur } = require('../../models');

function isAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
  next();
}
function isProf(req, res, next) {
  if (req.session.user.type !== 'professeur') return res.status(403).json({ error: 'Accès refusé' });
  next();
}

router.use(isAuth, isProf);

async function getProfId(userId) {
  const p = await Professeur.findOne({ where: { utilisateur_id: userId } });
  return p ? p.id : null;
}

router.get('/dashboard', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const [stats] = await db.query(`SELECT
      (SELECT COUNT(*) FROM professeur_classes WHERE professeur_id=?) AS classes,
      (SELECT COUNT(*) FROM professeur_matieres WHERE professeur_id=?) AS matieres,
      (SELECT COUNT(*) FROM devoirs WHERE professeur_id=?) AS devoirs`, [pid, pid, pid]);
    const [nonLus] = await db.query(`SELECT COUNT(*) AS total FROM messages WHERE destinataire_id=? AND lu=0`, [req.session.user.id]);
    res.json({ ...stats, nonLus: nonLus.total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notes', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const classes = await db.query(`SELECT c.* FROM classes c JOIN professeur_classes pc ON pc.classe_id=c.id WHERE pc.professeur_id=?`, [pid]);
    const matieres = await db.query(`SELECT m.* FROM matieres m JOIN professeur_matieres pm ON pm.matiere_id=m.id WHERE pm.professeur_id=?`, [pid]);
    const notes = await db.query(`SELECT n.*, e.matricule, u.nom, u.prenom, m.nom AS matiere_nom FROM notes n
      JOIN eleves e ON e.id=n.eleve_id JOIN utilisateurs u ON u.id=e.utilisateur_id
      JOIN matieres m ON m.id=n.matiere_id WHERE n.professeur_id=? ORDER BY n.date_evaluation DESC`, [pid]);
    const eleves = await db.query(`SELECT e.id, e.matricule, u.nom, u.prenom, e.classe_id FROM eleves e
      JOIN utilisateurs u ON u.id=e.utilisateur_id ORDER BY u.nom, u.prenom`);
    res.json({ classes, matieres, notes, eleves });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notes', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const { eleve_id, matiere_id, valeur, type_evaluation, appreciation, periode, date_evaluation } = req.body;
    await Note.create({ eleve_id, matiere_id, professeur_id: pid, valeur, type_evaluation, appreciation: appreciation || '', periode: periode || 'trimestre1', date_evaluation: date_evaluation || new Date() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notes/:id', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const { valeur, type_evaluation, appreciation } = req.body;
    const note = await Note.findOne({ where: { id: req.params.id, professeur_id: pid } });
    if (!note) return res.status(404).json({ error: 'Note introuvable' });
    await Note.update({ valeur, type_evaluation, appreciation: appreciation || '' }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    await Note.destroy({ where: { id: req.params.id, professeur_id: pid } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/devoirs', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const devoirs = await db.query(`SELECT d.*, c.nom AS classe_nom, c.niveau, m.nom AS matiere_nom, m.code FROM devoirs d
      JOIN classes c ON c.id=d.classe_id JOIN matieres m ON m.id=d.matiere_id WHERE d.professeur_id=? ORDER BY d.date_publication DESC`, [pid]);
    const classes = await db.query(`SELECT c.* FROM classes c JOIN professeur_classes pc ON pc.classe_id=c.id WHERE pc.professeur_id=?`, [pid]);
    const matieres = await db.query(`SELECT m.* FROM matieres m JOIN professeur_matieres pm ON pm.matiere_id=m.id WHERE pm.professeur_id=?`, [pid]);
    res.json({ devoirs, classes, matieres });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/devoirs', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const { titre, description, date_limite, classe_id, matiere_id } = req.body;
    await Devoir.create({ titre, description, date_limite, classe_id, matiere_id, professeur_id: pid, date_publication: new Date(), statut: 'publié' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/devoirs/:id', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const { titre, description, date_limite, classe_id, matiere_id } = req.body;
    const devoir = await Devoir.findOne({ where: { id: req.params.id, professeur_id: pid } });
    if (!devoir) return res.status(404).json({ error: 'Devoir introuvable' });
    await Devoir.update({ titre, description, date_limite, classe_id, matiere_id }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/devoirs/:id', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    await Devoir.destroy({ where: { id: req.params.id, professeur_id: pid } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/presences', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const classes = await db.query(`SELECT c.* FROM classes c JOIN professeur_classes pc ON pc.classe_id=c.id WHERE pc.professeur_id=?`, [pid]);
    const seances = await db.query(`SELECT s.*, edt.classe_id, c.nom AS classe_nom, m.nom AS matiere_nom FROM seances s
      JOIN emplois_du_temps edt ON edt.id=s.emploi_du_temps_id JOIN classes c ON c.id=edt.classe_id
      JOIN matieres m ON m.id=s.matiere_id WHERE s.professeur_id=? ORDER BY s.jour, s.heure_debut`, [pid]);
    res.json({ classes, seances });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/presences/eleves/:seanceId', async (req, res) => {
  try {
    const seance = await db.getOne(`SELECT s.*, edt.classe_id FROM seances s JOIN emplois_du_temps edt ON edt.id=s.emploi_du_temps_id WHERE s.id=?`, [req.params.seanceId]);
    if (!seance) return res.status(404).json({ error: 'Séance introuvable' });
    const eleves = await db.query(`SELECT e.id, e.matricule, u.nom, u.prenom, e.classe_id FROM eleves e
      JOIN utilisateurs u ON u.id=e.utilisateur_id WHERE e.classe_id=? ORDER BY u.nom, u.prenom`, [seance.classe_id]);
    res.json({ eleves, classe_id: seance.classe_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/presences', async (req, res) => {
  try {
    const { seance_id, eleves } = req.body;
    for (const e of eleves) {
      if (e.present) {
        await db.query(`INSERT INTO presences (eleve_id, seance_id, date, statut) VALUES (?,?,CURDATE(),'present')
          ON DUPLICATE KEY UPDATE statut='present'`, [e.id, seance_id]);
      } else {
        await db.query(`INSERT INTO presences (eleve_id, seance_id, date, statut) VALUES (?,?,CURDATE(),'absent')
          ON DUPLICATE KEY UPDATE statut='absent'`, [e.id, seance_id]);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/emploi-du-temps', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const seances = await db.query(`SELECT s.*, edt.classe_id, c.nom AS classe_nom, c.niveau, m.nom AS matiere_nom, m.code FROM seances s
      JOIN emplois_du_temps edt ON edt.id=s.emploi_du_temps_id JOIN classes c ON c.id=edt.classe_id
      JOIN matieres m ON m.id=s.matiere_id WHERE s.professeur_id=? ORDER BY FIELD(s.jour,'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'), s.heure_debut`, [pid]);
    res.json({ seances });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages', async (req, res) => {
  try {
    const depuis = new Date(); depuis.setMonth(depuis.getMonth() - 1);
    const messages = await Message.findAll({
      where: { destinataire_id: req.session.user.id },
      include: [{ model: Utilisateur, as: 'expediteur' }],
      order: [['created_at', 'DESC']],
    });
    const recents = messages.filter(m => new Date(m.created_at) >= depuis);
    const [nonLus] = await db.query(`SELECT COUNT(*) AS total FROM messages WHERE destinataire_id=? AND lu=0`, [req.session.user.id]);
    const classes = await db.query(`SELECT c.* FROM classes c JOIN professeur_classes pc ON pc.classe_id=c.id WHERE pc.professeur_id=?`, [await getProfId(req.session.user.id)]);
    const destinataires = await db.query(`SELECT * FROM utilisateurs WHERE type IN ('eleve','parent') AND statut='actif' ORDER BY nom`);
    res.json({ messages: recents, nonLus: nonLus.total, classes, destinataires });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/classes-matieres', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const classes = await db.query(`SELECT c.* FROM classes c JOIN professeur_classes pc ON pc.classe_id=c.id WHERE pc.professeur_id=? ORDER BY c.cycle, c.niveau, c.nom`, [pid]);
    const allMatieres = await db.query(`SELECT m.* FROM matieres m JOIN professeur_matieres pm ON pm.matiere_id=m.id WHERE pm.professeur_id=?`, [pid]);
    const matieresParClasse = {};
    for (const c of classes) {
      const cm = await db.query(`SELECT matiere_id FROM classe_matieres WHERE classe_id=?`, [c.id]);
      const cmIds = cm.map(r => r.matiere_id);
      matieresParClasse[c.id] = allMatieres.filter(m => cmIds.length === 0 || cmIds.includes(m.id));
    }
    res.json({ classes, matieresParClasse, allMatieres });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notes/students/:classeId/:matiereId', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const { classeId, matiereId } = req.params;
    const students = await db.query(`SELECT e.id, e.matricule, u.nom, u.prenom FROM eleves e
      JOIN utilisateurs u ON u.id=e.utilisateur_id WHERE e.classe_id=? ORDER BY u.nom, u.prenom`, [classeId]);
    for (const s of students) {
      s.notes = await db.query(`SELECT id, valeur, type_evaluation, appreciation, periode, date_evaluation FROM notes
        WHERE eleve_id=? AND matiere_id=? AND professeur_id=? ORDER BY date_evaluation DESC`, [s.id, matiereId, pid]);
    }
    res.json({ students });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/presences/students/:classeId', async (req, res) => {
  try {
    const eleves = await db.query(`SELECT e.id, e.matricule, u.nom, u.prenom FROM eleves e
      JOIN utilisateurs u ON u.id=e.utilisateur_id WHERE e.classe_id=? ORDER BY u.nom, u.prenom`, [req.params.classeId]);
    res.json({ eleves });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/presences/class', async (req, res) => {
  try {
    const pid = await getProfId(req.session.user.id);
    const { classe_id, matiere_id, date, eleves } = req.body;
    const d = date || new Date().toISOString().split('T')[0];
    const added = await db.query(`SELECT id, eleve_id FROM presences WHERE professeur_id=? AND seance_id IS NULL AND DATE(created_at)=?`, [pid, d]);
    for (const e of eleves) {
      const existing = added.find(a => a.eleve_id === e.id);
      if (existing) {
        await db.update('presences', { statut: e.present ? 'present' : 'absent' }, { id: existing.id });
      } else {
        const fields = { eleve_id: e.id, professeur_id: pid, statut: e.present ? 'present' : 'absent' };
        if (matiere_id) fields.matiere_id = matiere_id;
        await db.insert('presences', fields);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages/destinataires/:classeId', async (req, res) => {
  try {
    const { type } = req.query;
    if (type === 'eleve') {
      const eleves = await db.query(`SELECT u.id, u.nom, u.prenom FROM eleves e
        JOIN utilisateurs u ON u.id=e.utilisateur_id WHERE e.classe_id=? AND u.statut='actif' ORDER BY u.nom, u.prenom`, [req.params.classeId]);
      res.json({ destinataires: eleves });
    } else if (type === 'parent') {
      const parents = await db.query(`SELECT u.id, u.nom, u.prenom FROM parents p
        JOIN eleves e ON e.id=p.eleve_id JOIN utilisateurs u ON u.id=p.utilisateur_id
        WHERE e.classe_id=? AND u.statut='actif' ORDER BY u.nom, u.prenom`, [req.params.classeId]);
      res.json({ destinataires: parents });
    } else {
      res.status(400).json({ error: 'Type invalide. Utilisez ?type=eleve ou ?type=parent' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/messages/send', async (req, res) => {
  try {
    const { sujet, contenu, destinataire_id } = req.body;
    await Message.create({ sujet, contenu, expediteur_id: req.session.user.id, destinataire_id, type_envoi: 'individuel' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
