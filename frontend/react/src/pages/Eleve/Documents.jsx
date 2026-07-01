import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function EleveDocuments() {
  const [docs, setDocs] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { get('/api/eleve/documents').then(d => setDocs(d.documents)); }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('fichier', file);
    try {
      await fetch('/api/eleve/documents/upload', { method: 'POST', credentials: 'include', body: formData });
      setMsg('Document uploadé !');
      const d = await get('/api/eleve/documents');
      setDocs(d.documents);
    } catch (err) { setMsg(err.message); }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  if (!docs) return <p>Chargement...</p>;

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Mes documents</h1>
        <label className="btn btn-primary">
          + Uploader
          <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {docs.length === 0 ? (
        <div className="empty-state">Aucun document</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td>{d.nom_original}</td>
                  <td>{d.type_mime}</td>
                  <td>{formatSize(d.taille)}</td>
                  <td>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
