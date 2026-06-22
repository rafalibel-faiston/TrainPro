import { useState } from 'react';
import { api } from '../api';
import type { Workout } from '../types';

interface EntryInput {
  exerciseName: string;
  weightKg: string;
  repsDone: string;
  done: boolean;
}

// Check-in: o aluno registra o que realmente fez no treino (cargas/reps).
export function CheckinForm({
  workout,
  onDone,
  onCancel,
}: {
  workout: Workout;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<EntryInput[]>(
    workout.exercises.map((ex) => ({
      exerciseName: ex.name,
      weightKg: ex.weightKg != null ? String(ex.weightKg) : '',
      repsDone: ex.reps,
      done: true,
    })),
  );

  function update(i: number, patch: Partial<EntryInput>) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/workouts/${workout.id}/logs`, {
        notes: notes || undefined,
        entries: entries.map((entry, order) => ({
          exerciseName: entry.exerciseName,
          repsDone: entry.repsDone || undefined,
          weightKg: entry.weightKg ? Number(entry.weightKg) : undefined,
          done: entry.done,
          order,
        })),
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ background: 'var(--accent-soft)', border: 'none' }}>
      <strong>Check-in · {workout.name}</strong>
      <p className="muted" style={{ marginTop: 4 }}>
        Marque o que fez e ajuste a carga/reps que você usou hoje.
      </p>
      {entries.map((entry, i) => (
        <div className="row" key={i} style={{ alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={entry.done}
            onChange={(ev) => update(i, { done: ev.target.checked })}
            style={{ width: 18, height: 18, marginBottom: 12 }}
          />
          <div style={{ flex: 3 }}>
            <label>Exercício</label>
            <input value={entry.exerciseName} readOnly />
          </div>
          <div style={{ flex: 1 }}>
            <label>Reps</label>
            <input value={entry.repsDone} onChange={(ev) => update(i, { repsDone: ev.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Carga (kg)</label>
            <input
              type="number"
              step="0.5"
              value={entry.weightKg}
              onChange={(ev) => update(i, { weightKg: ev.target.value })}
            />
          </div>
        </div>
      ))}
      <label>Como foi o treino? (opcional)</label>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Senti firme, subi a carga…" />
      <div className="row">
        <button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : 'Registrar check-in'}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
