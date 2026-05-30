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
const messageController = require('../controllers/messageController');
const emploiDuTempsController = require('../controllers/emploiDuTempsController');
const { noteValidator } = require('../validators/noteValidator');
const { devoirValidator } = require('../validators/devoirValidator');
const upload = require('../middlewares/uploadMiddleware');

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
const uploadDevoir = upload.single('fichier');
const uploadDevoirSafe = (req, res, next) => {
  uploadDevoir(req, res, (err) => {
    if (err) {
      req.flash('error', err.message || 'Erreur lors du téléchargement du fichier.');
      return res.redirect('back');
    }
    next();
  });
};

router.get('/devoirs', devoirController.index);
router.post('/devoirs', uploadDevoirSafe, devoirValidator, devoirController.store);
router.post('/devoirs/:id/update', uploadDevoirSafe, devoirController.update);
router.post('/devoirs/:id/delete', devoirController.destroy);

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
