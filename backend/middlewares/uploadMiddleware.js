


const multer = require('multer');
const path = require('path');
const crypto = require('crypto');


const TYPES_AUTORISES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];


const stockage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../frontend/public/uploads'));
  },
  filename: (req, file, cb) => {
    
    const extension = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});


const filtreType = (req, file, cb) => {
  if (TYPES_AUTORISES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : PDF, DOCX, JPG, PNG'), false);
  }
};


const upload = multer({
  storage: stockage,
  fileFilter: filtreType,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 
  }
});

module.exports = upload;
