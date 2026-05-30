# SmartSchool

**Système Digital de Gestion et de Communication Scolaire** — Application web pour les établissements scolaires du Togo.

## Stack technique

- **Backend :** Node.js, Express.js, Sequelize, MySQL
- **Frontend :** EJS, Tailwind CSS, Chart.js, Font Awesome
- **Sécurité :** bcrypt, Helmet, sessions Express, protection CSRF, contrôle d'accès par rôle

## Prérequis

- Node.js 18+
- MySQL 8+

## Installation

```bash
# Cloner / ouvrir le projet
cd "BACHELOR CDA"

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos identifiants MySQL

# Créer la base de données
mysql -u root -p < database/init.sql

# Peupler avec les données de démo
npm run seed

# Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@smartschool.tg | Admin123! |
| Professeur | prof.koffi@smartschool.tg | Prof123! |
| Élève | eleve.amede@smartschool.tg | Eleve123! |
| Parent | parent.amede@smartschool.tg | Parent123! |

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre le serveur en production |
| `npm run dev` | Démarre avec nodemon (rechargement auto) |
| `npm run seed` | Réinitialise la BDD et insère les données de démo |

## Architecture MVC

```
config/          → Base de données, sessions
models/          → 17 entités Sequelize (dont Notification)
controllers/     → Logique métier par acteur
routes/          → Routes par rôle
middlewares/     → Auth, CSRF, upload Multer
validators/      → express-validator
views/           → Templates EJS par rôle
public/          → CSS, JS, uploads
services/        → Notifications in-app
seeders/         → Données de démonstration
```

## Sécurité (démontrable en soutenance)

1. **Mots de passe** hashés avec bcrypt (12 rounds) — visible en base `utilisateurs.mot_de_passe`
2. **CSRF** — token `_csrf` dans chaque formulaire POST (`views/partials/csrfField.ejs`)
3. **Contrôle d'accès** — middleware `requireRole()` sur chaque espace
4. **Helmet** — headers HTTP sécurisés dans `app.js`

## Fonctionnalités principales

- Gestion utilisateurs, classes, matières (admin)
- Notes avec calcul automatique de moyenne
- Présences → création automatique d'absences
- Bulletins PDF (impression navigateur)
- Messagerie individuelle et par classe
- Notifications in-app (absences, notes)
- Documents élèves (upload Multer, 5 Mo max)
- Emploi du temps par classe

## Licence

Projet académique — Bachelor CDA.
