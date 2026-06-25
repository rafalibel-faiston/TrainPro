import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import type { Student } from '../types';
import { Button } from '@/components/ui/heroui-button';

function avatarColor(name: string): string {
  const palette = ['#52525B', '#5B7186', '#5F7A6B', '#7A6E8C', '#8A6E5E', '#566B7A', '#6E6E8A', '#7A6A6A'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return palette[h % palette.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function TrainerDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', goal: '' });
  const [error, setError] = useState('');

  async function load() {
    setStudents(await api.get<Student[]>('/students'));
  }

  useEffect(() => {
    load().catch(() => setError('Não foi possível carregar os alunos.'));
  }, []);

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/students', form);
      setForm({ name: '', email: '', password: '', goal: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao cadastrar aluno.');
    }
  }

  const withGoal = students.filter((s) => s.goal).length;
  const withoutGoal = students.length - withGoal;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Gerencie seus alunos e acompanhe o progresso</p>
        </div>
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm((v) => !v)}>
          {showForm ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Cancelar
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo aluno
            </>
          )}
        </Button>
      </div>

      {/* Metric cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-card-icon green">
            {/* Users icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div className="metric-value">{students.length}</div>
          <div className="metric-label">Total de alunos</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon blue">
            {/* Target / goal icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div className="metric-value">{withGoal}</div>
          <div className="metric-label">Com objetivo definido</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon orange">
            {/* Alert / attention icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="metric-value">{withoutGoal}</div>
          <div className="metric-label">Sem objetivo cadastrado</div>
        </div>
      </div>

      {/* Add student form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <span className="section-title">Cadastrar novo aluno</span>
          </div>
          <form onSubmit={addStudent}>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div>
                <label>Nome completo</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Rafael Lima"
                  required
                />
              </div>
              <div>
                <label>E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="rafael@email.com"
                  required
                />
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div>
                <label>Senha de acesso</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Senha provisória"
                  required
                />
              </div>
              <div>
                <label>Objetivo</label>
                <input
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  placeholder="Ex.: emagrecimento, hipertrofia…"
                />
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">Cadastrar aluno</Button>
            </div>
          </form>
        </div>
      )}

      {error && !showForm && <p className="error">{error}</p>}

      {/* Students list */}
      <div className="section-header">
        <span className="section-title">Alunos</span>
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
        </span>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-3)', marginBottom: 12 }}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <p>Nenhum aluno cadastrado ainda.</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 4 }}>
            Clique em "Novo aluno" para começar.
          </p>
        </div>
      ) : (
        <div className="student-grid">
          {students.map((s) => (
            <Link key={s.id} to={`/alunos/${s.id}`} className="student-card">
              <div className="student-card-top">
                <div
                  className="student-avatar"
                  style={{ background: avatarColor(s.name) }}
                >
                  {getInitials(s.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="student-name">{s.name}</div>
                  <div className="student-email">{s.email}</div>
                </div>
              </div>
              <div className="student-divider" />
              <div className="student-footer">
                {s.goal ? (
                  <span className="student-goal">{s.goal}</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Sem objetivo</span>
                )}
                <span className="student-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
