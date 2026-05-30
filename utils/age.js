/**
 * Vérifie qu'une personne a au moins `minAns` ans à la date du jour.
 * @param {string|Date} dateNaissance - DATEONLY ou Date
 * @param {number} minAns
 */
function aAuMoinsAns(dateNaissance, minAns = 6) {
  const naissance = new Date(dateNaissance);
  if (Number.isNaN(naissance.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - naissance.getFullYear();
  const m = today.getMonth() - naissance.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < naissance.getDate())) age -= 1;
  return age >= minAns;
}

module.exports = { aAuMoinsAns };
