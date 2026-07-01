import { useState, useEffect } from 'react';
import { get, post } from '../../api/client';

export default function ParentMessages() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [destinataires, setDestinataires] = useState([]);
  const [form, setForm] = useState({ sujet: '', contenu: '', destinataire_id: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() { try { setData(await get('/api/parent/messages')); } catch {} }
  useEffect(() => { load(); }, []);

  async function openCompose() {
    try { setDestinataires((await get('/api/destinataires')).destinataires); } catch {}
    setShowCompose(true);
  }

  async function handleSend(e) {
    e.preventDefault();
    try {
      await post('/api/messages/send', form);
      setMsg({ type: 'success', text: 'Message envoyé !' });
      setShowCompose(false); setForm({ sujet: '', contenu: '', destinataire_id: '' }); load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  }

  async function readMessage(id) {
    try { const res = await fetch(`/api/messages/${id}`, { credentials: 'include' }); if (res.ok) setSelected(await res.json()); }
    catch {}
  }

  if (!data) return <div className="empty-state">Chargement...</div>;

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">
          Messagerie
          {data.nonLus > 0 && <span className="badge badge-danger" style={{ marginLeft: 10, fontSize: 12 }}>{data.nonLus} non lu(s)</span>}
        </h1>
        <button onClick={openCompose} className="btn btn-primary"><i className="fas fa-envelope"></i> Nouveau message</button>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{msg.text}<button className="alert-close" onClick={() => setMsg({ type: '', text: '' })}>×</button></div>}

      {showCompose && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card-title" style={{ marginBottom: 16 }}>Nouveau message</h2>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Destinataire</label>
              <select value={form.destinataire_id} onChange={e => setForm({...form, destinataire_id: e.target.value})} required className="form-select">
                <option value="">Choisir un destinataire</option>
                {destinataires.map(d => <option key={d.id} value={d.id}>{d.prenom} {d.nom} ({d.type})</option>)}
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
          <div className="empty-state"><i className="fas fa-inbox"></i> Aucun message</div>
        ) : (data.messages || []).map(m => (
          <div key={m.id} onClick={() => readMessage(m.id)} style={{
            padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: '1px solid #f3f4f6',
            background: !m.lu ? '#f0f4ff' : '#fff',
            borderLeft: !m.lu ? '3px solid #2563eb' : '3px solid transparent',
            fontWeight: !m.lu ? 700 : 400,
          }}
            onMouseEnter={e => e.target.style.background = '#f8fafc'}
            onMouseLeave={e => e.target.style.background = !m.lu ? '#f0f4ff' : '#fff'}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1e40af', flexShrink: 0 }}>
              {m.prenom?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>{m.prenom} {m.nom}</div>
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
            <h2>{selected.sujet}</h2>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              De : {selected.prenom} {selected.nom} | {new Date(selected.created_at || selected.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line', minHeight: 80 }}>
              {selected.contenu}
            </div>
            <button onClick={() => setSelected(null)} className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
