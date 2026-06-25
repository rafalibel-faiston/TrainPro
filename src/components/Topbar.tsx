import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export function Topbar() {
  const { user, logout } = useAuth();
  return (
    <div className="topbar">
      <Link to="/" className="brand">
        TrainPro
      </Link>
      <div className="row" style={{ alignItems: 'center' }}>
        <span className="muted">
          {user?.name} · {user?.role === 'TRAINER' ? 'Personal' : 'Aluno'}
        </span>
        <button className="ghost" onClick={logout}>
          Sair
        </button>
      </div>
    </div>
  );
}
