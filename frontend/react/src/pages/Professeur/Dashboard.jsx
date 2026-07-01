import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function ProfDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { get('/api/professeur/dashboard').then(setStats); }, []);

  if (!stats) return <div className="empty-state"><div className="empty-state-icon"><i className="fas fa-spinner fa-pulse"></i></div>Chargement...</div>;

  const total = stats.classes + stats.matieres + stats.devoirs + stats.nonLus;
  const devoirPct = total > 0 ? Math.round((stats.devoirs / total) * 100) : 0;
  const maxVal = Math.max(stats.classes, stats.matieres, stats.devoirs, stats.nonLus);

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Tableau de bord</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Bienvenue dans votre espace enseignant</span>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Mes classes', value: stats.classes, icon: 'fas fa-school', color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Mes matières', value: stats.matieres, icon: 'fas fa-book', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Devoirs publiés', value: stats.devoirs, icon: 'fas fa-tasks', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Messages non lus', value: stats.nonLus, icon: 'fas fa-envelope', color: '#ef4444', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}><i className={s.icon}></i></div>
            <div>
              <div className="stat-value">{typeof s.value === 'number' ? s.value : s.value || '—'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Actions rapides</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Appel des présences', path: '/professeur/presences', icon: 'fas fa-check-circle', color: '#059669' },
              { label: 'Ajouter une note', path: '/professeur/notes', icon: 'fas fa-star', color: '#3b82f6' },
              { label: 'Publier un devoir', path: '/professeur/devoirs', icon: 'fas fa-tasks', color: '#d97706' },
              { label: 'Messagerie', path: '/professeur/messages', icon: 'fas fa-envelope', color: '#7c3aed' },
            ].map(a => (
              <a key={a.path} href={a.path} className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: 13, padding: '10px 14px' }}>
                <i className={a.icon} style={{ marginRight: 10, fontSize: 16 }}></i>
                {a.label}
                <span style={{ flex: 1 }} />
                <i className="fas fa-arrow-right" style={{ fontSize: 12, color: '#9ca3af' }}></i>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Activités</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
            <div className="chart-donut">
              <div className="chart-donut-bg"></div>
              <div className="chart-donut-fill" style={{ background: `conic-gradient(#10b981 ${devoirPct}%, #e5e7eb ${devoirPct}%)` }}></div>
              <div className="chart-donut-inner">
                <div className="chart-donut-value">{stats.devoirs}</div>
                <div className="chart-donut-label">Devoirs</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                Devoirs ({devoirPct}%)
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e7eb', display: 'inline-block', marginLeft: 8 }}></span>
                Autres ({100 - devoirPct}%)
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Résumé</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#374151', padding: '4px 0' }}>
            <div className="chart-bar-h">
              <div className="chart-bar-label">Classes</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${maxVal > 0 ? (stats.classes / maxVal) * 100 : 0}%`, background: '#3b82f6' }}></div>
              </div>
              <div className="chart-bar-value">{stats.classes}</div>
            </div>
            <div className="chart-bar-h">
              <div className="chart-bar-label">Matières</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${maxVal > 0 ? (stats.matieres / maxVal) * 100 : 0}%`, background: '#10b981' }}></div>
              </div>
              <div className="chart-bar-value">{stats.matieres}</div>
            </div>
            <div className="chart-bar-h">
              <div className="chart-bar-label">Devoirs</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${maxVal > 0 ? (stats.devoirs / maxVal) * 100 : 0}%`, background: '#f59e0b' }}></div>
              </div>
              <div className="chart-bar-value">{stats.devoirs}</div>
            </div>
            <div className="chart-bar-h">
              <div className="chart-bar-label">Non lus</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${maxVal > 0 ? (stats.nonLus / maxVal) * 100 : 0}%`, background: '#ef4444' }}></div>
              </div>
              <div className="chart-bar-value">{stats.nonLus}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
