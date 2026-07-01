import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function EleveDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { get('/api/eleve/dashboard').then(setStats); }, []);

  if (!stats) return <div className="empty-state"><div className="empty-state-icon"><i className="fas fa-spinner fa-spin"></i></div>Chargement...</div>;

  const attendPct = Math.min(100, (stats.present || 0) * 10);
  const maxVal = Math.max(stats.notes, stats.devoirs, stats.nonLus, 1);

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Mon espace</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Bienvenue sur votre tableau de bord</span>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Notes enregistrées', value: stats.notes, icon: 'fa-star', color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Devoirs à faire', value: stats.devoirs, icon: 'fa-tasks', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Présences', value: `${stats.present || 0} séances`, icon: 'fa-check-circle', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Messages non lus', value: stats.nonLus, icon: 'fa-envelope', color: '#ef4444', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}><i className={`fas ${s.icon}`}></i></div>
            <div>
              <div className="stat-value">{typeof s.value === 'number' ? s.value : s.value || '\u2014'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Navigation rapide</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Voir mes notes', path: '/eleve/notes', icon: 'fa-star' },
              { label: 'Mes devoirs', path: '/eleve/devoirs', icon: 'fa-tasks' },
              { label: 'Emploi du temps', path: '/eleve/emploiDuTemps', icon: 'fa-calendar-alt' },
              { label: 'Messagerie', path: '/eleve/messages', icon: 'fa-envelope' },
              { label: 'Mes bulletins', path: '/eleve/bulletins', icon: 'fa-file-alt' },
            ].map(a => (
              <a key={a.path} href={a.path} className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: 13, padding: '10px 14px' }}>
                <i className={`fas ${a.icon}`} style={{ width: 20, textAlign: 'center' }}></i>
                {a.label}
                <span style={{ flex: 1 }} />
                <i className="fas fa-arrow-right" style={{ fontSize: 12, color: '#9ca3af' }}></i>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>Présence</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <div className="chart-donut">
              <div className="chart-donut-bg"></div>
              <div className="chart-donut-fill" style={{ background: `conic-gradient(#059669 ${attendPct}%, #e5e7eb ${attendPct}%)` }}></div>
              <div className="chart-donut-inner">
                <div className="chart-donut-value">{stats.present || 0}</div>
                <div className="chart-donut-label">présence</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><i className="fas fa-chart-bar" style={{ marginRight: 6 }}></i>Résumé</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            <div className="chart-bar-h">
              <div className="chart-bar-label"><i className="fas fa-star" style={{ marginRight: 6 }}></i>Notes</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(stats.notes / maxVal) * 100}%`, background: '#3b82f6' }}></div>
              </div>
              <div className="chart-bar-value">{stats.notes}</div>
            </div>
            <div className="chart-bar-h">
              <div className="chart-bar-label"><i className="fas fa-tasks" style={{ marginRight: 6 }}></i>Devoirs</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(stats.devoirs / maxVal) * 100}%`, background: '#10b981' }}></div>
              </div>
              <div className="chart-bar-value">{stats.devoirs}</div>
            </div>
            <div className="chart-bar-h">
              <div className="chart-bar-label"><i className="fas fa-envelope" style={{ marginRight: 6 }}></i>Non lus</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(stats.nonLus / maxVal) * 100}%`, background: '#ef4444' }}></div>
              </div>
              <div className="chart-bar-value">{stats.nonLus}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
