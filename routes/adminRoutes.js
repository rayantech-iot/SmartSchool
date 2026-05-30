// ============================================================
// routes/adminRoutes.js
// ============================================================
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/authMiddleware');
const { noStore } = require('../middlewares/cacheControlMiddleware');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/admin/userController');
const liaisonController = require('../controllers/admin/liaisonController');
const emploiDuTempsController = require('../controllers/emploiDuTempsController');
const {
  createUserValidator,
  updateUserValidator,
  createMatiereValidator
} = require('../validators/utilisateurValidator');

const { verifierChangementMotDePasse } = require('../middlewares/forcePasswordChangeMiddleware');

router.use(isAuthenticated, requireRole('admin'), verifierChangementMotDePasse, noStore);

router.get('/dashboard', adminController.dashboard);
router.get('/api/dashboard-stats', adminController.dashboardStats);

router.get('/utilisateurs', userController.utilisateurs);
router.get('/api/utilisateurs', userController.apiUtilisateurs);
router.get('/utilisateurs/nouveau', userController.nouveauUtilisateur);
router.post('/utilisateurs/create', createUserValidator, userController.createUtilisateur);
router.get('/utilisateurs/:id/edit', userController.editUtilisateur);
router.post('/utilisateurs/:id/update', updateUserValidator, userController.updateUtilisateur);
router.post('/utilisateurs/:id/toggle', userController.toggleStatut);
router.post('/utilisateurs/:id/reset-password', userController.resetPassword);
router.post('/utilisateurs/:id/renvoyer-invitation', userController.renvoyerInvitation);

router.get('/demandes', liaisonController.index);
router.post('/demandes/:id/valider', liaisonController.validerLiaison);
router.post('/demandes/:id/refuser', liaisonController.refuserLiaison);
router.post('/inscriptions-eleve/:id/activer', liaisonController.activerEleve);
router.post('/inscriptions-eleve/:id/refuser', liaisonController.refuserEleve);

router.get('/classes', adminController.classes);
router.get('/classes/apercu', adminController.apercuClasse);
router.post('/classes/create', adminController.createClasse);
router.post('/classes/:id/matieres', adminController.updateClasseMatieres);
router.get('/classes/:id/edit', adminController.editClasse);
router.post('/classes/:id/update', adminController.updateClasse);
router.post('/classes/:id/delete', adminController.deleteClasse);

router.get('/matieres', adminController.matieres);
router.post('/matieres/create', createMatiereValidator, adminController.createMatiere);
router.get('/matieres/:id/edit', adminController.editMatiere);
router.post('/matieres/:id/update', adminController.updateMatiere);
router.post('/matieres/:id/delete', adminController.deleteMatiere);

router.get('/emploiDuTemps', adminController.emploiDuTemps);
router.get('/emploidutemps', (req, res) => res.redirect('/admin/emploiDuTemps' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')));
router.post('/emploiDuTemps/seance/add', emploiDuTempsController.addSeance);
router.post('/emploiDuTemps/seance/:id/update', emploiDuTempsController.updateSeance);
router.post('/emploiDuTemps/seance/:id/delete', emploiDuTempsController.deleteSeance);
router.post('/emploiDuTemps/generer/:classeId', adminController.genererEmploiDuTemps);
router.post('/emploiDuTemps/generer-all', adminController.genererEmploiDuTemps);

module.exports = router;
