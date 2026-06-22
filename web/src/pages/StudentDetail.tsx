import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { Appointment, DietPlan, Payment, ProgressEntry, Workout, WorkoutLog } from '../types';
import { WorkoutForm } from '../components/WorkoutForm';
import { DietForm } from '../components/DietForm';

interface StudentFull {
  id: string;
  goal?: string | null;
  user: { name: string; email: string };
  workouts: Workout[];
  progress: ProgressEntry[];
  appointments: Appointment[];
  payments: Payment[];
  workoutLogs: WorkoutLog[];
  dietPlans: DietPlan[];
}

type Tab = 'treinos' | 'checkins' | 'dieta' | 'evolucao' | 'agenda' | 'pagamentos';
const TAB_LABELS: Record<Tab, string> = {
  treinos: 'Treinos',
  checkins: 'Check-ins',
  dieta: 'Dieta',
  evolucao: 'Evolução',
  agenda: 'Agenda',
  pagamentos: 'Pagamentos',
};

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentFull | null>(null);
  const [tab, setTab] = useState<Tab>('treinos');

  async function load() {
    setStudent(await api.get<StudentFull>(`/students/${id}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!student) return <p className="muted">Carregando…</p>;

  return (
    <div>
      <Link to="/" className="muted">
        ← Voltar
      </Link>
      <h2 style={{ marginBottom: 4 }}>{student.user.name}</h2>
      <p className="muted">
        {student.user.email}
        {student.goal ? ` · ${student.goal}` : ''}
      </p>

      <div className="tabs">
        {(['treinos', 'checkins', 'dieta', 'evolucao', 'agenda', 'pagamentos'] as const).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'treinos' && (
        <>
          <WorkoutForm studentId={student.id} onCreated={load} />
          {student.workouts.map((w) => (
            <div className="card" key={w.id}>
              <strong>{w.name}</strong>
              {w.notes && <p className="muted">{w.notes}</p>}
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
                      <td>{ex.name}</td>
                      <td>{ex.sets}</td>
                      <td>{ex.reps}</td>
                      <td>{ex.weightKg ? `${ex.weightKg} kg` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {student.workouts.length === 0 && <p className="muted">Nenhum treino ainda.</p>}
        </>
      )}

      {tab === 'checkins' && <CheckinsTab logs={student.workoutLogs} />}
      {tab === 'dieta' && (
        <DietTab studentId={student.id} plans={student.dietPlans} onChange={load} />
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
    </div>
  );
}

function CheckinsTab({ logs }: { logs: WorkoutLog[] }) {
  if (logs.length === 0) {
    return <p className="muted">O aluno ainda não registrou nenhum check-in.</p>;
  }
  return (
    <>
      {logs.map((log) => (
        <div className="card" key={log.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{log.workout?.name ?? 'Treino'}</strong>
            <span className="muted">{new Date(log.date).toLocaleString('pt-BR')}</span>
          </div>
          {log.notes && <p className="muted">{log.notes}</p>}
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
              {log.entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.done ? e.exerciseName : <s className="muted">{e.exerciseName}</s>}</td>
                  <td>{e.setsDone ?? '—'}</td>
                  <td>{e.repsDone ?? '—'}</td>
                  <td>{e.weightKg != null ? `${e.weightKg} kg` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

function DietTab({
  studentId,
  plans,
  onChange,
}: {
  studentId: string;
  plans: DietPlan[];
  onChange: () => void;
}) {
  async function remove(id: string) {
    await api.del(`/diets/${id}`);
    onChange();
  }

  return (
    <>
      <DietForm studentId={studentId} onCreated={onChange} />
      {plans.map((plan) => (
        <div className="card" key={plan.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{plan.name}</strong>
            <button className="ghost" onClick={() => remove(plan.id)}>
              Remover
            </button>
          </div>
          {plan.notes && <p className="muted">{plan.notes}</p>}
          {plan.meals.map((m) => (
            <div key={m.id} style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <strong>
                {m.time ? `${m.time} · ` : ''}
                {m.name}
              </strong>
              <div className="muted">{m.description}</div>
            </div>
          ))}
        </div>
      ))}
      {plans.length === 0 && <p className="muted">Nenhum plano alimentar ainda.</p>}
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
      <form className="card" onSubmit={add}>
        <div className="grid">
          <div>
            <label>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            />
          </div>
          <div>
            <label>% Gordura</label>
            <input
              type="number"
              step="0.1"
              value={form.bodyFat}
              onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
            />
          </div>
        </div>
        <label>Observações</label>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Registrar evolução</button>
      </form>
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
                <td>{p.weightKg ?? '—'}</td>
                <td>{p.bodyFat ?? '—'}</td>
                <td className="muted">{p.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="muted">Sem registros.</p>}
      </div>
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

  return (
    <>
      <form className="card" onSubmit={add}>
        <label>Data</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <div className="grid">
          <div>
            <label>Início</label>
            <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <label>Fim</label>
            <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
        </div>
        <button type="submit">Agendar sessão</button>
      </form>
      <div className="card">
        {items.map((a) => (
          <div key={a.id} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
            <strong>{new Date(a.startsAt).toLocaleString('pt-BR')}</strong>{' '}
            <span className="badge">{a.status}</span>
            {a.notes && <div className="muted">{a.notes}</div>}
          </div>
        ))}
        {items.length === 0 && <p className="muted">Nenhuma sessão agendada.</p>}
      </div>
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

  return (
    <>
      <form className="card" onSubmit={add}>
        <div className="grid">
          <div>
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
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
        <button type="submit">Lançar mensalidade</button>
      </form>
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
            {items.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td>
                <td>R$ {p.amount.toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.status === 'PAID' ? 'paid' : ''}`}>{p.status}</span>
                </td>
                <td>
                  {p.status !== 'PAID' && (
                    <button className="ghost" onClick={() => markPaid(p.id)}>
                      Dar baixa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="muted">Sem lançamentos.</p>}
      </div>
    </>
  );
}
