// ============================================================
// routes/professeurRoutes.js — Routes espace professeur
// ============================================================
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/authMiddleware');
const { verifierChangementMotDePasse } = require('../middlewares/forcePasswordChangeMiddleware');
const { noStore } = require('../middlewares/cacheControlMiddleware');
const professeurController = require('../controllers/professeurController');
const noteController = require('../controllers/noteController');
const presenceController = require('../controllers/presenceController');
const devoirController = require('../controllers/devoirController');
const bulletinController = require('../controllers/bulletinController');
const messageController = require('../controllers/messageController');
const emploiDuTempsController = require('../controllers/emploiDuTempsController');
const { noteValidator } = require('../validators/noteValidator');
const { devoirValidator } = require('../validators/devoirValidator');

// Middleware : authentifié + rôle professeur
router.use(isAuthenticated, requireRole('professeur'), verifierChangementMotDePasse, noStore);

// Dashboard
router.get('/dashboard', professeurController.dashboard);

// --- Notes ---
router.get('/notes', noteController.index);
router.post('/notes', noteValidator, noteController.store);
router.post('/notes/:id/update', noteController.update);
router.post('/notes/:id/delete', noteController.destroy);
router.get('/notes/moyenne', noteController.getMoyenne); // API JSON

// --- Présences ---
router.get('/presences/export', presenceController.exportCsv);
router.get('/presences', presenceController.index);
router.post('/presences', presenceController.store);

// --- Devoirs ---
router.get('/devoirs', devoirController.index);
router.post('/devoirs', devoirValidator, devoirController.store);
router.post('/devoirs/:id/update', devoirController.update);
router.post('/devoirs/:id/delete', devoirController.destroy);

// --- Bulletins ---
router.get('/bulletin', bulletinController.index);
router.post('/bulletin/generer', bulletinController.generer);
router.post('/bulletin/publier-classe', bulletinController.publierClasse);
router.get('/bulletin/:id', bulletinController.show);

// --- Messagerie ---
router.get('/messages', messageController.inbox);
router.get('/messages/sent', messageController.sent);
router.get('/messages/compose', messageController.compose);
router.get('/messages/non-lus', messageController.getNonLus);
router.post('/messages/send', messageController.send);
router.get('/messages/:id', messageController.show);

// --- Emploi du temps ---
router.get('/emploiDuTemps', emploiDuTempsController.show);

module.exports = router;
