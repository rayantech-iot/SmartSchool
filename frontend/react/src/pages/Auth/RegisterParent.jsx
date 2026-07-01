import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../../api/client';

export default function RegisterParent() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', matricule: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await post('/api/auth/register-parent', form);
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f1f5e 0%, #1e3a8a 50%, #3b82f6 100%)', fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 460, boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/images/logo.svg" alt="SmartSchool" style={{ width: 56, height: 56, marginBottom: 10 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}>Inscription parent</h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>Créez un compte pour suivre la scolarité de votre enfant</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><i className="fas fa-exclamation-triangle"></i> {error}</div>}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <i className="fas fa-check-circle"></i> {success}
            <div style={{ marginTop: 12 }}>
              <Link to="/login" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 600 }}>Se connecter</Link>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className="form-input" placeholder="Votre prénom" />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="form-input" placeholder="Votre nom" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" placeholder="exemple@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input type="password" required value={form.motDePasse} onChange={e => setForm({...form, motDePasse: e.target.value})} className="form-input" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optionnel)</span></label>
              <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className="form-input" placeholder="+228 90 00 00 00" />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1e3a8a' }}>
                <i className="fas fa-user-graduate"></i> Matricule de votre enfant
              </label>
              <input required value={form.matricule} onChange={e => setForm({...form, matricule: e.target.value})} className="form-input" placeholder="Ex: STU-001" style={{ borderColor: '#3b82f6', borderWidth: 2 }} />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Le matricule se trouve sur le carnet scolaire de votre enfant</div>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Inscription en cours...</> : <><i className="fas fa-user-plus"></i> Créer mon compte</>}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          <span style={{ color: '#6b7280' }}>Déjà un compte ?</span>{' '}
          <Link to="/login" style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
        </div>
      </div>
    </div>
  );
}