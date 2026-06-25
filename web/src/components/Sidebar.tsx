import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

function avatarColor(name: string): string {
  const palette = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899', '#14B8A6', '#6366F1', '#F59E0B'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return palette[h % palette.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const initials = user?.name ? getInitials(user.name) : 'TP';
  const avatarBg = user?.name ? avatarColor(user.name) : '#22C55E';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">
          {/* Zap / lightning icon for fitness energy */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        <span className="sidebar-brand">TrainPro</span>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-label">Menu</span>

        <Link
          to="/"
          className={`sidebar-link ${loc.pathname === '/' ? 'active' : ''}`}
        >
          {/* Grid / dashboard icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </Link>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: avatarBg }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">
              {user?.role === 'TRAINER' ? 'Personal Trainer' : 'Aluno'}
            </div>
          </div>
        </div>

        <button className="sidebar-logout" onClick={logout} title="Sair">
          {/* Log out icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
