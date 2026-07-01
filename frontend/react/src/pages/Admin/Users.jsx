import { useState, useEffect } from 'react';
import { get, post, put, del } from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', motDePasse: '', type: 'eleve', telephone: '', statut: 'actif' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try { setUsers(await get('/api/admin/utilisateurs')); } catch {}
    setLoading(false);
  }
  useEffect(() => { loadUsers(); }, []);

  const roleLabels = { admin: 'Admin', professeur: 'Professeur', eleve: 'Élève', parent: 'Parent' };
  const roleClass = { admin: 'badge-danger', professeur: 'badge-info', eleve: 'badge-success', parent: 'badge-warning' };

  function openCreate() {
    setEditing(null);
    setForm({ nom: '', prenom: '', email: '', motDePasse: '', type: 'eleve', telephone: '', statut: 'actif' });
    setShowModal(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, type: u.type, telephone: u.telephone || '', statut: u.statut, motDePasse: '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        const body = { nom: form.nom, prenom: form.prenom, email: form.email, type: form.type, telephone: form.telephone, statut: form.statut };
        if (form.motDePasse) body.motDePasse = form.motDePasse;
        await put(`/api/admin/utilisateurs/${editing.id}`, body);
        setMsg({ type: 'success', text: 'Utilisateur modifié' });
      } else {
        await post('/api/admin/utilisateurs', form);
        setMsg({ type: 'success', text: 'Utilisateur créé' });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try { await del(`/api/admin/utilisateurs/${id}`); setMsg({ type: 'success', text: 'Utilisateur supprimé' }); loadUsers(); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function toggleStatus(u) {
    const newStatut = u.statut === 'actif' ? 'inactif' : 'actif';
    try { await put(`/api/admin/utilisateurs/${u.id}`, { statut: newStatut }); loadUsers(); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  const filtered = users.filter(u => {
    if (filter !== 'tous' && u.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Gestion des utilisateurs</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Nouvel utilisateur</button>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{msg.text}</span>
          <button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="form-row">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="form-select">
          <option value="tous">Tous les rôles</option>
          <option value="eleve">Élèves</option>
          <option value="professeur">Professeurs</option>
          <option value="parent">Parents</option>
          <option value="admin">Admins</option>
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="form-input" />
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${roleClass[u.type] || ''}`}>{roleLabels[u.type]}</span></td>
                  <td>
                    <button onClick={() => toggleStatus(u)} className="btn btn-sm" style={{ background: '#f3f4f6', color: '#374151' }}>
                      {u.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => openEdit(u)} className="btn btn-sm" style={{ background: '#eff6ff', color: '#2563eb', marginRight: 4 }}>Modifier</button>
                    {u.type !== 'admin' && <button onClick={() => handleDelete(u.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>Supprimer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Modifier' : 'Nouvel'} utilisateur</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe {editing && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(laisser vide pour ne pas changer)</span>}</label>
                <input type="password" value={form.motDePasse} onChange={e => setForm({...form, motDePasse: e.target.value})} required={!editing} className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Rôle</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="form-select">
                    <option value="eleve">Élève</option>
                    <option value="professeur">Professeur</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className="form-input" />
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
