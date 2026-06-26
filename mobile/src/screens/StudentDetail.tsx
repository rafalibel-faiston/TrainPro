import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import type { Appointment, Payment, ProgressEntry, Workout } from '../types';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Loading,
  Tabs,
} from '../ui';
import { COLORS, formatDate, formatDateTime, formatMoney, parseNum, paymentInfo } from '../theme';

interface FullStudent {
  id: string;
  goal?: string | null;
  user: { name: string; email: string; phone?: string | null };
  workouts: Workout[];
  progress: ProgressEntry[];
  appointments: Appointment[];
  payments: Payment[];
}

type TabKey = 'treinos' | 'evolucao' | 'agenda' | 'pagamentos';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function StudentDetail({
  studentId,
  studentName,
  onBack,
}: {
  studentId: string;
  studentName: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<FullStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('treinos');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function reload() {
    try {
      const d = await api.get<FullStudent>(`/students/${studentId}`);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [studentId]);

  function switchTab(t: TabKey) {
    setTab(t);
    setShowForm(false);
    setErr('');
  }

  async function submit(run: () => Promise<void>) {
    setBusy(true);
    setErr('');
    try {
      await run();
      await reload();
      setShowForm(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <AppHeader title={studentName} subtitle={data?.goal || data?.user.email} onBack={onBack} />

      <Tabs<TabKey>
        active={tab}
        onChange={switchTab}
        items={[
          { key: 'treinos', label: 'Treinos' },
          { key: 'evolucao', label: 'Evolução' },
          { key: 'agenda', label: 'Agenda' },
          { key: 'pagamentos', label: 'Mensalidades' },
        ]}
      />

      {err ? <Text style={{ color: COLORS.danger, marginBottom: 10 }}>{err}</Text> : null}

      {loading ? (
        <Loading />
      ) : (
        <>
          <View style={{ marginBottom: 14 }}>
            <Button
              title={showForm ? 'Cancelar' : addLabel(tab)}
              icon={showForm ? 'x' : 'plus'}
              variant={showForm ? 'ghost' : 'primary'}
              onPress={() => setShowForm((v) => !v)}
            />
          </View>

          {showForm && tab === 'treinos' && <WorkoutForm studentId={studentId} busy={busy} onSubmit={submit} />}
          {showForm && tab === 'evolucao' && <ProgressForm studentId={studentId} busy={busy} onSubmit={submit} />}
          {showForm && tab === 'agenda' && <AppointmentForm studentId={studentId} busy={busy} onSubmit={submit} />}
          {showForm && tab === 'pagamentos' && <PaymentForm studentId={studentId} busy={busy} onSubmit={submit} />}

          {tab === 'treinos' && <WorkoutList workouts={data?.workouts ?? []} />}
          {tab === 'evolucao' && <ProgressList entries={data?.progress ?? []} />}
          {tab === 'agenda' && <AppointmentList items={data?.appointments ?? []} />}
          {tab === 'pagamentos' && (
            <PaymentList items={data?.payments ?? []} onPay={(id) => submit(() => api.post(`/payments/${id}/pay`))} />
          )}
        </>
      )}
    </ScrollView>
  );
}

function addLabel(tab: TabKey) {
  return {
    treinos: 'Novo treino',
    evolucao: 'Registrar evolução',
    agenda: 'Agendar sessão',
    pagamentos: 'Lançar mensalidade',
  }[tab];
}

/* ─────────────────────────── Listas ─────────────────────────── */

function WorkoutList({ workouts }: { workouts: Workout[] }) {
  if (!workouts.length) return <EmptyState icon="activity" text="Nenhum treino ainda." />;
  return (
    <>
      {workouts.map((w) => (
        <Card key={w.id}>
          <Text style={st.itemTitle}>{w.name}</Text>
          {w.notes ? <Text style={st.itemNote}>{w.notes}</Text> : null}
          <View style={st.chips}>
            {w.exercises.map((ex) => (
              <Chip key={ex.id}>
                {ex.name} · {ex.sets}x{ex.reps}
                {ex.weightKg ? ` · ${ex.weightKg}kg` : ''}
              </Chip>
            ))}
          </View>
        </Card>
      ))}
    </>
  );
}

function ProgressList({ entries }: { entries: ProgressEntry[] }) {
  if (!entries.length) return <EmptyState icon="trending-up" text="Sem registros de evolução." />;
  return (
    <>
      {entries.map((p) => (
        <Card key={p.id}>
          <View style={st.rowBetween}>
            <Text style={st.itemTitle}>{formatDate(p.date)}</Text>
            <Text style={st.metricInline}>
              {p.weightKg ? `${p.weightKg} kg` : ''}
              {p.bodyFat != null ? `  ·  ${p.bodyFat}% gordura` : ''}
            </Text>
          </View>
          {p.notes ? <Text style={st.itemNote}>{p.notes}</Text> : null}
        </Card>
      ))}
    </>
  );
}

function AppointmentList({ items }: { items: Appointment[] }) {
  if (!items.length) return <EmptyState icon="calendar" text="Nenhuma sessão agendada." />;
  const tone = (s: string) => (s === 'COMPLETED' ? 'success' : s === 'CANCELED' ? 'danger' : 'neutral');
  const label = (s: string) => (s === 'COMPLETED' ? 'Concluída' : s === 'CANCELED' ? 'Cancelada' : 'Agendada');
  return (
    <>
      {items.map((a) => (
        <Card key={a.id}>
          <View style={st.rowBetween}>
            <Text style={st.itemTitle}>{formatDateTime(a.startsAt)}</Text>
            <Badge tone={tone(a.status)}>{label(a.status)}</Badge>
          </View>
          {a.notes ? <Text style={st.itemNote}>{a.notes}</Text> : null}
        </Card>
      ))}
    </>
  );
}

function PaymentList({ items, onPay }: { items: Payment[]; onPay: (id: string) => void }) {
  if (!items.length) return <EmptyState icon="credit-card" text="Nenhuma mensalidade." />;
  return (
    <>
      {items.map((p) => {
        const info = paymentInfo(p.status, p.dueDate);
        return (
          <Card key={p.id}>
            <View style={st.rowBetween}>
              <Text style={st.itemTitle}>{formatMoney(p.amount)}</Text>
              <Badge tone={info.tone}>{info.label}</Badge>
            </View>
            <Text style={st.itemNote}>Vence em {formatDate(p.dueDate)}</Text>
            {p.status !== 'PAID' && (
              <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                <Button title="Dar baixa" icon="check" size="sm" variant="ghost" onPress={() => onPay(p.id)} />
              </View>
            )}
          </Card>
        );
      })}
    </>
  );
}

/* ─────────────────────────── Formulários ─────────────────────────── */

type SubmitFn = (run: () => Promise<void>) => void;

function WorkoutForm({ studentId, busy, onSubmit }: { studentId: string; busy: boolean; onSubmit: SubmitFn }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exs, setExs] = useState([{ name: '', sets: '3', reps: '12' }]);

  function setEx(i: number, key: 'name' | 'sets' | 'reps', val: string) {
    setExs((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));
  }

  return (
    <Card>
      <Field label="Nome do treino" placeholder="Ex.: Treino A — Peito" value={name} onChangeText={setName} />
      <Field label="Observações (opcional)" placeholder="Notas" value={notes} onChangeText={setNotes} />
      <Text style={st.subLabel}>Exercícios</Text>
      {exs.map((ex, i) => (
        <View key={i} style={st.exRow}>
          <View style={{ flex: 1 }}>
            <Field placeholder="Exercício" value={ex.name} onChangeText={(t) => setEx(i, 'name', t)} />
          </View>
          <View style={{ width: 56 }}>
            <Field placeholder="Sér." keyboardType="numeric" value={ex.sets} onChangeText={(t) => setEx(i, 'sets', t)} />
          </View>
          <View style={{ width: 64 }}>
            <Field placeholder="Reps" value={ex.reps} onChangeText={(t) => setEx(i, 'reps', t)} />
          </View>
        </View>
      ))}
      <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
        <Button
          title="Exercício"
          icon="plus"
          size="sm"
          variant="ghost"
          onPress={() => setExs((p) => [...p, { name: '', sets: '3', reps: '12' }])}
        />
      </View>
      <Button
        title="Salvar treino"
        loading={busy}
        full
        onPress={() =>
          onSubmit(async () => {
            await api.post('/workouts', {
              studentId,
              name: name.trim(),
              notes: notes.trim() || undefined,
              exercises: exs
                .filter((e) => e.name.trim())
                .map((e, order) => ({ name: e.name.trim(), sets: Number(e.sets) || 1, reps: e.reps.trim() || '12', order })),
            });
          })
        }
      />
    </Card>
  );
}

function ProgressForm({ studentId, busy, onSubmit }: { studentId: string; busy: boolean; onSubmit: SubmitFn }) {
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Card>
      <Field label="Peso (kg)" placeholder="Ex.: 78.5" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
      <Field label="% de gordura (opcional)" placeholder="Ex.: 18" keyboardType="decimal-pad" value={fat} onChangeText={setFat} />
      <Field label="Notas (opcional)" placeholder="Observações" value={notes} onChangeText={setNotes} />
      <Button
        title="Salvar evolução"
        loading={busy}
        full
        onPress={() =>
          onSubmit(async () => {
            await api.post('/progress', {
              studentId,
              weightKg: parseNum(weight),
              bodyFat: parseNum(fat),
              notes: notes.trim() || undefined,
            });
          })
        }
      />
    </Card>
  );
}

function AppointmentForm({ studentId, busy, onSubmit }: { studentId: string; busy: boolean; onSubmit: SubmitFn }) {
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  return (
    <Card>
      <Field label="Data (AAAA-MM-DD)" placeholder="2026-06-26" value={date} onChangeText={setDate} />
      <Field label="Hora (HH:MM)" placeholder="08:00" value={time} onChangeText={setTime} />
      <Field label="Duração (min)" placeholder="60" keyboardType="numeric" value={duration} onChangeText={setDuration} />
      <Field label="Notas (opcional)" placeholder="Observações" value={notes} onChangeText={setNotes} />
      <Button
        title="Agendar"
        loading={busy}
        full
        onPress={() =>
          onSubmit(async () => {
            const start = new Date(`${date}T${time}:00`);
            if (isNaN(start.getTime())) throw new Error('Data/hora inválida.');
            const end = new Date(start.getTime() + (Number(duration) || 60) * 60000);
            await api.post('/appointments', {
              studentId,
              startsAt: start.toISOString(),
              endsAt: end.toISOString(),
              notes: notes.trim() || undefined,
            });
          })
        }
      />
    </Card>
  );
}

function PaymentForm({ studentId, busy, onSubmit }: { studentId: string; busy: boolean; onSubmit: SubmitFn }) {
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState(todayStr());
  const [notes, setNotes] = useState('');
  return (
    <Card>
      <Field label="Valor (R$)" placeholder="Ex.: 150" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <Field label="Vencimento (AAAA-MM-DD)" placeholder="2026-07-05" value={due} onChangeText={setDue} />
      <Field label="Notas (opcional)" placeholder="Observações" value={notes} onChangeText={setNotes} />
      <Button
        title="Lançar mensalidade"
        loading={busy}
        full
        onPress={() =>
          onSubmit(async () => {
            const d = new Date(`${due}T12:00:00`);
            if (isNaN(d.getTime())) throw new Error('Data inválida.');
            const value = parseNum(amount);
            if (value === undefined || value <= 0) throw new Error('Informe um valor válido.');
            await api.post('/payments', {
              studentId,
              amount: value,
              dueDate: d.toISOString(),
              notes: notes.trim() || undefined,
            });
          })
        }
      />
    </Card>
  );
}

import { StyleSheet } from 'react-native';
const st = StyleSheet.create({
  itemTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  itemNote: { color: COLORS.text2, fontSize: 13, marginTop: 4 },
  metricInline: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  subLabel: { color: COLORS.text2, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  exRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
});
