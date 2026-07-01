import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function ParentAbsences() {
  const [absences, setAbsences] = useState(null);
  useEffect(() => { get('/api/parent/absences').then(d => setAbsences(d.absences)); }, []);

  if (!absences) return <p>Chargement...</p>;

  return (
    <div>
      <h1 className="page-title">Absences</h1>
      <div className="table-wrap">
        {absences.length === 0 ? (
          <div className="empty-state"><i className="fas fa-calendar-check"></i> Aucune absence</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Jour</th>
                <th>Horaire</th>
                <th>matière</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{new Date(a.date || a.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>{a.jour || '—'}</td>
                  <td>{a.heure_debut ? `${a.heure_debut} - ${a.heure_fin}` : '—'}</td>
                  <td>{a.matiere_nom || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}