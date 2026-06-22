import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import type { Student } from '../types';

export function TrainerDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', goal: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [connectEmail, setConnectEmail] = useState('');
  const [showConnect, setShowConnect] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setStudents(await api.get<Student[]>('/students'));
  }

  useEffect(() => {
    load().catch(() => setError('Não foi possível carregar os alunos.'));
    api.get<{ code: string }>('/students/invite-code').then((r) => setInviteCode(r.code)).catch(() => {});
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard pode estar indisponível */
    }
  }

  async function connectStudent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/students/connect', { email: connectEmail });
      setConnectEmail('');
      setShowConnect(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao conectar aluno.');
    }
  }

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

  return (
    <div>
      <div className="card" style={{ background: 'var(--accent-soft)', border: 'none' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="muted" style={{ fontWeight: 600 }}>Seu código de convite</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.12em' }}>
              {inviteCode || '······'}
            </div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Compartilhe com o aluno: ele usa esse código ao se cadastrar para já entrar vinculado a você.
            </div>
          </div>
          <button className="ghost" onClick={copyCode} disabled={!inviteCode}>
            {copied ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Meus alunos</h2>
        <div className="row">
          <button className="ghost" onClick={() => setShowConnect((v) => !v)}>
            {showConnect ? 'Cancelar' : 'Conectar existente'}
          </button>
          <button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancelar' : '+ Novo aluno'}
          </button>
        </div>
      </div>

      {showConnect && (
        <form className="card" onSubmit={connectStudent}>
          <label>E-mail do aluno já cadastrado</label>
          <input
            type="email"
            value={connectEmail}
            onChange={(e) => setConnectEmail(e.target.value)}
            placeholder="aluno@email.com"
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Conectar aluno</button>
        </form>
      )}

      {showForm && (
        <form className="card" onSubmit={addStudent}>
          <label>Nome</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <label>E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <label>Senha de acesso</label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <label>Objetivo</label>
          <input
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="Ex.: emagrecimento, hipertrofia…"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Cadastrar aluno</button>
        </form>
      )}

      {error && !showForm && <p className="error">{error}</p>}

      <div className="grid">
        {students.map((s) => (
          <Link key={s.id} to={`/alunos/${s.id}`} className="card" style={{ display: 'block' }}>
            <strong>{s.name}</strong>
            <div className="muted">{s.email}</div>
            {s.goal && <div className="badge" style={{ marginTop: 8 }}>{s.goal}</div>}
          </Link>
        ))}
        {students.length === 0 && <p className="muted">Nenhum aluno cadastrado ainda.</p>}
      </div>
    </div>
  );
}
