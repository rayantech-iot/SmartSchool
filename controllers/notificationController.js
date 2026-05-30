// ============================================================
// controllers/notificationController.js — API notifications in-app
// ============================================================
const { Notification } = require('../models');

/**
 * Retourne le nombre de notifications non lues (badge navbar)
 */
exports.getNonLues = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { utilisateur_id: req.session.user.id, lu: false }
    });
    res.json({ nonLues: count });
  } catch (err) {
    res.json({ nonLues: 0 });
  }
};

/**
 * Liste les notifications de l'utilisateur connecté
 */
exports.index = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { utilisateur_id: req.session.user.id },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement notifications' });
  }
};

/**
 * Marque une notification comme lue
 */
exports.marquerLue = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, utilisateur_id: req.session.user.id }
    });
    if (notif) await notif.update({ lu: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur' });
  }
};
