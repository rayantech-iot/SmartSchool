


const { LogActivite } = require('../models');

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || req.ip
    || '0.0.0.0';
}


async function log(req, action, details = null, utilisateurId = null) {
  try {
    const uid = utilisateurId ?? req.session?.user?.id ?? null;
    await LogActivite.create({
      utilisateur_id: uid,
      action,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      ip_adresse: getIp(req),
      date_action: new Date()
    });
  } catch (err) {
    console.error('Erreur LOG_ACTIVITE:', err.message);
  }
}

module.exports = { log, getIp };
