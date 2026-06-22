import { useState } from 'react';
import { api } from '../api';

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
      <button onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>
        + Novo treino
      </button>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <label>Nome do treino</label>
      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Treino A" />
      <label>Observações</label>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} />

      <h4>Exercícios</h4>
      {exercises.map((ex, i) => (
        <div className="row" key={i}>
          <div style={{ flex: 2 }}>
            <label>Exercício</label>
            <input value={ex.name} onChange={(e) => updateExercise(i, { name: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Séries</label>
            <input
              type="number"
              value={ex.sets}
              onChange={(e) => updateExercise(i, { sets: Number(e.target.value) })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Reps</label>
            <input value={ex.reps} onChange={(e) => updateExercise(i, { reps: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Carga</label>
            <input
              type="number"
              value={ex.weightKg}
              onChange={(e) => updateExercise(i, { weightKg: e.target.value })}
            />
          </div>
        </div>
      ))}
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => setExercises((prev) => [...prev, { ...emptyExercise }])}
        >
          + Exercício
        </button>
        <button type="submit">Salvar treino</button>
        <button type="button" className="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
