const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { Utilisateur } = require('../../models');

router.get('/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await Utilisateur.findOne({ where: { email: email.toLowerCase().trim(), statut: 'actif' } });
    if (!user || !(await bcrypt.compare(motDePasse, user.mot_de_passe))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    req.session.user = {
      id: user.id, nom: user.nom, prenom: user.prenom,
      email: user.email, type: user.type, telephone: user.telephone,
    };
    res.json({ user: req.session.user, redirect: `/${user.type}/dashboard` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.post('/register-parent', async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, matricule } = req.body;
    if (!nom || !prenom || !email || !motDePasse || !matricule) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const existant = await db.getOne(`SELECT id FROM utilisateurs WHERE email=?`, [email.toLowerCase().trim()]);
    if (existant) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    const eleve = await db.getOne(`SELECT e.id, e.classe_id, u.nom, u.prenom FROM eleves e JOIN utilisateurs u ON u.id=e.utilisateur_id WHERE e.matricule=?`, [matricule.trim()]);
    if (!eleve) return res.status(404).json({ error: 'Aucun élève trouvé avec ce matricule. Vérifiez le matricule saisi.' });
    const hash = await bcrypt.hash(motDePasse, 10);
    const userResult = await db.insert('utilisateurs', {
      nom, prenom, email: email.toLowerCase().trim(),
      mot_de_passe: hash, type: 'parent', telephone: telephone || null,
      statut: 'actif'
    });
    const parentResult = await db.insert('parents', {
      utilisateur_id: userResult.id,
      eleve_id: null, lien: null, profession: null
    });
    await db.insert('demandes_liaison', {
      utilisateur_id: userResult.id, eleve_id: eleve.id,
      code: matricule.trim(), statut: 'en_attente'
    });
    res.status(201).json({ message: 'Compte créé. Votre demande de liaison est en attente de validation par l\'administrateur.' });
  } catch (err) {
    console.error('Register parent error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
