import { useState, useEffect } from 'react';
import { get, post, put, del } from '../../api/client';

export default function AdminMatieres() {
  const [matieres, setMatieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', code: '', coefficient: '1', volume_horaire: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setMatieres(await get('/api/admin/matieres')); } catch {} }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm({ nom: '', code: '', coefficient: '1', volume_horaire: '' }); setShowModal(true); }
  function openEdit(m) { setEditing(m); setForm({ nom: m.nom, code: m.code || '', coefficient: String(m.coefficient || 1), volume_horaire: m.volume_horaire || '' }); setShowModal(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = { nom: form.nom, code: form.code || null, coefficient: parseFloat(form.coefficient) || 1, volume_horaire: form.volume_horaire ? parseInt(form.volume_horaire) : null };
      if (editing) { await put(`/api/admin/matieres/${editing.id}`, body); setMsg({ type: 'success', text: 'Matière modifiée' }); }
      else { await post('/api/admin/matieres', body); setMsg({ type: 'success', text: 'Matière créée' }); }
      setShowModal(false); load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette matière ?')) return;
    try { await del(`/api/admin/matieres/${id}`); setMsg({ type: 'success', text: 'Matière supprimée' }); load(); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Matières</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nouvelle matière</button>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{msg.text}</span>
          <button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {matieres.map((m, i) => (
          <div key={m.id} className="card" style={{ borderLeft: `4px solid ${colors[i % colors.length]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>{m.nom}</div>
                {m.code && <div style={{ fontSize: 12, color: '#9ca3af' }}>Code: {m.code}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: '#374151' }}>
              <div>Coefficient: <strong>{m.coefficient}</strong></div>
              {m.volume_horaire && <div>Volume horaire annuel: <strong>{m.volume_horaire}h</strong></div>}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(m)} className="btn btn-sm" style={{ background: '#eff6ff', color: '#2563eb' }}>Modifier</button>
              <button onClick={() => handleDelete(m.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Modifier' : 'Nouvelle'} matière</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="form-input" placeholder="ex: Mathématiques" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Code</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="form-input" placeholder="MATH" />
                </div>
                <div className="form-group">
                  <label className="form-label">Coefficient</label>
                  <input type="number" step="0.5" value={form.coefficient} onChange={e => setForm({...form, coefficient: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Volume horaire annuel</label>
                  <input type="number" value={form.volume_horaire} onChange={e => setForm({...form, volume_horaire: e.target.value})} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
