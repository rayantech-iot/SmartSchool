import { useState, useEffect } from 'react';
import { get, post, put, del } from '../../api/client';

export default function ProfNotes() {
  const [data, setData] = useState(null);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ eleve_id: '', valeur: '', type_evaluation: 'devoir', appreciation: '', periode: 'trimestre1' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loadingStudents, setLoadingStudents] = useState(false);

  async function load() { try { setData(await get('/api/professeur/classes-matieres')); } catch {} }
  useEffect(() => { load(); }, []);

  const classes = data?.classes || [];
  const matieresParClasse = data?.matieresParClasse || {};
  const matieres = selectedClasse ? (matieresParClasse[selectedClasse] || []) : [];

  useEffect(() => {
    if (matieres.length === 1) setSelectedMatiere(String(matieres[0].id));
  }, [selectedClasse, matieres]);

  async function loadStudents() {
    if (!selectedClasse || !selectedMatiere) return;
    setLoadingStudents(true);
    try {
      const res = await get(`/api/professeur/notes/students/${selectedClasse}/${selectedMatiere}`);
      setStudents(res.students || []);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setLoadingStudents(false);
  }

  useEffect(() => {
    if (selectedClasse && selectedMatiere) loadStudents();
  }, [selectedClasse, selectedMatiere]);

  function openAdd(eleveId) {
    setEditNote(null);
    setForm({ eleve_id: String(eleveId), valeur: '', type_evaluation: 'devoir', appreciation: '', periode: 'trimestre1' });
    setShowModal(true);
  }

  function openEdit(n) {
    setEditNote(n);
    setForm({ eleve_id: String(n.eleve_id), valeur: String(n.valeur), type_evaluation: n.type_evaluation, appreciation: n.appreciation || '', periode: n.periode || 'trimestre1' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = { ...form, matiere_id: parseInt(selectedMatiere), valeur: parseFloat(form.valeur), date_evaluation: new Date().toISOString().split('T')[0] };
      if (editNote) {
        await put(`/api/professeur/notes/${editNote.id}`, body);
        setMsg({ type: 'success', text: 'Note modifiée' });
      } else {
        await post('/api/professeur/notes', body);
        setMsg({ type: 'success', text: 'Note ajoutée' });
      }
      setShowModal(false);
      loadStudents();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette note ?')) return;
    try { await del(`/api/professeur/notes/${id}`); setMsg({ type: 'success', text: 'Note supprimée' }); loadStudents(); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  const selectedMatiereNom = matieres.find(m => String(m.id) === selectedMatiere)?.nom || '';

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Gestion des notes</h1>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}<button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button></div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Sélection</span></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Classe</label>
            <select value={selectedClasse} onChange={e => { setSelectedClasse(e.target.value); setSelectedMatiere(''); setStudents([]); }} className="form-select">
              <option value="">Choisir une classe</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
            </select>
          </div>
          {selectedClasse && (
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Matière</label>
              {matieres.length > 1 ? (
                <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)} className="form-select">
                  <option value="">Choisir une matière</option>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              ) : matieres.length === 1 ? (
                <div style={{ padding: '10px 14px', background: '#f0f4ff', borderRadius: 8, fontWeight: 600, fontSize: 14, color: '#1e3a8a' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: 8 }} />{matieres[0].nom}
                </div>
              ) : (
                <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
                  Aucune matière associée à cette classe
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {students.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Élèves — {selectedMatiereNom} ({students.length})</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'center', width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.prenom} {s.nom} <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.matricule}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {s.notes.length === 0 ? (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>Aucune note</span>
                        ) : (
                          s.notes.map(n => (
                            <span key={n.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0f4ff', borderRadius: 6, padding: '3px 8px', fontSize: 12 }}>
                              <strong style={{ color: '#1e40af' }}>{n.valeur}/20</strong>
                              <span style={{ color: '#6b7280', fontSize: 10 }}>{n.type_evaluation}</span>
                              {n.appreciation && <span style={{ color: '#9ca3af', fontSize: 10, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>— {n.appreciation}</span>}
                              <button onClick={() => openEdit(n)} className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 9, background: 'transparent', color: '#2563eb' }} title="Modifier"><i className="fas fa-pen" /></button>
                              <button onClick={() => handleDelete(n.id)} className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 9, background: 'transparent', color: '#dc2626' }} title="Supprimer"><i className="fas fa-trash" /></button>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => openAdd(s.id)} className="btn btn-sm btn-primary" style={{ fontSize: 11 }}>
                        <i className="fas fa-plus" style={{ marginRight: 4 }} />Ajouter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loadingStudents && <div className="empty-state">Chargement des élèves...</div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{editNote ? 'Modifier' : 'Ajouter'} une note</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Note (0-20)</label>
                <input type="number" step="0.5" min="0" max="20" value={form.valeur} onChange={e => setForm({...form, valeur: e.target.value})} required className="form-input" placeholder="Ex: 15" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Type d'évaluation</label>
                <select value={form.type_evaluation} onChange={e => setForm({...form, type_evaluation: e.target.value})} className="form-select">
                  <option value="devoir">Devoir</option>
                  <option value="composition">Composition</option>
                  <option value="pratique">Pratique</option>
                  <option value="oral">Oral</option>
                  <option value="examen">Examen</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Appréciation</label>
                <textarea value={form.appreciation} onChange={e => setForm({...form, appreciation: e.target.value})} placeholder="Optionnelle" rows={2} className="form-textarea" />
              </div>
              <div className="form-group">
                <label className="form-label">Période</label>
                <select value={form.periode} onChange={e => setForm({...form, periode: e.target.value})} className="form-select">
                  <option value="trimestre1">Trimestre 1</option>
                  <option value="trimestre2">Trimestre 2</option>
                  <option value="trimestre3">Trimestre 3</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Annuler</button>
                <button type="submit" className="btn btn-primary">{editNote ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}