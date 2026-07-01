import { useState, useEffect } from 'react';
import { get, post } from '../../api/client';

export default function ProfMessages() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [recipType, setRecipType] = useState('eleve');
  const [recipClasse, setRecipClasse] = useState('');
  const [destinataires, setDestinataires] = useState([]);
  const [form, setForm] = useState({ sujet: '', contenu: '', destinataire_id: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setData(await get('/api/professeur/messages')); } catch {} }
  useEffect(() => { load(); }, []);

  const classes = data?.classes || [];

  async function loadDestinataires(classeId) {
    if (!classeId) { setDestinataires([]); return; }
    try {
      const res = await get(`/api/professeur/messages/destinataires/${classeId}?type=${recipType}`);
      setDestinataires(res.destinataires || []);
    } catch { setDestinataires([]); }
  }

  useEffect(() => { if (recipClasse) loadDestinataires(recipClasse); else setDestinataires([]); }, [recipClasse, recipType]);

  function openCompose() {
    setShowCompose(true);
    setRecipType('eleve');
    setRecipClasse('');
    setDestinataires([]);
    setForm({ sujet: '', contenu: '', destinataire_id: '' });
  }

  async function handleSend(e) {
    e.preventDefault();
    try {
      await post('/api/professeur/messages/send', form);
      setMsg({ type: 'success', text: 'Message envoyé !' });
      setShowCompose(false);
      load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  if (!data) return <div className="empty-state">Chargement...</div>;

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">
          Messagerie
          {data.nonLus > 0 && <span className="badge badge-danger" style={{ marginLeft: 10, fontSize: 12 }}>{data.nonLus} non lu(s)</span>}
        </h1>
        <button onClick={openCompose} className="btn btn-primary">
          <i className="fas fa-envelope" style={{ marginRight: 6 }} />Nouveau message
        </button>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}<button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button></div>}

      {showCompose && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">Nouveau message</span></div>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Type de destinataire</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" checked={recipType === 'eleve'} onChange={() => { setRecipType('eleve'); setRecipClasse(''); setDestinataires([]); setForm({...form, destinataire_id: ''}); }} />
                  Élève
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" checked={recipType === 'parent'} onChange={() => { setRecipType('parent'); setRecipClasse(''); setDestinataires([]); setForm({...form, destinataire_id: ''}); }} />
                  Parent
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Classe</label>
              <select value={recipClasse} onChange={e => { setRecipClasse(e.target.value); setForm({...form, destinataire_id: ''}); }} className="form-select">
                <option value="">Choisir une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destinataire</label>
              <select value={form.destinataire_id} onChange={e => setForm({...form, destinataire_id: e.target.value})} required className="form-select" disabled={!recipClasse}>
                <option value="">{destinataires.length > 0 ? `Choisir un ${recipType === 'eleve' ? 'élève' : 'parent'}` : (recipClasse ? 'Aucun destinataire' : 'Sélectionnez d\'abord une classe')}</option>
                {destinataires.map(d => <option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sujet</label>
              <input value={form.sujet} onChange={e => setForm({...form, sujet: e.target.value})} required className="form-input" placeholder="Objet du message" />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea value={form.contenu} onChange={e => setForm({...form, contenu: e.target.value})} required className="form-textarea" rows={4} placeholder="Écrivez votre message..." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Envoyer</button>
              <button type="button" onClick={() => setShowCompose(false)} className="btn btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {data.messages?.length === 0 ? (
          <div className="empty-state">Aucun message</div>
        ) : (data.messages || []).map(m => (
          <div key={m.id} onClick={() => setSelected(m)} style={{
            padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: '1px solid #f3f4f6',
            background: !m.lu ? '#f0f4ff' : '#fff',
            borderLeft: !m.lu ? '3px solid #2563eb' : '3px solid transparent',
            fontWeight: !m.lu ? 700 : 400,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = !m.lu ? '#f0f4ff' : '#fff'}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1e40af', flexShrink: 0 }}>
              {m.expediteur ? (m.expediteur.prenom?.charAt(0) || '?') : '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>
                {m.expediteur ? `${m.expediteur.prenom} ${m.expediteur.nom}` : 'Inconnu'}
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>{m.expediteur?.type || ''}</span>
              </div>
              <div style={{ fontSize: 14, marginTop: 1 }}>{m.sujet}</div>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
              {new Date(m.created_at || m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{selected.sujet}</h2>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              {selected.expediteur && `De : ${selected.expediteur.prenom} ${selected.expediteur.nom} (${selected.expediteur.type})`}
              {' | '}{new Date(selected.created_at || selected.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line', minHeight: 80 }}>
              {selected.contenu}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => setSelected(null)} className="btn btn-primary btn-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}