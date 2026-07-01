import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      navigate(data.redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f1f5e 0%, #1e3a8a 50%, #3b82f6 100%)', fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/images/logo.svg" alt="SmartSchool" style={{ width: 60, height: 60, marginBottom: 12 }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}><i className="fas fa-school" style={{ marginRight: 8 }}></i>SmartSchool</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Connectez-vous à votre espace</p>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><i className="fas fa-exclamation-triangle"></i>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><i className="fas fa-envelope" style={{ marginRight: 6 }}></i>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="form-input" placeholder="exemple@smartschool.tg" />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label"><i className="fas fa-lock" style={{ marginRight: 6 }}></i>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="form-input" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i>Connexion...</> : <><i className="fas fa-sign-in-alt"></i>Se connecter</>}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/register-parent" style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <i className="fas fa-user-plus"></i> Créer un compte parent
          </a>
        </div>
        <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#6b7280' }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Comptes de démonstration :</p>
          <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-user-shield" style={{ color: '#1e3a8a' }}></i><strong>Admin</strong> : admin@smartschool.tg / Admin123!</div>
          <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-chalkboard-teacher" style={{ color: '#1e3a8a' }}></i><strong>Professeur</strong> : prof.koffi@smartschool.tg / Prof123!</div>
          <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-user-graduate" style={{ color: '#1e3a8a' }}></i><strong>Élève</strong> : eleve.amede@smartschool.tg / Eleve123!</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-user-friends" style={{ color: '#1e3a8a' }}></i><strong>Parent</strong> : parent.amede@smartschool.tg / Parent123!</div>
        </div>
      </div>
    </div>
  );
}
