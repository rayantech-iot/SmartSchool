// ============================================================
// routes/parentRoutes.js — Routes espace parent
// ============================================================
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/authMiddleware');
const { verifierChangementMotDePasse } = require('../middlewares/forcePasswordChangeMiddleware');
const { noStore } = require('../middlewares/cacheControlMiddleware');
const parentController = require('../controllers/parentController');
const absenceController = require('../controllers/absenceController');
const messageController = require('../controllers/messageController');
const bulletinController = require('../controllers/bulletinController');
const emploiDuTempsController = require('../controllers/emploiDuTempsController');
const registrationController = require('../controllers/registrationController');
const { lierEnfantValidator } = require('../validators/registrationValidator');

// Middleware : authentifié + rôle parent
router.use(isAuthenticated, requireRole('parent'), verifierChangementMotDePasse, noStore);

// Dashboard
router.get('/dashboard', parentController.dashboard);
router.post('/lier-enfant', lierEnfantValidator, registrationController.lierEnfant);

// Absences de l'enfant + justification
router.get('/absences', absenceController.index);
router.post('/absences/:id/justifier', absenceController.justifier);

// Bulletins de l'enfant (lecture seule)
router.get('/bulletin', parentController.bulletins);
router.get('/bulletin/:id', bulletinController.show);

// Messagerie — peut contacter les professeurs
router.get('/messages', messageController.inbox);
router.get('/messages/compose', messageController.compose);
router.get('/messages/non-lus', messageController.getNonLus);
router.post('/messages/send', messageController.send);
router.get('/messages/:id', messageController.show);

// Emploi du temps de l'enfant
router.get('/emploiDuTemps', emploiDuTempsController.show);

module.exports = router;
