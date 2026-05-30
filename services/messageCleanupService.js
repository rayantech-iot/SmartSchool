const { Op } = require('sequelize');
const { Message } = require('../models');

/** Supprime les messages de plus d'un mois (libération BDD). */
async function purgerMessagesAnciens(mois = 1) {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - mois);
  const supprimes = await Message.destroy({
    where: { createdAt: { [Op.lt]: limite } }
  });
  if (supprimes > 0) {
    console.log(`[messages] ${supprimes} message(s) supprimé(s) (> ${mois} mois).`);
  }
  return supprimes;
}

module.exports = { purgerMessagesAnciens };
