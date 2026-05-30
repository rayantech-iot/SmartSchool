// ============================================================
// middlewares/uploadMiddleware.js — Configuration Multer pour uploads
// ============================================================
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Types MIME autorisés pour les documents élèves
const TYPES_AUTORISES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

// Configuration du stockage physique des fichiers
const stockage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    // Nom unique généré avec UUID pour éviter les collisions
    const extension = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

// Filtre : rejette les types non autorisés
const filtreType = (req, file, cb) => {
  if (TYPES_AUTORISES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : PDF, DOCX, JPG, PNG'), false);
  }
};

// Instance Multer configurée
const upload = multer({
  storage: stockage,
  fileFilter: filtreType,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = upload;
