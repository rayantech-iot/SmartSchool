import { useState, useEffect } from 'react';
import { get, post } from '../../api/client';

export default function ProfPresences() {
  const [data, setData] = useState(null);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [eleves, setEleves] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() { try { setData(await get('/api/professeur/classes-matieres')); } catch {} }
  useEffect(() => { load(); }, []);

  const classes = data?.classes || [];
  const matieresParClasse = data?.matieresParClasse || {};
  const matieres = selectedClasse ? (matieresParClasse[selectedClasse] || []) : [];

  useEffect(() => {
    if (matieres.length === 1) setSelectedMatiere(String(matieres[0].id));
  }, [selectedClasse, matieres]);

  async function loadEleves() {
    if (!selectedClasse) return;
    setLoading(true);
    try {
      const res = await get(`/api/professeur/presences/students/${selectedClasse}`);
      setEleves((res.eleves || []).map(e => ({ ...e, present: true })));
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!selectedClasse) return;
    setSaving(true);
    try {
      const matiere_id = selectedMatiere ? parseInt(selectedMatiere) : (matieres.length === 1 ? matieres[0].id : null);
      await post('/api/professeur/presences/class', {
        classe_id: parseInt(selectedClasse),
        matiere_id,
        date,
        eleves: eleves.map(e => ({ id: e.id, present: e.present }))
      });
      setMsg({ type: 'success', text: 'Présences enregistrées !' });
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setSaving(false);
  }

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Appel des présences</h1>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}<button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button></div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Sélection</span></div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Classe</label>
            <select value={selectedClasse} onChange={e => { setSelectedClasse(e.target.value); setSelectedMatiere(''); setEleves([]); }} className="form-select">
              <option value="">Choisir une classe</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
            </select>
          </div>
          {selectedClasse && matieres.length > 1 && (
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Matière</label>
              <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)} className="form-select">
                <option value="">Choisir</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
          </div>
          <button onClick={loadEleves} disabled={!selectedClasse || loading} className="btn btn-primary" style={{ marginBottom: 4 }}>
            {loading ? 'Chargement...' : <><i className="fas fa-sync" style={{ marginRight: 6 }} />Charger la liste</>}
          </button>
        </div>
        {selectedClasse && matieres.length === 1 && (
          <div style={{ marginTop: 8, padding: '8px 14px', background: '#f0f4ff', borderRadius: 8, fontSize: 13, color: '#1e3a8a', display: 'inline-block' }}>
            <i className="fas fa-book" style={{ marginRight: 6 }} />{matieres[0].nom}
          </div>
        )}
      </div>

      {eleves.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Liste des élèves ({eleves.length}) — {date}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEleves(eleves.map(e => ({ ...e, present: true })))} className="btn btn-sm btn-outline">Tous présents</button>
              <button onClick={() => setEleves(eleves.map(e => ({ ...e, present: false })))} className="btn btn-sm btn-outline">Tous absents</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {eleves.map(e => (
                  <tr key={e.id}>
                    <td>
                      <input type="checkbox" checked={e.present} onChange={() => setEleves(eleves.map(x => x.id === e.id ? { ...x, present: !x.present } : x))}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#059669' }} />
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{e.matricule}</td>
                    <td style={{ fontWeight: 600 }}>{e.prenom} {e.nom}</td>
                    <td><span className={`badge ${e.present ? 'badge-success' : 'badge-danger'}`}>{e.present ? 'Présent' : 'Absent'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={saving} className="btn btn-success">
              {saving ? 'Enregistrement...' : 'Enregistrer les présences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}