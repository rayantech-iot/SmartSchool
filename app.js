// ============================================================
// app.js — Point d'entrée principal de SmartSchool
// ============================================================
require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const sessionConfig = require('./config/session');
const { testConnection } = require('./config/database');
const { injectUser, isAuthenticated } = require('./middlewares/authMiddleware');
const { csrfProtection } = require('./middlewares/csrfMiddleware');
const { gererInactivite } = require('./middlewares/sessionInactivityMiddleware');
const { noStore } = require('./middlewares/cacheControlMiddleware');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const professeurRoutes = require('./routes/professeurRoutes');
const eleveRoutes = require('./routes/eleveRoutes');
const parentRoutes = require('./routes/parentRoutes');
const notificationController = require('./controllers/notificationController');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES DE SÉCURITÉ
// ============================================================

// Helmet sécurise les headers HTTP (protège contre XSS, clickjacking, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Logging des requêtes HTTP en développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// MOTEUR DE VUES EJS
// ============================================================
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// ============================================================
// MIDDLEWARES DE TRAITEMENT DES REQUÊTES
// ============================================================

// Support des fichiers statiques (CSS, JS, images, uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Parsing du corps des requêtes HTTP
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Support des méthodes HTTP PUT et DELETE via _method dans les formulaires
app.use(methodOverride('_method'));

// ============================================================
// SESSIONS ET MESSAGES FLASH
// ============================================================
app.use(session(sessionConfig));
app.use(flash());

// Injection utilisateur + CSRF dans les vues
app.use(injectUser);

// Inactivité 2h + changement mot de passe obligatoire (routes protégées)
app.use(gererInactivite);
app.use(noStore);

// Protection CSRF
app.use(csrfProtection);

// ============================================================
// ROUTES DE L'APPLICATION
// ============================================================

// Redirection de la racine vers login ou dashboard
app.get('/', (req, res) => {
  const u = req.session?.user;
  const typesValides = ['admin', 'professeur', 'eleve', 'parent'];
  if (u?.id && u?.type && typesValides.includes(u.type)) {
    return res.redirect(`/${u.type}/dashboard`);
  }
  if (req.session) delete req.session.user;
  res.redirect('/login');
});

// API notifications (tous rôles connectés)
app.get('/notifications/non-lues', isAuthenticated, notificationController.getNonLues);
app.get('/notifications', isAuthenticated, notificationController.index);
app.post('/notifications/:id/lire', isAuthenticated, notificationController.marquerLue);

// Montage des routes par domaine
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/professeur', professeurRoutes);
app.use('/eleve', eleveRoutes);
app.use('/parent', parentRoutes);

// ============================================================
// GESTION DES ERREURS
// ============================================================

// 404 — Page non trouvée
app.use((req, res) => {
  res.status(404).render('errors/404', {
    titre: 'Page introuvable — SmartSchool',
    user: req.session.user || null
  });
});

// 500 — Erreur serveur interne
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).render('errors/500', {
    titre: 'Erreur serveur — SmartSchool',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur interne est survenue.',
    user: req.session.user || null
  });
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================
const demarrerServeur = async () => {
  // Création du dossier uploads si absent
  const fs = require('fs');
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Connexion MySQL uniquement — pas de sync automatique (évite les ALTER à chaque démarrage)
  await testConnection();

  const { purgerMessagesAnciens } = require('./services/messageCleanupService');
  purgerMessagesAnciens(1).catch((err) => console.warn('Purge messages:', err.message));

  app.listen(PORT, () => {
    console.log(`🚀 SmartSchool démarré sur http://localhost:${PORT}`);
    console.log(`📚 Environnement : ${process.env.NODE_ENV || 'development'}`);
  });
};

demarrerServeur().catch(err => {
  console.error('❌ Erreur au démarrage:', err);
  process.exit(1);
});

module.exports = app;
