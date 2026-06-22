import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { LoginPage } from './pages/LoginPage';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { StudentDetail } from './pages/StudentDetail';
import { StudentHome } from './pages/StudentHome';
import { Topbar } from './components/Topbar';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Carregando…</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <Topbar />
      <div className="container">
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
    </>
  );
}
