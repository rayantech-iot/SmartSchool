



const CYCLES = {
  primaire: {
    label: 'Primaire',
    ordre: 1,
    niveaux: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'],
    capacite: 30,
    prefixeSalle: 'PRI'
  },
  college: {
    label: 'Collège',
    ordre: 2,
    niveaux: ['Sixième', 'Cinquième', 'Quatrième', 'Troisième'],
    capacite: 40,
    prefixeSalle: 'COL'
  },
  lycee: {
    label: 'Lycée',
    ordre: 3,
    niveaux: ['Seconde', 'Première', 'Terminale'],
    capacite: 45,
    prefixeSalle: 'LYC'
  }
};

const SECTIONS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];


const PAUSES = [
  { debut: '10:00', fin: '10:30', label: 'Pause matin' },
  { debut: '12:00', fin: '14:00', label: 'Pause déjeuner' }
];


const CRENEAUX_HORAIRES = [
  { debut: '08:00', fin: '10:00' },
  { debut: '10:30', fin: '12:00' },
  { debut: '14:00', fin: '16:00' },
  { debut: '16:15', fin: '18:15' }
];

function normaliserHeure(h) {
  if (!h) return '';
  const s = String(h);
  return s.length >= 5 ? s.substring(0, 5) : s;
}

function creneauxSeChevauchent(d1, f1, d2, f2) {
  const a = normaliserHeure(d1);
  const b = normaliserHeure(f1);
  const c = normaliserHeure(d2);
  const d = normaliserHeure(f2);
  return a < d && c < b;
}

function chevauchePause(heureDebut, heureFin) {
  return PAUSES.some((p) =>
    creneauxSeChevauchent(heureDebut, heureFin, p.debut, p.fin)
  );
}


function construireTimelineJour(seances = []) {
  const items = PAUSES.map((p) => ({
    type: 'pause',
    debut: p.debut,
    fin: p.fin,
    label: p.label
  }));
  seances.forEach((s) => {
    items.push({
      type: 'seance',
      debut: normaliserHeure(s.heure_debut),
      fin: normaliserHeure(s.heure_fin),
      seance: s
    });
  });
  return items.sort((a, b) => a.debut.localeCompare(b.debut));
}

module.exports = {
  CYCLES,
  SECTIONS,
  JOURS_SEMAINE,
  PAUSES,
  CRENEAUX_HORAIRES,
  normaliserHeure,
  creneauxSeChevauchent,
  chevauchePause,
  construireTimelineJour
};
