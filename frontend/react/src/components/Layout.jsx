import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { get, post } from '../api/client';

const navItems = {
  admin: [
    { label: 'Tableau de bord', path: '/admin/dashboard', icon: 'chart-bar' },
    { label: 'Utilisateurs', path: '/admin/utilisateurs', icon: 'users' },
    { label: 'Demandes', path: '/admin/demandes', icon: 'clipboard-list' },
    { label: 'Classes', path: '/admin/classes', icon: 'school' },
    { label: 'Matières', path: '/admin/matieres', icon: 'book' },
    { label: 'Emploi du temps', path: '/admin/emploiDuTemps', icon: 'calendar-alt' },
    { label: 'Événements', path: '/admin/evenements', icon: 'scroll' },
  ],
  professeur: [
    { label: 'Tableau de bord', path: '/professeur/dashboard', icon: 'chart-bar' },
    { label: 'Notes', path: '/professeur/notes', icon: 'star' },
    { label: 'Présences', path: '/professeur/presences', icon: 'check-circle' },
    { label: 'Devoirs', path: '/professeur/devoirs', icon: 'tasks' },
    { label: 'Emploi du temps', path: '/professeur/emploiDuTemps', icon: 'calendar-alt' },
    { label: 'Messages', path: '/professeur/messages', icon: 'envelope' },
  ],
  eleve: [
    { label: 'Mon espace', path: '/eleve/dashboard', icon: 'home' },
    { label: 'Mes notes', path: '/eleve/notes', icon: 'star' },
    { label: 'Devoirs', path: '/eleve/devoirs', icon: 'tasks' },
    { label: 'Présences', path: '/eleve/presences', icon: 'check-circle' },
    { label: 'Documents', path: '/eleve/documents', icon: 'folder' },
    { label: 'Emploi du temps', path: '/eleve/emploiDuTemps', icon: 'calendar-alt' },
    { label: 'Messages', path: '/eleve/messages', icon: 'envelope' },
    { label: 'Bulletins', path: '/eleve/bulletins', icon: 'file-alt' },
  ],
  parent: [
    { label: 'Tableau de bord', path: '/parent/dashboard', icon: 'chart-bar' },
    { label: 'Bulletins', path: '/parent/bulletins', icon: 'file-alt' },
    { label: 'Absences', path: '/parent/absences', icon: 'exclamation-triangle' },
    { label: 'Messages', path: '/parent/messages', icon: 'envelope' },
    { label: 'Emploi du temps', path: '/parent/emploiDuTemps', icon: 'calendar-alt' },
  ],
};

const roleLabels = { admin: 'Administrateur', professeur: 'Professeur', eleve: 'Élève', parent: 'Parent' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enfants, setEnfants] = useState([]);
  const [enfantActif, setEnfantActif] = useState(null);
  const items = user ? navItems[user.type] || [] : [];

  useEffect(() => {
    if (user && user.type === 'parent') {
      get('/api/parent/enfants').then(d => {
        setEnfants(d.enfants || []);
        setEnfantActif(d.actif || null);
      }).catch(() => {});
    }
  }, [user]);

  async function switchEnfant(eleveId) {
    try {
      await post(`/api/parent/switch-enfant/${eleveId}`, {});
      setEnfantActif(eleveId);
      window.location.reload();
    } catch {}
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <aside style={{
        width: sidebarOpen ? 260 : 0, transition: 'width 0.2s', overflow: 'hidden',
        background: 'linear-gradient(180deg, #0f1f5e 0%, #1e3a8a 100%)', color: '#fff',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/logo.svg" alt="SmartSchool" style={{ width: 40, height: 40, filter: 'brightness(0) invert(1)' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>SmartSchool</div>
              <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 500 }}>Système de gestion scolaire</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {items.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 8, fontSize: 13, fontWeight: isActive ? 700 : 500,
                textDecoration: 'none', marginBottom: 2,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!isActive) e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.target.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>
                  <i className={"fas fa-" + item.icon}></i>
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: (user?.type === 'parent' && enfants.length > 0) ? 8 : 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
              {(user?.prenom?.[0] || '?').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.prenom} {user?.nom}</div>
              <div style={{ fontSize: 10, opacity: 0.5 }}>{roleLabels[user?.type]}</div>
            </div>
          </div>
          {user?.type === 'parent' && enfants.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, marginBottom: 4 }}>Enfant actif</div>
              <select value={enfantActif || ''} onChange={e => switchEnfant(parseInt(e.target.value))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: 'none', fontSize: 12, background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                {enfants.map(e => (
                  <option key={e.eleve_id} value={e.eleve_id} style={{ color: '#000', background: '#fff' }}>
                    {e.prenom} {e.nom} ({e.classe_nom || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}>
            Déconnexion
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: sidebarOpen ? 260 : 0, flex: 1, transition: 'margin-left 0.2s', minWidth: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky',
          top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {location.pathname.split('/').slice(1).map((s, i) => (
              <span key={i}>{i > 0 && <span style={{ margin: '0 6px', color: '#d1d5db' }}>/</span>}
                <span style={{ textTransform: 'capitalize' }}>{s.replace(/([A-Z])/g, ' $1').trim()}</span>
              </span>
            ))}
          </div>
          <div style={{ flex: 1 }} />
        </header>

        <main style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div className="fade-in">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
