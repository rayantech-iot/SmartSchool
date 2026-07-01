const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];


function jourScolaireDepuisDate(dateIso) {
  if (!dateIso) return null;
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return JOURS_SEMAINE[d.getDay()];
}

module.exports = { jourScolaireDepuisDate, JOURS_SEMAINE };
