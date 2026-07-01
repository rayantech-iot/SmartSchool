import { useState, useEffect } from 'react';
import { get, post, put, del } from '../../api/client';

export default function ProfDevoirs() {
  const [data, setData] = useState(null);
  const [cmData, setCmData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titre: '', description: '', date_limite: '', classe_id: '', matiere_id: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setData(await get('/api/professeur/devoirs')); } catch {} }
  async function loadCm() { try { setCmData(await get('/api/professeur/classes-matieres')); } catch {} }
  useEffect(() => { load(); loadCm(); }, []);

  const classes = data?.classes || [];
  const matieresParClasse = cmData?.matieresParClasse || {};
  const filteredMatieres = form.classe_id ? (matieresParClasse[form.classe_id] || []) : [];

  function openCreate() { setEditing(null); setForm({ titre: '', description: '', date_limite: '', classe_id: '', matiere_id: '' }); setShowForm(true); }
  function openEdit(d) { setEditing(d); setForm({ titre: d.titre, description: d.description, date_limite: d.date_limite?.split('T')[0] || '', classe_id: String(d.classe_id), matiere_id: String(d.matiere_id) }); setShowForm(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) { await put(`/api/professeur/devoirs/${editing.id}`, form); setMsg({ type: 'success', text: 'Devoir modifié' }); }
      else { await post('/api/professeur/devoirs', form); setMsg({ type: 'success', text: 'Devoir créé' }); }
      setShowForm(false); load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce devoir ?')) return;
    try { await del(`/api/professeur/devoirs/${id}`); setMsg({ type: 'success', text: 'Devoir supprimé' }); load(); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  if (!data) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Devoirs ({data.devoirs.length})</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nouveau devoir</button>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}<button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button></div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">{editing ? 'Modifier' : 'Nouveau'} devoir</span></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Titre</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required placeholder="Titre du devoir" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Description" rows={3} className="form-textarea" />
            </div>
            <div className="form-group">
              <label className="form-label">Date limite</label>
              <input type="date" value={form.date_limite} onChange={e => setForm({...form, date_limite: e.target.value})} required className="form-input" />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Classe</label>
                <select value={form.classe_id} onChange={e => setForm({...form, classe_id: e.target.value, matiere_id: ''})} required className="form-select">
                  <option value="">Choisir une classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Matière</label>
                <select value={form.matiere_id} onChange={e => setForm({...form, matiere_id: e.target.value})} required className="form-select">
                  <option value="">{form.classe_id ? 'Choisir une matière' : 'Sélectionnez d\'abord une classe'}</option>
                  {filteredMatieres.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.code})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-success">{editing ? 'Enregistrer' : 'Publier'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Tous les devoirs ({data.devoirs.length})</span></div>
        {data.devoirs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon" /><p>Aucun devoir</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Classe</th>
                  <th>Matière</th>
                  <th>Date limite</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.devoirs.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.titre}</td>
                    <td>{d.classe_nom} ({d.niveau})</td>
                    <td>{d.matiere_nom} <span className="badge badge-info">{d.code}</span></td>
                    <td>{new Date(d.date_limite).toLocaleDateString('fr-FR')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => openEdit(d)} className="btn btn-outline btn-sm">Modifier</button>
                      <button onClick={() => handleDelete(d.id)} className="btn btn-danger btn-sm">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}