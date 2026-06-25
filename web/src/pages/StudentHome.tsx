import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Appointment, Payment, ProgressEntry, Workout } from '../types';
import { Button } from '@/components/ui/heroui-button';

export function StudentHome() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [form, setForm] = useState({ weightKg: '', notes: '' });

  async function loadProgress() {
    setProgress(await api.get<ProgressEntry[]>('/progress'));
  }

  useEffect(() => {
    api.get<Workout[]>('/workouts').then(setWorkouts);
    api.get<Appointment[]>('/appointments').then(setAppointments);
    api.get<Payment[]>('/payments').then(setPayments);
    loadProgress();
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
      <h2>Meus treinos</h2>
      {workouts.map((w) => (
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
      {workouts.length === 0 && <p className="muted">Nenhum treino atribuído ainda.</p>}

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
          <Button type="submit" variant="primary">Registrar</Button>
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
