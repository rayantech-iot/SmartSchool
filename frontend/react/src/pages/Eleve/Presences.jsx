import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function ElevePresences() {
  const [presences, setPresences] = useState(null);
  useEffect(() => { get('/api/eleve/presences').then(d => setPresences(d.presences)); }, []);

  if (!presences) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Mes présences</h1>
      </div>
      {presences.length === 0 ? (
        <div className="empty-state">Aucune présence</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Jour</th>
                <th>Horaire</th>
                <th>Matière</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {presences.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.date || p.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>{p.jour || '—'}</td>
                  <td>{p.heure_debut ? `${p.heure_debut} - ${p.heure_fin}` : '—'}</td>
                  <td>{p.matiere_nom || '—'}</td>
                  <td>
                    <span className={`badge ${p.statut === 'present' ? 'badge-success' : 'badge-danger'}`}>
                      {p.statut === 'present' ? 'Présent' : 'Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}