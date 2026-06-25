import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import type { Student } from '../types';

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

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Meus alunos</h2>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Novo aluno'}
        </button>
      </div>

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
