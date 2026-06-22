import { useState } from 'react';
import { api } from '../api';

interface MealInput {
  name: string;
  time: string;
  description: string;
}

const emptyMeal: MealInput = { name: '', time: '', description: '' };

export function DietForm({
  studentId,
  onCreated,
}: {
  studentId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [meals, setMeals] = useState<MealInput[]>([{ ...emptyMeal }]);

  function updateMeal(i: number, patch: Partial<MealInput>) {
    setMeals((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/diets', {
      studentId,
      name,
      notes: notes || undefined,
      meals: meals
        .filter((m) => m.name.trim() && m.description.trim())
        .map((m, order) => ({
          name: m.name,
          time: m.time || undefined,
          description: m.description,
          order,
        })),
    });
    setName('');
    setNotes('');
    setMeals([{ ...emptyMeal }]);
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>
        + Novo plano alimentar
      </button>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <label>Nome do plano</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ex.: Plano de emagrecimento"
      />
      <label>Observações</label>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} />

      <h4>Refeições</h4>
      {meals.map((m, i) => (
        <div className="row" key={i}>
          <div style={{ flex: 1 }}>
            <label>Horário</label>
            <input type="time" value={m.time} onChange={(e) => updateMeal(i, { time: e.target.value })} />
          </div>
          <div style={{ flex: 2 }}>
            <label>Refeição</label>
            <input
              value={m.name}
              onChange={(e) => updateMeal(i, { name: e.target.value })}
              placeholder="Café da manhã"
            />
          </div>
          <div style={{ flex: 4 }}>
            <label>Alimentos</label>
            <input
              value={m.description}
              onChange={(e) => updateMeal(i, { description: e.target.value })}
              placeholder="2 ovos, 1 fatia de pão integral…"
            />
          </div>
        </div>
      ))}
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => setMeals((prev) => [...prev, { ...emptyMeal }])}
        >
          + Refeição
        </button>
        <button type="submit">Salvar plano</button>
        <button type="button" className="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
