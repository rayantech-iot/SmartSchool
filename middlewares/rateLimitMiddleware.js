// ============================================================
// middlewares/rateLimitMiddleware.js — Limitation tentatives login
// ============================================================
const rateLimit = require('express-rate-limit');

/** 5 tentatives max, blocage 15 minutes */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: null,
  handler: (req, res) => {
    req.flash('error', 'Trop de tentatives de connexion. Réessayez dans 15 minutes.');
    return res.redirect('/login');
  },
  skipSuccessfulRequests: true
});

module.exports = { loginLimiter };
