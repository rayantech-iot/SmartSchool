import { useState, useEffect } from 'react';
import { get } from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { get('/api/admin/dashboard').then(setStats); }, []);

  if (!stats) return <div className="empty-state"><div className="empty-state-icon"><i className="fas fa-spinner fa-spin"></i></div>Chargement...</div>;

  const total = stats.eleves + stats.professeurs + stats.parents;
  const pctEleves = total ? Math.round((stats.eleves / total) * 100) : 0;
  const pctProf = total ? Math.round((stats.professeurs / total) * 100) : 0;
  const pctParents = total ? Math.round((stats.parents / total) * 100) : 0;

  const statCards = [
    { label: 'Élèves', value: stats.eleves, icon: 'fa-user-graduate', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Professeurs', value: stats.professeurs, icon: 'fa-chalkboard-teacher', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Parents', value: stats.parents, icon: 'fa-user-friends', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Classes', value: stats.classes, icon: 'fa-school', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Matières', value: stats.matieres, icon: 'fa-book', color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Demandes', value: stats.demandes, icon: 'fa-clipboard-list', color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div>
      <div className="page-header-bar">
        <h1 className="page-title">Tableau de bord</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Vue d'ensemble de l'établissement</span>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}><i className={`fas ${s.icon}`}></i></div>
            <div>
              <div className="stat-value">{s.value}</div>
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
              { label: 'Gérer les utilisateurs', path: '/admin/utilisateurs', icon: 'fa-users-cog', color: '#3b82f6' },
              { label: 'Gérer les classes', path: '/admin/classes', icon: 'fa-school', color: '#10b981' },
              { label: 'Gérer les matières', path: '/admin/matieres', icon: 'fa-book', color: '#f59e0b' },
              { label: 'Demandes en attente', path: '/admin/demandes', icon: 'fa-clipboard-list', color: '#ef4444' },
            ].map(a => (
              <a key={a.path} href={a.path} className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: 13, padding: '10px 14px' }}>
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}><i className={`fas ${a.icon}`}></i></span>
                {a.label}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}><i className="fas fa-arrow-right"></i></span>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Répartition des utilisateurs</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0' }}>
            <div className="chart-donut" style={{ width: 110, height: 110 }}>
              <div className="chart-donut-bg"></div>
              <div className="chart-donut-fill" style={{ background: `conic-gradient(#3b82f6 0% ${pctEleves}%, #10b981 ${pctEleves}% ${pctEleves + pctProf}%, #f59e0b ${pctEleves + pctProf}% 100%)` }}></div>
              <div className="chart-donut-inner" style={{ width: 70, height: 70 }}>
                <div className="chart-donut-value">{total}</div>
                <div className="chart-donut-label">total</div>
              </div>
            </div>
            <div style={{ textAlign: 'left', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }}></div>
                <span style={{ color: '#6b7280' }}>Élèves</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{stats.eleves} ({pctEleves}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }}></div>
                <span style={{ color: '#6b7280' }}>Professeurs</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{stats.professeurs} ({pctProf}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }}></div>
                <span style={{ color: '#6b7280' }}>Parents</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{stats.parents} ({pctParents}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Activité récente</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { text: 'Nouvelle demande de liaison', time: 'Il y a 2h', dot: '#f59e0b' },
              { text: "Modification d'emploi du temps", time: 'Il y a 5h', dot: '#3b82f6' },
              { text: 'Création de compte professeur', time: 'Hier', dot: '#10b981' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#374151' }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}