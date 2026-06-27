import { useState } from 'react';
import { api } from '../api';
import { Button } from '@/components/ui/heroui-button';

interface ExerciseInput {
  name: string;
  sets: number;
  reps: string;
  weightKg: string;
}

const emptyExercise: ExerciseInput = { name: '', sets: 3, reps: '12', weightKg: '' };

export function WorkoutForm({
  studentId,
  onCreated,
}: {
  studentId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([{ ...emptyExercise }]);

  function updateExercise(i: number, patch: Partial<ExerciseInput>) {
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)));
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/workouts', {
      studentId,
      name,
      notes: notes || undefined,
      exercises: exercises
        .filter((ex) => ex.name.trim())
        .map((ex, order) => ({
          name: ex.name,
          sets: Number(ex.sets),
          reps: ex.reps,
          weightKg: ex.weightKg ? Number(ex.weightKg) : undefined,
          order,
        })),
    });
    setName('');
    setNotes('');
    setExercises([{ ...emptyExercise }]);
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo treino
        </Button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
      <div className="section-header">
        <span className="section-title">Novo treino</span>
      </div>

      <div className="form-row" style={{ marginBottom: 14 }}>
        <div>
          <label>Nome do treino</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex.: Treino A – Peito e Tríceps"
          />
        </div>
        <div>
          <label>Observações</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instruções gerais…"
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 60px 80px 80px 36px',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <label style={{ margin: 0 }}>Exercício</label>
          <label style={{ margin: 0 }}>Séries</label>
          <label style={{ margin: 0 }}>Reps</label>
          <label style={{ margin: 0 }}>Carga (kg)</label>
          <span />
        </div>

        {exercises.map((ex, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 60px 80px 80px 36px',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <input
              value={ex.name}
              onChange={(e) => updateExercise(i, { name: e.target.value })}
              placeholder="Ex.: Supino reto"
            />
            <input
              type="number"
              min={1}
              value={ex.sets}
              onChange={(e) => updateExercise(i, { sets: Number(e.target.value) })}
            />
            <input
              value={ex.reps}
              onChange={(e) => updateExercise(i, { reps: e.target.value })}
              placeholder="12"
            />
            <input
              type="number"
              step="0.5"
              value={ex.weightKg}
              onChange={(e) => updateExercise(i, { weightKg: e.target.value })}
              placeholder="—"
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => removeExercise(i)}
              disabled={exercises.length === 1}
              title="Remover"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions" style={{ justifyContent: 'space-between' }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExercises((prev) => [...prev, { ...emptyExercise }])}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Exercício
        </Button>
        <div className="row">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">Salvar treino</Button>
        </div>
      </div>
    </form>
  );
}
