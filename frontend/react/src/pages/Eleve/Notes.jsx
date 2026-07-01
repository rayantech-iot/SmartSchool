import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function EleveNotes() {
  const [data, setData] = useState(null);
  useEffect(() => { get('/api/eleve/notes').then(setData); }, []);

  if (!data) return <p>Chargement...</p>;

  const notes = data.notes || [];
  const moyennes = data.moyennes || [];

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Mes notes</h1>
      </div>

      {moyennes.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {moyennes.map(m => (
            <div key={m.matiere_id} style={{ background: '#f0f4ff', borderRadius: 10, padding: '10px 16px', minWidth: 140 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{m.matiere_nom}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: m.moyenne >= 10 ? '#059669' : '#dc2626' }}>
                {m.moyenne} <span style={{ fontSize: 14, fontWeight: 400, color: '#9ca3af' }}>/20</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.nb_notes} note(s)</div>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state">Aucune note</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Note</th>
                <th>Type</th>
                <th>Appréciation</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600 }}>{n.matiere_nom}</td>
                  <td><span className="badge badge-info">{n.valeur}/20</span></td>
                  <td>{n.type_evaluation}</td>
                  <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 200 }}>{n.appreciation || '—'}</td>
                  <td>{new Date(n.date_evaluation).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}