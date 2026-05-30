// ============================================================
// routes/authRoutes.js
// ============================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidator');
const { loginLimiter } = require('../middlewares/rateLimitMiddleware');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const registrationController = require('../controllers/registrationController');
const {
  inscriptionEleveValidator,
  inscriptionParentValidator
} = require('../validators/registrationValidator');

router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, loginValidator, authController.login);
router.get('/logout', authController.logout);

router.get('/inscription', registrationController.showInscription);
router.get('/inscription/eleve', registrationController.showInscriptionEleve);
router.post('/inscription/eleve', loginLimiter, inscriptionEleveValidator, registrationController.inscriptionEleve);
router.get('/inscription/parent', registrationController.showInscriptionParent);
router.post('/inscription/parent', loginLimiter, inscriptionParentValidator, registrationController.inscriptionParent);

router.get('/auth/changer-mot-de-passe', isAuthenticated, authController.showChangerMotDePasse);
router.post('/auth/changer-mot-de-passe', isAuthenticated, authController.changerMotDePasse);

router.get('/auth/reinitialiser/:token', authController.showResetPassword);
router.post('/auth/reinitialiser/:token', authController.resetPassword);

module.exports = router;
