const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { Message, Utilisateur } = require('../../models');

function isAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
  next();
}
router.use(isAuth);

router.get('/messages/:id', async (req, res) => {
  try {
    const msg = await db.getOne(`SELECT m.*, u.nom, u.prenom, u.type AS expediteur_type FROM messages m
      JOIN utilisateurs u ON u.id=m.expediteur_id WHERE m.id=? AND (m.destinataire_id=? OR m.expediteur_id=?)`,
      [req.params.id, req.session.user.id, req.session.user.id]);
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    if (msg.destinataire_id === req.session.user.id && !msg.lu) {
      await Message.update({ lu: true, date_lecture: new Date() }, { where: { id: msg.id } });
    }
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages/non-lus', async (req, res) => {
  try {
    const [row] = await db.query(`SELECT COUNT(*) AS total FROM messages WHERE destinataire_id=? AND lu=0`, [req.session.user.id]);
    res.json({ nonLus: row.total });
  } catch (err) { res.json({ nonLus: 0 }); }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifs = await db.query(`SELECT * FROM notifications WHERE utilisateur_id=? ORDER BY created_at DESC LIMIT 20`, [req.session.user.id]);
    res.json({ notifications: notifs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notifications/non-lues', async (req, res) => {
  try {
    const [row] = await db.query(`SELECT COUNT(*) AS total FROM notifications WHERE utilisateur_id=? AND lu=0`, [req.session.user.id]);
    res.json({ nonLues: row.total });
  } catch (err) { res.json({ nonLues: 0 }); }
});

router.post('/notifications/:id/lire', async (req, res) => {
  try {
    await db.query(`UPDATE notifications SET lu=1 WHERE id=? AND utilisateur_id=?`, [req.params.id, req.session.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/destinataires', async (req, res) => {
  try {
    const userType = req.session.user.type;
    let destinataires;
    if (userType === 'eleve' || userType === 'parent') {
      destinataires = await db.query(`SELECT id, nom, prenom, type FROM utilisateurs WHERE type='professeur' AND statut='actif' ORDER BY nom`);
    } else if (userType === 'professeur') {
      destinataires = await db.query(`SELECT id, nom, prenom, type FROM utilisateurs WHERE type IN ('eleve','parent') AND statut='actif' ORDER BY nom`);
    } else {
      destinataires = await db.query(`SELECT id, nom, prenom, type FROM utilisateurs WHERE statut='actif' ORDER BY nom`);
    }
    res.json({ destinataires });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/messages/send', async (req, res) => {
  try {
    const { sujet, contenu, destinataire_id } = req.body;
    if (!sujet || !contenu || !destinataire_id) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    await Message.create({ sujet, contenu, expediteur_id: req.session.user.id, destinataire_id, type_envoi: 'individuel' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
