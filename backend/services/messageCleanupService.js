const db = require('../config/db');

async function purgerMessagesAnciens(mois = 1) {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - mois);
  const result = await db.query('DELETE FROM messages WHERE created_at < ?', [limite]);
  if (result.affectedRows > 0) {
    console.log(`[messages] ${result.affectedRows} message(s) supprimé(s) (> ${mois} mois).`);
  }
  return result.affectedRows;
}

module.exports = { purgerMessagesAnciens };
