import { useState, useEffect } from 'react';
import { get, post } from '../../api/client';

export default function AdminDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setDemandes(await get('/api/admin/demandes')); } catch {} }
  useEffect(() => { load(); }, []);

  async function handleAction(id, action) {
    try {
      await post(`/api/admin/demandes/${id}/${action}`, {});
      setMsg({ type: 'success', text: action === 'valider' ? 'Demande approuvée' : 'Demande refusée' });
      load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  const filtered = demandes.filter(d => filter === 'tous' || d.statut === filter);
  const statusClass = { en_attente: 'badge-warning', approuvé: 'badge-success', refusé: 'badge-danger' };

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Demandes de liaison</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="form-select">
          <option value="tous">Toutes</option>
          <option value="en_attente">En attente</option>
          <option value="approuvé">Approuvées</option>
          <option value="refusé">Refusées</option>
        </select>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{msg.text}</span>
          <button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">Aucune demande</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Email</th>
                <th>Élève</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.prenom} {d.nom}</td>
                  <td>{d.email}</td>
                  <td>{d.matricule}</td>
                  <td style={{ fontSize: 13 }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                  <td><span className={`badge ${statusClass[d.statut] || ''}`}>{d.statut}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    {d.statut === 'en_attente' && (
                      <>
                        <button onClick={() => handleAction(d.id, 'valider')} className="btn btn-sm btn-success" style={{ marginRight: 6 }}>Approuver</button>
                        <button onClick={() => handleAction(d.id, 'refuser')} className="btn btn-sm btn-danger">Refuser</button>
                      </>
                    )}
                    {d.statut !== 'en_attente' && <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
