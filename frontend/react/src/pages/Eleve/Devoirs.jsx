import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function EleveDevoirs() {
  const [devoirs, setDevoirs] = useState(null);
  useEffect(() => { get('/api/eleve/devoirs').then(d => setDevoirs(d.devoirs)); }, []);

  if (!devoirs) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Mes devoirs</h1>
      </div>
      {devoirs.length === 0 ? (
        <div className="empty-state">Aucun devoir</div>
      ) : (
        <div className="grid-3">
          {devoirs.map(d => (
            <div key={d.id} className="card">
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{d.titre}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{d.matiere_nom}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Professeur : {d.prof_prenom} {d.prof_nom}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>À rendre le {new Date(d.date_limite).toLocaleDateString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
