import { useState, useEffect } from 'react';
import { get, post, put, del } from '../../api/client';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', niveau: '', cycle: 'Premier', salle: '', capacite: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setClasses(await get('/api/admin/classes')); } catch {} }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm({ nom: '', niveau: '', cycle: 'Premier', salle: '', capacite: '' }); setShowModal(true); }
  function openEdit(c) { setEditing(c); setForm({ nom: c.nom, niveau: c.niveau, cycle: c.cycle, salle: c.salle || '', capacite: c.capacite || '' }); setShowModal(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = { ...form, capacite: form.capacite ? parseInt(form.capacite) : null };
      if (editing) { await put(`/api/admin/classes/${editing.id}`, body); setMsg({ type: 'success', text: 'Classe modifiée' }); }
      else { await post('/api/admin/classes', body); setMsg({ type: 'success', text: 'Classe créée' }); }
      setShowModal(false); load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette classe ?')) return;
    try { await del(`/api/admin/classes/${id}`); setMsg({ type: 'success', text: 'Classe supprimée' }); load(); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  const cycleLabels = { Premier: '1er cycle', Second: '2nd cycle' };
  const cycleClass = { Premier: 'badge-info', Second: 'badge-success' };

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Classes</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nouvelle classe</button>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{msg.text}</span>
          <button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {classes.map(c => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>{c.nom}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{c.niveau}</div>
              </div>
              <span className={`badge ${cycleClass[c.cycle] || ''}`}>{cycleLabels[c.cycle] || c.cycle}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: '#374151' }}>
              <div><strong>{c.nb_eleves}</strong> élève(s)</div>
              {c.salle && <div>Salle: <strong>{c.salle}</strong></div>}
              {c.capacite && <div>Cap.: <strong>{c.capacite}</strong></div>}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(c)} className="btn btn-sm" style={{ background: '#eff6ff', color: '#2563eb' }}>Modifier</button>
              <button onClick={() => handleDelete(c.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Modifier' : 'Nouvelle'} classe</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom de la classe</label>
                <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="form-input" placeholder="ex: 6ème A" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Niveau</label>
                  <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})} className="form-select">
                    <option value="6ème">6ème</option>
                    <option value="5ème">5ème</option>
                    <option value="4ème">4ème</option>
                    <option value="3ème">3ème</option>
                    <option value="2nde">2nde</option>
                    <option value="1ère">1ère</option>
                    <option value="Tle">Tle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cycle</label>
                  <select value={form.cycle} onChange={e => setForm({...form, cycle: e.target.value})} className="form-select">
                    <option value="Premier">1er cycle</option>
                    <option value="Second">2nd cycle</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Salle</label>
                  <input value={form.salle} onChange={e => setForm({...form, salle: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacité</label>
                  <input type="number" value={form.capacite} onChange={e => setForm({...form, capacite: e.target.value})} className="form-input" />
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
