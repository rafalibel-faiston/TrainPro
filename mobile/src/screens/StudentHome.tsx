import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import { addToCalendar } from '../calendar';
import type { Appointment, Payment, ProgressEntry, Workout, User } from '../types';
import { AppHeader, Badge, Button, Card, Chip, EmptyState, Field, Loading, Tabs } from '../ui';
import { COLORS, formatDate, formatDateTime, formatMoney, parseNum, paymentInfo } from '../theme';

type TabKey = 'treinos' | 'evolucao' | 'agenda' | 'pagamentos';

export function StudentHome({
  user,
  onLogout,
  onOpenWorkout,
}: {
  user: User;
  onLogout: () => void;
  onOpenWorkout: (w: Workout) => void;
}) {
  const [tab, setTab] = useState<TabKey>('treinos');
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // formulário de evolução (aluno pode registrar para si)
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');

  async function reload() {
    try {
      const [w, p, a, pay] = await Promise.all([
        api.get<Workout[]>('/workouts').catch(() => []),
        api.get<ProgressEntry[]>('/progress').catch(() => []),
        api.get<Appointment[]>('/appointments').catch(() => []),
        api.get<Payment[]>('/payments').catch(() => []),
      ]);
      setWorkouts(w);
      setProgress(p);
      setAppointments(a);
      setPayments(pay);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function addProgress() {
    setBusy(true);
    setErr('');
    try {
      await api.post('/progress', {
        weightKg: parseNum(weight),
        bodyFat: parseNum(fat),
        notes: notes.trim() || undefined,
      });
      setWeight('');
      setFat('');
      setNotes('');
      setShowForm(false);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <AppHeader
        title={`Olá, ${user.name.split(' ')[0]}`}
        subtitle="Aluno"
        right={
          <TouchableOpacity onPress={onLogout} style={st.logout} accessibilityLabel="Sair">
            <Feather name="log-out" size={18} color={COLORS.text2} />
          </TouchableOpacity>
        }
      />

      <LinearGradient
        colors={['rgba(110,139,255,0.22)', 'rgba(124,92,255,0.10)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.hero}
      >
        <View style={st.heroStat}>
          <Text style={st.heroValue}>{workouts.length}</Text>
          <Text style={st.heroLabel}>Treinos</Text>
        </View>
        <View style={st.div} />
        <View style={st.heroStat}>
          <Text style={st.heroValue}>{appointments.filter((a) => a.status === 'SCHEDULED').length}</Text>
          <Text style={st.heroLabel}>Sessões</Text>
        </View>
      </LinearGradient>

      <Tabs<TabKey>
        active={tab}
        onChange={(t) => {
          setTab(t);
          setShowForm(false);
          setErr('');
        }}
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
          {tab === 'evolucao' && (
            <View style={{ marginBottom: 14 }}>
              <Button
                title={showForm ? 'Cancelar' : 'Registrar evolução'}
                icon={showForm ? 'x' : 'plus'}
                variant={showForm ? 'ghost' : 'primary'}
                onPress={() => setShowForm((v) => !v)}
              />
            </View>
          )}

          {tab === 'evolucao' && showForm && (
            <Card>
              <Field label="Peso (kg)" placeholder="Ex.: 78.5" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
              <Field label="% de gordura (opcional)" placeholder="Ex.: 18" keyboardType="decimal-pad" value={fat} onChangeText={setFat} />
              <Field label="Notas (opcional)" placeholder="Observações" value={notes} onChangeText={setNotes} />
              <Button title="Salvar" loading={busy} full onPress={addProgress} />
            </Card>
          )}

          {tab === 'treinos' &&
            (workouts.length ? (
              workouts.map((w) => (
                <TouchableOpacity key={w.id} activeOpacity={0.85} onPress={() => onOpenWorkout(w)}>
                  <Card>
                    <View style={st.rowBetween}>
                      <Text style={st.itemTitle}>{w.name}</Text>
                      <View style={st.playPill}>
                        <Feather name="play" size={12} color={COLORS.accent} />
                        <Text style={st.playText}>Treinar</Text>
                      </View>
                    </View>
                    {w.notes ? <Text style={st.itemNote}>{w.notes}</Text> : null}
                    <View style={st.chips}>
                      {w.exercises.map((ex) => (
                        <Chip key={ex.id}>
                          {ex.name} · {ex.sets}x{ex.reps}
                        </Chip>
                      ))}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState icon="activity" text="Nenhum treino ainda." />
            ))}

          {tab === 'evolucao' &&
            (progress.length ? (
              progress.map((p) => (
                <Card key={p.id}>
                  <View style={st.rowBetween}>
                    <Text style={st.itemTitle}>{formatDate(p.date)}</Text>
                    <Text style={st.metricInline}>
                      {p.weightKg ? `${p.weightKg} kg` : ''}
                      {p.bodyFat != null ? `  ·  ${p.bodyFat}%` : ''}
                    </Text>
                  </View>
                  {p.notes ? <Text style={st.itemNote}>{p.notes}</Text> : null}
                </Card>
              ))
            ) : (
              <EmptyState icon="trending-up" text="Sem registros ainda." />
            ))}

          {tab === 'agenda' &&
            (appointments.length ? (
              appointments.map((a) => (
                <Card key={a.id}>
                  <View style={st.rowBetween}>
                    <Text style={st.itemTitle}>{formatDateTime(a.startsAt)}</Text>
                    <Badge tone={a.status === 'COMPLETED' ? 'success' : a.status === 'CANCELED' ? 'danger' : 'neutral'}>
                      {a.status === 'COMPLETED' ? 'Concluída' : a.status === 'CANCELED' ? 'Cancelada' : 'Agendada'}
                    </Badge>
                  </View>
                  {a.notes ? <Text style={st.itemNote}>{a.notes}</Text> : null}
                  {a.status === 'SCHEDULED' && (
                    <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                      <Button
                        title="Adicionar à agenda"
                        icon="calendar"
                        size="sm"
                        variant="ghost"
                        onPress={async () => {
                          try {
                            await addToCalendar('Sessão de treino — TrainPro', new Date(a.startsAt), new Date(a.endsAt), a.notes ?? undefined);
                            Alert.alert('Pronto!', 'Sessão adicionada à agenda do celular.');
                          } catch (e) {
                            Alert.alert('Ops', e instanceof Error ? e.message : 'Não foi possível adicionar.');
                          }
                        }}
                      />
                    </View>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState icon="calendar" text="Nenhuma sessão agendada." />
            ))}

          {tab === 'pagamentos' &&
            (payments.length ? (
              payments.map((p) => {
                const info = paymentInfo(p.status, p.dueDate);
                return (
                  <Card key={p.id}>
                    <View style={st.rowBetween}>
                      <Text style={st.itemTitle}>{formatMoney(p.amount)}</Text>
                      <Badge tone={info.tone}>{info.label}</Badge>
                    </View>
                    <Text style={st.itemNote}>Vence em {formatDate(p.dueDate)}</Text>
                  </Card>
                );
              })
            ) : (
              <EmptyState icon="credit-card" text="Nenhuma mensalidade." />
            ))}
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  logout: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  heroLabel: { color: COLORS.text2, fontSize: 12, marginTop: 2 },
  div: { width: 1, height: 34, backgroundColor: COLORS.border },

  itemTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  itemNote: { color: COLORS.text2, fontSize: 13, marginTop: 4 },
  metricInline: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  playText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },
});
