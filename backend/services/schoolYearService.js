





function getAnneeScolaireCourante(date = new Date()) {
  const mois = date.getMonth() + 1;
  const annee = date.getFullYear();
  if (mois >= 9) {
    return `${annee}-${annee + 1}`;
  }
  return `${annee - 1}-${annee}`;
}


function estFormatValide(annee) {
  if (!annee || typeof annee !== 'string') return false;
  const m = annee.match(/^(\d{4})-(\d{4})$/);
  if (!m) return false;
  const debut = parseInt(m[1], 10);
  const fin = parseInt(m[2], 10);
  return fin === debut + 1;
}


function estAnneeScolaireCourante(annee) {
  return estFormatValide(annee) && annee === getAnneeScolaireCourante();
}

module.exports = {
  getAnneeScolaireCourante,
  estFormatValide,
  estAnneeScolaireCourante
};
