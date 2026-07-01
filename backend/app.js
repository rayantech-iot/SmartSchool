require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const flash = require('connect-flash');

const sessionConfig = require('./config/session');
const { testConnection } = require('./config/db');
const { injectUser } = require('./middlewares/authMiddleware');
const { gererInactivite } = require('./middlewares/sessionInactivityMiddleware');
const { noStore } = require('./middlewares/cacheControlMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173"]
    }
  }
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, '../frontend/public')));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(session(sessionConfig));
app.use(flash());

app.use(injectUser);

app.use(gererInactivite);
app.use(noStore);

app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/professeur', require('./routes/api/professeur'));
app.use('/api/eleve', require('./routes/api/eleve'));
app.use('/api/parent', require('./routes/api/parent'));
app.use('/api', require('./routes/api/common'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API introuvable' });
});

app.use((req, res) => {
  const fs = require('fs');
  const indexPath = path.join(__dirname, '../frontend/public/react/index.html');
  if (fs.existsSync(indexPath)) {
    res.type('html').send(fs.readFileSync(indexPath, 'utf-8'));
  } else {
    res.status(200).type('html').send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>SmartSchool</title></head><body><div id="root"></div><script type="module" crossorigin src="http://localhost:5173/src/main.jsx"></script></body></html>`);
  }
});

const demarrerServeur = async () => {
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '../frontend/public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

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
