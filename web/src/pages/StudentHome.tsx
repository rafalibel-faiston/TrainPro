import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import type { Appointment, DietPlan, Payment, ProgressEntry, Workout, WorkoutLog } from '../types';
import { CheckinForm } from '../components/CheckinForm';

export function StudentHome() {
  const { user, refresh } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [logs, setLogs] = useState<Record<string, WorkoutLog[]>>({});
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [form, setForm] = useState({ weightKg: '', notes: '' });
  const [checkinFor, setCheckinFor] = useState<string | null>(null);

  async function loadProgress() {
    setProgress(await api.get<ProgressEntry[]>('/progress'));
  }

  // Carrega o histórico de check-ins de cada treino.
  async function loadLogs(list: Workout[]) {
    const pairs = await Promise.all(
      list.map(async (w) => [w.id, await api.get<WorkoutLog[]>(`/workouts/${w.id}/logs`)] as const),
    );
    setLogs(Object.fromEntries(pairs));
  }

  async function loadAll() {
    const ws = await api.get<Workout[]>('/workouts');
    setWorkouts(ws);
    await loadLogs(ws);
    setDiets(await api.get<DietPlan[]>('/diets'));
    setAppointments(await api.get<Appointment[]>('/appointments'));
    setPayments(await api.get<Payment[]>('/payments'));
    await loadProgress();
  }

  useEffect(() => {
    loadAll().catch(() => {});
  }, []);

  async function addProgress(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/progress', {
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      notes: form.notes || undefined,
    });
    setForm({ weightKg: '', notes: '' });
    loadProgress();
  }

  return (
    <div>
      {!user?.trainer && <JoinTrainerCard onJoined={() => refresh().then(loadAll)} />}

      <h2>Meus treinos</h2>
      {workouts.map((w) => (
        <div className="card" key={w.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{w.name}</strong>
            {checkinFor !== w.id && (
              <button onClick={() => setCheckinFor(w.id)}>Fazer check-in</button>
            )}
          </div>
          {w.notes && <p className="muted">{w.notes}</p>}
          <table>
            <thead>
              <tr>
                <th>Exercício</th>
                <th>Séries</th>
                <th>Reps</th>
                <th>Carga prescrita</th>
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

          {checkinFor === w.id && (
            <div style={{ marginTop: 12 }}>
              <CheckinForm
                workout={w}
                onCancel={() => setCheckinFor(null)}
                onDone={() => {
                  setCheckinFor(null);
                  loadLogs(workouts);
                }}
              />
            </div>
          )}

          {(logs[w.id]?.length ?? 0) > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary className="muted" style={{ cursor: 'pointer' }}>
                {logs[w.id].length} check-in(s) registrado(s)
              </summary>
              {logs[w.id].map((log) => (
                <div key={log.id} style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(log.date).toLocaleString('pt-BR')}
                    {log.notes ? ` · ${log.notes}` : ''}
                  </div>
                  <div className="muted" style={{ fontSize: '0.9rem' }}>
                    {log.entries
                      .filter((e) => e.done)
                      .map((e) => `${e.exerciseName}: ${e.weightKg ?? '—'}kg × ${e.repsDone ?? '—'}`)
                      .join('  ·  ')}
                  </div>
                </div>
              ))}
            </details>
          )}
        </div>
      ))}
      {workouts.length === 0 && <p className="muted">Nenhum treino atribuído ainda.</p>}

      <h2>Minha dieta</h2>
      {diets.map((plan) => (
        <div className="card" key={plan.id}>
          <strong>{plan.name}</strong>
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
      {diets.length === 0 && <p className="muted">Nenhum plano alimentar ainda.</p>}

      <h2>Minha evolução</h2>
      <form className="card" onSubmit={addProgress}>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label>Notas</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit">Registrar</button>
        </div>
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Peso</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                <td>{p.weightKg ?? '—'}</td>
                <td className="muted">{p.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {progress.length === 0 && <p className="muted">Sem registros.</p>}
      </div>

      <h2>Próximas sessões</h2>
      <div className="card">
        {appointments.map((a) => (
          <div key={a.id} style={{ padding: '6px 0' }}>
            {new Date(a.startsAt).toLocaleString('pt-BR')} · <span className="badge">{a.status}</span>
          </div>
        ))}
        {appointments.length === 0 && <p className="muted">Nenhuma sessão agendada.</p>}
      </div>

      <h2>Pagamentos</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td>
                <td>R$ {p.amount.toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.status === 'PAID' ? 'paid' : ''}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="muted">Sem lançamentos.</p>}
      </div>
    </div>
  );
}

// Cartão para o aluno se vincular a um personal usando o código de convite.
function JoinTrainerCard({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/join', { inviteCode: code.trim() });
      onJoined();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível vincular.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={join} style={{ background: 'var(--accent-soft)', border: 'none' }}>
      <strong>Conecte-se ao seu personal</strong>
      <p className="muted" style={{ marginTop: 4 }}>
        Peça o código do seu personal e digite abaixo para receber treinos e dieta.
      </p>
      <div className="row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ex.: CARLOS"
          maxLength={12}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={busy || !code.trim()}>
          {busy ? 'Vinculando…' : 'Vincular'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
