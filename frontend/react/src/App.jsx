import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import RegisterParent from './pages/Auth/RegisterParent';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminClasses from './pages/Admin/Classes';
import AdminMatieres from './pages/Admin/Matieres';
import AdminDemandes from './pages/Admin/Demandes';
import AdminEvenements from './pages/Admin/Evenements';
import AdminEdt from './pages/Admin/EmploiDuTemps';
import ProfDashboard from './pages/Professeur/Dashboard';
import ProfNotes from './pages/Professeur/Notes';
import ProfDevoirs from './pages/Professeur/Devoirs';
import ProfPresences from './pages/Professeur/Presences';
import ProfEdt from './pages/Professeur/EmploiDuTemps';
import ProfMessages from './pages/Professeur/Messages';
import EleveDashboard from './pages/Eleve/Dashboard';
import EleveNotes from './pages/Eleve/Notes';
import EleveDevoirs from './pages/Eleve/Devoirs';
import ElevePresences from './pages/Eleve/Presences';
import EleveDocuments from './pages/Eleve/Documents';
import EleveEdt from './pages/Eleve/EmploiDuTemps';
import EleveMessages from './pages/Eleve/Messages';
import EleveBulletins from './pages/Eleve/Bulletins';
import ParentDashboard from './pages/Parent/Dashboard';
import ParentBulletins from './pages/Parent/Bulletins';
import ParentAbsences from './pages/Parent/Absences';
import ParentMessages from './pages/Parent/Messages';
import ParentEdt from './pages/Parent/EmploiDuTemps';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.type !== role) return <Navigate to={`/${user.type}/dashboard`} />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.type}/dashboard`} /> : <Login />} />
      <Route path="/register-parent" element={user ? <Navigate to={`/${user.type}/dashboard`} /> : <RegisterParent />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/utilisateurs" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute role="admin"><AdminClasses /></ProtectedRoute>} />
      <Route path="/admin/matieres" element={<ProtectedRoute role="admin"><AdminMatieres /></ProtectedRoute>} />
      <Route path="/admin/demandes" element={<ProtectedRoute role="admin"><AdminDemandes /></ProtectedRoute>} />
      <Route path="/admin/evenements" element={<ProtectedRoute role="admin"><AdminEvenements /></ProtectedRoute>} />
      <Route path="/admin/emploiDuTemps" element={<ProtectedRoute role="admin"><AdminEdt /></ProtectedRoute>} />
      <Route path="/professeur/dashboard" element={<ProtectedRoute role="professeur"><ProfDashboard /></ProtectedRoute>} />
      <Route path="/professeur/notes" element={<ProtectedRoute role="professeur"><ProfNotes /></ProtectedRoute>} />
      <Route path="/professeur/devoirs" element={<ProtectedRoute role="professeur"><ProfDevoirs /></ProtectedRoute>} />
      <Route path="/professeur/presences" element={<ProtectedRoute role="professeur"><ProfPresences /></ProtectedRoute>} />
      <Route path="/professeur/emploiDuTemps" element={<ProtectedRoute role="professeur"><ProfEdt /></ProtectedRoute>} />
      <Route path="/professeur/messages" element={<ProtectedRoute role="professeur"><ProfMessages /></ProtectedRoute>} />
      <Route path="/eleve/dashboard" element={<ProtectedRoute role="eleve"><EleveDashboard /></ProtectedRoute>} />
      <Route path="/eleve/notes" element={<ProtectedRoute role="eleve"><EleveNotes /></ProtectedRoute>} />
      <Route path="/eleve/devoirs" element={<ProtectedRoute role="eleve"><EleveDevoirs /></ProtectedRoute>} />
      <Route path="/eleve/presences" element={<ProtectedRoute role="eleve"><ElevePresences /></ProtectedRoute>} />
      <Route path="/eleve/documents" element={<ProtectedRoute role="eleve"><EleveDocuments /></ProtectedRoute>} />
      <Route path="/eleve/emploiDuTemps" element={<ProtectedRoute role="eleve"><EleveEdt /></ProtectedRoute>} />
      <Route path="/eleve/messages" element={<ProtectedRoute role="eleve"><EleveMessages /></ProtectedRoute>} />
      <Route path="/eleve/bulletins" element={<ProtectedRoute role="eleve"><EleveBulletins /></ProtectedRoute>} />
      <Route path="/parent/dashboard" element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/bulletins" element={<ProtectedRoute role="parent"><ParentBulletins /></ProtectedRoute>} />
      <Route path="/parent/absences" element={<ProtectedRoute role="parent"><ParentAbsences /></ProtectedRoute>} />
      <Route path="/parent/messages" element={<ProtectedRoute role="parent"><ParentMessages /></ProtectedRoute>} />
      <Route path="/parent/emploiDuTemps" element={<ProtectedRoute role="parent"><ParentEdt /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? `/${user.type}/dashboard` : '/login'} />} />
    </Routes>
  );
}
