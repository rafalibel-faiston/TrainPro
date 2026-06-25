import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { Appointment, Payment, ProgressEntry, Workout } from '../types';
import { WorkoutForm } from '../components/WorkoutForm';

interface StudentFull {
  id: string;
  goal?: string | null;
  user: { name: string; email: string };
  workouts: Workout[];
  progress: ProgressEntry[];
  appointments: Appointment[];
  payments: Payment[];
}

function avatarColor(name: string): string {
  const palette = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899', '#14B8A6', '#6366F1', '#F59E0B'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return palette[h % palette.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const TABS = [
  { key: 'treinos', label: 'Treinos' },
  { key: 'evolucao', label: 'Evolução' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'pagamentos', label: 'Pagamentos' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentFull | null>(null);
  const [tab, setTab] = useState<TabKey>('treinos');

  async function load() {
    setStudent(await api.get<StudentFull>(`/students/${id}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!student) {
    return <div className="loading-state">Carregando…</div>;
  }

  const color = avatarColor(student.user.name);

  return (
    <>
      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Voltar ao Dashboard
      </Link>

      <div className="detail-header">
        <div className="detail-avatar" style={{ background: color }}>
          {getInitials(student.user.name)}
        </div>
        <div>
          <h1 className="detail-title">{student.user.name}</h1>
          <div className="detail-meta">
            <span>{student.user.email}</span>
            {student.goal && (
              <>
                <span style={{ color: 'var(--text-3)' }}>·</span>
                <span
                  style={{
                    background: 'var(--accent-muted)',
                    color: 'var(--accent)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 9px',
                    borderRadius: '999px',
                  }}
                >
                  {student.goal}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'treinos' && (
        <WorkoutsTab workouts={student.workouts} studentId={student.id} onCreated={load} />
      )}
      {tab === 'evolucao' && (
        <ProgressTab studentId={student.id} entries={student.progress} onChange={load} />
      )}
      {tab === 'agenda' && (
        <AppointmentsTab studentId={student.id} items={student.appointments} onChange={load} />
      )}
      {tab === 'pagamentos' && (
        <PaymentsTab studentId={student.id} items={student.payments} onChange={load} />
      )}
    </>
  );
}

function WorkoutsTab({
  workouts,
  studentId,
  onCreated,
}: {
  workouts: Workout[];
  studentId: string;
  onCreated: () => void;
}) {
  return (
    <>
      <WorkoutForm studentId={studentId} onCreated={onCreated} />
      {workouts.length === 0 && (
        <div className="empty-state">Nenhum treino cadastrado ainda.</div>
      )}
      {workouts.map((w) => (
        <div className="workout-card" key={w.id}>
          <div className="workout-card-header">
            <div>
              <div className="workout-card-name">{w.name}</div>
              <div className="workout-card-meta">
                {new Date(w.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                {' · '}
                {w.exercises.length} exercício{w.exercises.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {w.notes && <div className="workout-card-notes">{w.notes}</div>}
          <table>
            <thead>
              <tr>
                <th>Exercício</th>
                <th>Séries</th>
                <th>Reps</th>
                <th>Carga</th>
              </tr>
            </thead>
            <tbody>
              {w.exercises.map((ex) => (
                <tr key={ex.id}>
                  <td style={{ fontWeight: 500 }}>{ex.name}</td>
                  <td>{ex.sets}</td>
                  <td>{ex.reps}</td>
                  <td>{ex.weightKg ? `${ex.weightKg} kg` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

function ProgressTab({
  studentId,
  entries,
  onChange,
}: {
  studentId: string;
  entries: ProgressEntry[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ weightKg: '', bodyFat: '', notes: '' });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/progress', {
      studentId,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
      notes: form.notes || undefined,
    });
    setForm({ weightKg: '', bodyFat: '', notes: '' });
    onChange();
  }

  return (
    <>
      <form className="card" onSubmit={add} style={{ marginBottom: 14 }}>
        <div className="section-header">
          <span className="section-title">Registrar evolução</span>
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div>
            <label>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="75.5"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            />
          </div>
          <div>
            <label>% Gordura</label>
            <input
              type="number"
              step="0.1"
              placeholder="18.0"
              value={form.bodyFat}
              onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Observações</label>
          <input
            placeholder="Notas sobre a avaliação…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="form-actions">
          <button type="submit">Registrar</button>
        </div>
      </form>

      {entries.length === 0 ? (
        <div className="empty-state">Nenhum registro de evolução ainda.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Peso</th>
                <th>% Gordura</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                  <td>{p.weightKg != null ? `${p.weightKg} kg` : '—'}</td>
                  <td>{p.bodyFat != null ? `${p.bodyFat}%` : '—'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{p.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AppointmentsTab({
  studentId,
  items,
  onChange,
}: {
  studentId: string;
  items: Appointment[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ date: '', start: '08:00', end: '09:00', notes: '' });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    await api.post('/appointments', {
      studentId,
      startsAt: new Date(`${form.date}T${form.start}`).toISOString(),
      endsAt: new Date(`${form.date}T${form.end}`).toISOString(),
      notes: form.notes || undefined,
    });
    setForm({ date: '', start: '08:00', end: '09:00', notes: '' });
    onChange();
  }

  const statusLabel = (s: Appointment['status']) => ({
    SCHEDULED: { label: 'Agendado', cls: 'badge blue' },
    COMPLETED: { label: 'Realizado', cls: 'badge green' },
    CANCELED:  { label: 'Cancelado', cls: 'badge red' },
  })[s] ?? { label: s, cls: 'badge' };

  return (
    <>
      <form className="card" onSubmit={add} style={{ marginBottom: 14 }}>
        <div className="section-header">
          <span className="section-title">Agendar sessão</span>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Data</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div>
            <label>Início</label>
            <input
              type="time"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
          </div>
          <div>
            <label>Fim</label>
            <input
              type="time"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit">Agendar</button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="empty-state">Nenhuma sessão agendada.</div>
      ) : (
        <div className="card">
          {items.map((a) => (
            <div className="appointment-item" key={a.id}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>
                  {new Date(a.startsAt).toLocaleString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {a.notes && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{a.notes}</div>
                )}
              </div>
              <span className={statusLabel(a.status).cls}>{statusLabel(a.status).label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PaymentsTab({
  studentId,
  items,
  onChange,
}: {
  studentId: string;
  items: Payment[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ amount: '', dueDate: '' });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/payments', {
      studentId,
      amount: Number(form.amount),
      dueDate: new Date(form.dueDate).toISOString(),
    });
    setForm({ amount: '', dueDate: '' });
    onChange();
  }

  async function markPaid(id: string) {
    await api.post(`/payments/${id}/pay`, {});
    onChange();
  }

  const statusInfo = (s: Payment['status']) => ({
    PAID:    { label: 'Pago',    cls: 'badge green' },
    PENDING: { label: 'Pendente', cls: 'badge yellow' },
    OVERDUE: { label: 'Vencido', cls: 'badge red' },
  })[s] ?? { label: s, cls: 'badge' };

  return (
    <>
      <form className="card" onSubmit={add} style={{ marginBottom: 14 }}>
        <div className="section-header">
          <span className="section-title">Lançar mensalidade</span>
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div>
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="200.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Vencimento</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit">Lançar</button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="empty-state">Nenhum lançamento ainda.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const info = statusInfo(p.status);
                return (
                  <tr key={p.id}>
                    <td>{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td>
                    <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      R$ {p.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={info.cls}>{info.label}</span>
                    </td>
                    <td>
                      {p.status !== 'PAID' && (
                        <button className="ghost sm" onClick={() => markPaid(p.id)}>
                          Dar baixa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
