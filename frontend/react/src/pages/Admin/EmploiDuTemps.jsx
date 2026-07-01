import { useState, useEffect } from 'react';
import { get, post } from '../../api/client';

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const creneaux = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

function parseHeure(h) {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

function getCreneauIndex(debut) {
  const d = parseHeure(debut);
  return creneaux.findIndex(c => {
    const [cd] = c.split('-');
    return parseHeure(cd) === d;
  });
}

export default function AdminEmploiDuTemps() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('view');
  const [genClasse, setGenClasse] = useState('');
  const [genAll, setGenAll] = useState(false);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [viewClasse, setViewClasse] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setData(await get('/api/admin/emploi-du-temps')); } catch {} }
  useEffect(() => { load(); }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    setGenResult(null);
    setMsg({ type: '', text: '' });
    try {
      if (genAll) {
        const res = await post('/api/admin/emploi-du-temps/auto-generate-all', { date_debut: dateDebut || null, date_fin: dateFin || null });
        setGenResult(res);
        setMsg({ type: res.ok ? 'success' : 'warning', text: `${res.reussis}/${res.total} classe(s) générée(s)${res.erreurs.length ? '. Erreurs: ' + res.erreurs.join(', ') : ''}` });
      } else {
        const res = await post('/api/admin/emploi-du-temps/auto-generate', { classe_id: parseInt(genClasse), date_debut: dateDebut || null, date_fin: dateFin || null });
        setGenResult(res);
        setMsg({ type: res.ok ? 'success' : 'error', text: res.ok ? `${res.seancesCreees} séance(s) générée(s)` : res.erreurs?.join(', ') || 'Erreur' });
      }
      load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setGenerating(false);
  }

  if (!data) return <div className="empty-state">Chargement...</div>;

  const classes = data.classes || [];
  const seances = data.seances || [];
  const edts = data.emploisDuTemps || [];

  const selectedEdt = viewClasse ? edts.find(e => e.classe_id === parseInt(viewClasse)) : null;
  const clsSeances = selectedEdt ? seances.filter(s => s.emploi_du_temps_id === selectedEdt.id) : [];
  const grid = {};
  clsSeances.forEach(s => {
    const ci = getCreneauIndex(s.heure_debut);
    if (ci === -1) return;
    if (!grid[s.jour]) grid[s.jour] = {};
    if (!grid[s.jour][ci]) grid[s.jour][ci] = [];
    grid[s.jour][ci].push(s);
  });

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 12 }}>Emploi du temps</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 8 }}>
        <button onClick={() => setTab('view')} className={`btn btn-sm ${tab === 'view' ? 'btn-primary' : 'btn-ghost'}`}><i className="fas fa-eye" style={{ marginRight: 6 }} />Visualisation</button>
        <button onClick={() => setTab('generate')} className={`btn btn-sm ${tab === 'generate' ? 'btn-primary' : 'btn-ghost'}`}><i className="fas fa-cog" style={{ marginRight: 6 }} />Génération</button>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}<button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button></div>}

      {tab === 'generate' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Classe</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <select value={genClasse} onChange={e => { setGenClasse(e.target.value); setGenAll(false); }} className="form-select" disabled={genAll} style={{ flex: 1 }}>
                  <option value="">Sélectionner une classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={genAll} onChange={e => { setGenAll(e.target.checked); if (e.target.checked) setGenClasse(''); }} />
                  Toutes les classes
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date début</label>
                <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="form-input" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date fin</label>
                <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="form-input" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={generating || (!genAll && !genClasse)}>
              {generating ? 'Génération en cours...' : <><i className="fas fa-magic" style={{ marginRight: 6 }} />Générer</>}
            </button>
          </form>

          {genResult && genResult.details && (
            <div style={{ marginTop: 16, maxHeight: 300, overflowY: 'auto' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Résultats</h3>
              {genResult.details.map(r => (
                <div key={r.classe_id} style={{ fontSize: 12, padding: '4px 0', display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 600, minWidth: 120 }}>{r.libelle || '?'}</span>
                  {r.ok ? <span style={{ color: '#10b981' }}>✓ {r.seancesCreees} séance(s)</span> : <span style={{ color: '#ef4444' }}>✗ {r.erreurs?.join(', ')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'view' && (
        <div>
          <div className="form-group" style={{ maxWidth: 400 }}>
            <label className="form-label">Sélectionner une classe</label>
            <select value={viewClasse} onChange={e => setViewClasse(e.target.value)} className="form-select">
              <option value="">Choisir une classe</option>
              {classes.map(c => {
                const edt = edts.find(e => e.classe_id === c.id);
                return <option key={c.id} value={c.id}>{c.nom} ({c.niveau}){edt ? '' : ' — Aucun EDT'}</option>;
              })}
            </select>
          </div>

          {selectedEdt && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                {selectedEdt.date_debut && <span>Du {new Date(selectedEdt.date_debut).toLocaleDateString('fr-FR')}</span>}
                {selectedEdt.date_fin && <span>Au {new Date(selectedEdt.date_fin).toLocaleDateString('fr-FR')}</span>}
                <span>{clsSeances.length} séance(s)</span>
              </div>
              {clsSeances.length === 0 ? (
                <div className="empty-state" style={{ background: '#fff', borderRadius: 12 }}>Aucune séance pour cette classe. Générez d'abord un emploi du temps.</div>
              ) : (
                <div className="edt-grid">
                  <div className="edt-header">Créneau</div>
                  {jours.map(j => <div key={j} className="edt-header">{j}</div>)}
                  {creneaux.map((creneau, ci) => (
                    <div key={`row-${ci}`} style={{ display: 'contents' }}>
                      <div className="edt-time">{creneau}</div>
                      {jours.map(jour => {
                        const cells = grid[jour]?.[ci];
                        return (
                          <div key={`${jour}-${ci}`} className="edt-cell">
                            {cells?.map(s => (
                              <div key={s.id} className="edt-course">
                                <div className="edt-course-name">{s.matiere_nom}</div>
                                <div className="edt-course-detail">{s.prenom} {s.nom}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}