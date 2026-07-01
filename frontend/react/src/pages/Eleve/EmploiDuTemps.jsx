import { useState, useEffect } from 'react';
import { get } from '../../api/client';

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const creneaux = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

function parseHeure(h) {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

function getCreneauIndex(debut) {
  const d = parseHeure(debut);
  return creneaux.findIndex(c => {
    const [cd] = c.split('-');
    return parseHeure(cd) === d;
  });
}

export default function EleveEmploiDuTemps() {
  const [seances, setSeances] = useState([]);
  useEffect(() => {
    get('/api/eleve/emploi-du-temps').then(d => setSeances(d.seances || []));
  }, []);

  const grid = {};
  (seances || []).forEach(s => {
    const ci = getCreneauIndex(s.heure_debut);
    if (!grid[s.jour]) grid[s.jour] = {};
    if (!grid[s.jour][ci]) grid[s.jour][ci] = [];
    grid[s.jour][ci].push(s);
  });

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Mon emploi du temps</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{seances.length} séances cette semaine</span>
      </div>

      <div className="edt-grid">
        <div className="edt-header">Créneau</div>
        {jours.map(j => <div key={j} className="edt-header">{j}</div>)}
        {creneaux.map((creneau, ci) => (
          <>
            <div key={`t-${ci}`} className="edt-time">{creneau}</div>
            {jours.map(jour => {
              const cells = grid[jour]?.[ci];
              return (
                <div key={`${jour}-${ci}`} className="edt-cell">
                  {cells?.map(s => (
                    <div key={s.id} className="edt-course">
                      <div className="edt-course-name">{s.matiere_nom}</div>
                      <div className="edt-course-detail">{s.code}</div>
                      <div className="edt-course-detail">{s.prof_prenom} {s.prof_nom}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {seances.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state-icon"><i className="fas fa-calendar-alt"></i></div>
          Aucune séance cette semaine
        </div>
      )}
    </div>
  );
}
