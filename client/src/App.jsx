import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import AppShell from './components/AppShell';
import CountrysideBackground from './components/CountrysideBackground';
import { Spinner } from './components/ui';
import Login from './pages/Login';

import Dashboard from './pages/officer/Dashboard';
import ReviewUpdates from './pages/officer/ReviewUpdates';
import ProjectDetails from './pages/officer/ProjectDetails';
import Issues from './pages/officer/Issues';
import Supervisors from './pages/officer/Supervisors';

import MyProject from './pages/supervisor/MyProject';
import SendUpdate from './pages/supervisor/SendUpdate';
import MyUpdates from './pages/supervisor/MyUpdates';
import MaterialsIssues from './pages/supervisor/MaterialsIssues';

// Signed-in users see the shell; each role gets its own pages.
function Protected() {
  const { user, loading } = useAuth();
  if (loading) {
    return <><CountrysideBackground /><div className="relative z-10 pt-24"><Spinner /></div></>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

// Home page and the other routes depend on the role.
function RoleRoutes() {
  const { user } = useAuth();
  return user.role === 'officer' ? <OfficerRoutes /> : <SupervisorRoutes />;
}

function OfficerRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="review" element={<ReviewUpdates />} />
      <Route path="projects/:id" element={<ProjectDetails />} />
      <Route path="issues" element={<Issues />} />
      <Route path="supervisors" element={<Supervisors />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SupervisorRoutes() {
  return (
    <Routes>
      <Route index element={<MyProject />} />
      <Route path="send" element={<SendUpdate />} />
      <Route path="updates" element={<MyUpdates />} />
      <Route path="materials" element={<MaterialsIssues />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/*" element={<RoleRoutes />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
