// ============================================================
// routes/eleveRoutes.js — Routes espace élève
// ============================================================
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/authMiddleware');
const { verifierChangementMotDePasse } = require('../middlewares/forcePasswordChangeMiddleware');
const { noStore } = require('../middlewares/cacheControlMiddleware');
const eleveController = require('../controllers/eleveController');
const absenceController = require('../controllers/absenceController');
const bulletinController = require('../controllers/bulletinController');
const documentController = require('../controllers/documentController');
const messageController = require('../controllers/messageController');
const emploiDuTempsController = require('../controllers/emploiDuTempsController');
const upload = require('../middlewares/uploadMiddleware');

// Middleware : authentifié + rôle élève
router.use(isAuthenticated, requireRole('eleve'), verifierChangementMotDePasse, noStore);

// Dashboard
router.get('/dashboard', eleveController.dashboard);

// Notes
router.get('/notes', eleveController.notes);

// Devoirs
router.get('/devoirs', eleveController.devoirs);

// Présences et absences
router.get('/presences', absenceController.index);
router.post('/absences/signaler', eleveController.signalerAbsence);

// Bulletins
router.get('/bulletin', eleveController.bulletins);
router.get('/bulletin/:id', bulletinController.show); // après /bulletin pour éviter conflit

// Documents personnels
router.get('/documents', documentController.index);
router.post('/documents/upload', upload.single('fichier'), documentController.upload);
router.get('/documents/:id/download', documentController.download);
router.post('/documents/:id/delete', documentController.destroy);

// Messagerie
router.get('/messages', messageController.inbox);
router.get('/messages/non-lus', messageController.getNonLus);
router.get('/messages/:id', messageController.show);

// Emploi du temps
router.get('/emploiDuTemps', emploiDuTempsController.show);

module.exports = router;
