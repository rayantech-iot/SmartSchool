import { useState, useEffect } from 'react';
import { get, post } from '../../api/client';

export default function ParentDashboard() {
  const [stats, setStats] = useState(null);
  const [enfants, setEnfants] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [matricule, setMatricule] = useState('');
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => { get('/api/parent/dashboard').then(setStats); }, []);
  useEffect(() => { get('/api/parent/enfants').then(d => setEnfants(d.enfants || [])).catch(() => {}); }, []);

  async function handleAddEnfant(e) {
    e.preventDefault();
    setAdding(true);
    setAddMsg({ type: '', text: '' });
    try {
      const data = await post('/api/parent/ajouter-enfant', { matricule });
      setAddMsg({ type: 'success', text: data.message });
      setMatricule('');
      setTimeout(() => { setShowAdd(false); setAddMsg({ type: '', text: '' }); }, 3000);
    } catch (err) {
      setAddMsg({ type: 'error', text: err.message });
    } finally {
      setAdding(false);
    }
  }

  if (!stats) return <div className="empty-state">Chargement...</div>;

  const moyenne = parseFloat(stats.moyenne) || 0;
  const absences = stats.absences || 0;
  const attendance = Math.max(0, Math.min(100, 100 - absences * 5));

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Tableau de bord</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm">
            <i className="fas fa-plus"></i> Ajouter un enfant
          </button>
        </div>
      </div>

      {stats.enfant && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#3b82f6' }}>
              <i className="fas fa-user-graduate"></i>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{stats.enfant.prenom} {stats.enfant.nom}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Matricule : {stats.enfant.matricule} &mdash; Classe : {stats.enfant.classe_nom}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Notes', value: stats.notes, icon: <i className="fas fa-star"></i>, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Moyenne', value: stats.moyenne || '&mdash;', icon: <i className="fas fa-chart-bar"></i>, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Absences', value: absences, icon: <i className="fas fa-exclamation-triangle"></i>, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Messages non lus', value: stats.nonLus, icon: <i className="fas fa-envelope"></i>, color: '#ef4444', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{typeof s.value === 'number' ? s.value : '&mdash;'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {stats.moyennesParMatiere && stats.moyennesParMatiere.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {stats.moyennesParMatiere.map(m => (
            <div key={m.matiere_nom} style={{ background: '#f0f4ff', borderRadius: 10, padding: '10px 16px', minWidth: 140 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{m.matiere_nom}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: parseFloat(m.moyenne) >= 10 ? '#059669' : '#dc2626' }}>
                {m.moyenne} <span style={{ fontSize: 13, fontWeight: 400, color: '#9ca3af' }}>/20</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.nb_notes} note(s)</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Actions rapides</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Voir les bulletins', path: '/parent/bulletins', icon: <i className="fas fa-file-alt"></i> },
              { label: 'Consulter les absences', path: '/parent/absences', icon: <i className="fas fa-exclamation-triangle"></i> },
              { label: 'Emploi du temps', path: '/parent/emploiDuTemps', icon: <i className="fas fa-calendar-alt"></i> },
              { label: 'Messagerie', path: '/parent/messages', icon: <i className="fas fa-envelope"></i> },
            ].map(a => (
              <a key={a.path} href={a.path} className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: 13, padding: '10px 14px' }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                {a.label}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}><i className="fas fa-arrow-right"></i></span>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Résumé scolaire</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#374151' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280' }}>Moyenne générale</span>
              <span style={{ fontWeight: 700, color: moyenne >= 10 ? '#059669' : '#dc2626' }}>
                {stats.moyenne || '&mdash;'}/20
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280' }}>Total absences</span>
              <span style={{ fontWeight: 700 }}>{absences}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: '#6b7280' }}>Notes enregistrées</span>
              <span style={{ fontWeight: 700 }}>{stats.notes || 0}</span>
            </div>
          </div>
          <div className="chart-bar-h" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
            <div className="chart-bar-label">Moyenne</div>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ width: `${(moyenne / 20) * 100}%`, background: moyenne >= 10 ? '#059669' : '#dc2626' }}></div>
            </div>
            <div className="chart-bar-value">{moyenne.toFixed(1)}/20</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Assiduité</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <div className="chart-donut">
              <div className="chart-donut-bg"></div>
              <div className="chart-donut-fill" style={{ background: `conic-gradient(#059669 ${attendance}%, #e5e7eb ${attendance}%)` }}></div>
              <div className="chart-donut-inner">
                <div className="chart-donut-value">{attendance}%</div>
                <div className="chart-donut-label">présence</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setAddMsg({ type: '', text: '' }); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Ajouter un enfant</h2>
            {addMsg.text && (
              <div className={`alert ${addMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
                {addMsg.text}
              </div>
            )}
            <form onSubmit={handleAddEnfant}>
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user-graduate"></i> Matricule de l'enfant
                </label>
                <input required value={matricule} onChange={e => setMatricule(e.target.value)}
                  className="form-input" placeholder="Ex: STU-001"
                  style={{ borderColor: '#3b82f6', borderWidth: 2 }} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  Le matricule se trouve sur le carnet scolaire
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => { setShowAdd(false); setAddMsg({ type: '', text: '' }); }} className="btn btn-outline">Annuler</button>
                <button type="submit" disabled={adding} className="btn btn-primary">
                  {adding ? <><i className="fas fa-spinner fa-spin"></i> Envoi...</> : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
