import { useState, useEffect } from 'react';
import { get, post } from '../api/client';

export default function Messagerie() {
  const [messages, setMessages] = useState([]);
  const [nonLus, setNonLus] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [sujet, setSujet] = useState('');
  const [contenu, setContenu] = useState('');
  const [destinataireId, setDestinataireId] = useState('');

  useEffect(() => {
    get('/messages').then(data => {
      setMessages(data.messages);
      setNonLus(data.nonLus);
    });
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    await post('/messages/send', { sujet, contenu, destinataire_id: parseInt(destinataireId) });
    setSujet('');
    setContenu('');
    setShowCompose(false);
    const data = await get('/messages');
    setMessages(data.messages);
    setNonLus(data.nonLus);
  }

  async function handleRead(id) {
    try {
      const res = await fetch(`/professeur/messages/${id}`);
      if (res.ok) setSelected(await res.json());
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Messagerie</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Boîte de réception</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setShowCompose(true)}
          style={{ padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          ✏️ Nouveau message
        </button>
        <button onClick={() => setShowCompose(false)}
          style={{ padding: '10px 20px', background: showCompose ? '#e5e7eb' : '#1d4ed8', color: showCompose ? '#333' : '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          📥 Boîte réception {nonLus > 0 && `(${nonLus})`}
        </button>
      </div>

      {showCompose ? (
        <form onSubmit={handleSend} style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Rédiger un message</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Sujet</label>
            <input value={sujet} onChange={e => setSujet(e.target.value)} required
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Message</label>
            <textarea value={contenu} onChange={e => setContenu(e.target.value)} required rows={5}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
          </div>
          <button type="submit"
            style={{ padding: '10px 20px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Envoyer
          </button>
        </form>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#999', fontWeight: 600 }}>
            Messages reçus ({messages.length})
          </div>
          {messages.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📬</p>
              <p style={{ fontStyle: 'italic' }}>Aucun message</p>
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} onClick={() => handleRead(m.id)}
                style={{
                  padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid #f3f4f6',
                  ...(!m.lu ? { background: '#eff6ff', borderLeft: '4px solid #3b82f6', fontWeight: 700 } : {})
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0
                }}>
                  {m.expediteur ? m.expediteur.nom.charAt(0) : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.expediteur ? `${m.expediteur.prenom} ${m.expediteur.nom}` : 'Inconnu'}
                    <span style={{ fontSize: 10, color: '#999', marginLeft: 8, textTransform: 'capitalize' }}>
                      {m.expediteur ? m.expediteur.type : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 13 }}>{m.sujet}</div>
                </div>
                <div style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>
                  {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16
        }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%', padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{selected.sujet}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
              De : {selected.expediteur ? `${selected.expediteur.prenom} ${selected.expediteur.nom}` : 'Inconnu'}
              {' | '}{new Date(selected.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line', minHeight: 80 }}>
              {selected.contenu}
            </div>
            <button onClick={() => setSelected(null)}
              style={{ marginTop: 16, padding: '8px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
