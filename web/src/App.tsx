import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { LoginPage } from './pages/LoginPage';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { StudentDetail } from './pages/StudentDetail';
import { StudentHome } from './pages/StudentHome';
import { Sidebar } from './components/Sidebar';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        Carregando…
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="app-content">
          {user.role === 'TRAINER' ? (
            <Routes>
              <Route path="/" element={<TrainerDashboard />} />
              <Route path="/alunos/:id" element={<StudentDetail />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<StudentHome />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}
