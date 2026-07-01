import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function ParentBulletins() {
  const [bulletins, setBulletins] = useState(null);
  useEffect(() => { get('/api/parent/bulletins').then(d => setBulletins(d.bulletins)); }, []);

  if (!bulletins) return <p>Chargement...</p>;

  return (
    <div>
      <h1 className="page-title">Bulletins scolaires</h1>
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {bulletins.length === 0 ? (
          <div className="empty-state"><i className="fas fa-file"></i> Aucun bulletin</div>
        ) : bulletins.map(b => (
          <div key={b.id} className="card">
            <div className="card-header">
              <span className="card-title">{b.periode}</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{b.classe_nom}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{b.moyenne_generale}</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>/20</span>
            </div>
            {b.appreciation_generale && (
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                {b.appreciation_generale}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
