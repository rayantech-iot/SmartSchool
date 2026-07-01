import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function AdminEvenements() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { get('/api/admin/evenements').then(setLogs); }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.prenom?.toLowerCase() || '').includes(q) || (l.nom?.toLowerCase() || '').includes(q) || (l.action?.toLowerCase() || '').includes(q) || (l.user_type?.toLowerCase() || '').includes(q);
  });

  const typeClass = { admin: 'badge-danger', professeur: 'badge-info', eleve: 'badge-success', parent: 'badge-warning' };

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Journal des événements</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{logs.length} entrée(s)</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans le journal..." className="form-input" />
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">Aucun événement</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  <td style={{ fontWeight: 500 }}>{l.prenom} {l.nom}</td>
                  <td><span className={`badge ${typeClass[l.user_type] || ''}`}>{l.user_type}</span></td>
                  <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
