import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import type { Workout, WorkoutSession } from '../types';
import { AppHeader, Button, Card, EmptyState, Field, Loading, Tabs } from '../ui';
import { COLORS, formatDate, formatDuration, parseNum } from '../theme';

interface Row {
  weight: string;
  reps: string;
  done: boolean;
}

type Mode = 'treinar' | 'evolucao';

export function WorkoutPlayer({ workout, onBack }: { workout: Workout; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>('treinar');
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);

  // Cronômetro da sessão.
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Estado das séries por exercício, iniciado a partir do treino.
  const [logs, setLogs] = useState<Record<string, Row[]>>(() => {
    const init: Record<string, Row[]> = {};
    for (const ex of workout.exercises) {
      const n = Math.max(1, ex.sets || 1);
      init[ex.id] = Array.from({ length: n }, () => ({
        weight: ex.weightKg ? String(ex.weightKg) : '',
        reps: '',
        done: false,
      }));
    }
    return init;
  });

  function setRow(exId: string, i: number, key: keyof Row, val: string | boolean) {
    setLogs((prev) => ({
      ...prev,
      [exId]: prev[exId].map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    }));
  }

  function addSet(exId: string) {
    setLogs((prev) => ({ ...prev, [exId]: [...prev[exId], { weight: '', reps: '', done: false }] }));
  }

  function finish() {
    const sets: {
      exerciseName: string;
      setNumber: number;
      weightKg?: number;
      reps?: number;
      done: boolean;
      order: number;
    }[] = [];
    let order = 0;
    for (const ex of workout.exercises) {
      (logs[ex.id] || []).forEach((r, idx) => {
        const w = parseNum(r.weight);
        const reps = parseNum(r.reps);
        // Só registra séries marcadas como feitas ou com algum dado preenchido.
        if (r.done || w !== undefined || reps !== undefined) {
          sets.push({
            exerciseName: ex.name,
            setNumber: idx + 1,
            weightKg: w,
            reps: reps !== undefined ? Math.round(reps) : undefined,
            done: r.done,
            order: order++,
          });
        }
      });
    }

    if (!sets.length) {
      Alert.alert('Nada para salvar', 'Marque ao menos uma série antes de concluir.');
      return;
    }

    Alert.alert('Concluir treino', `Salvar ${sets.length} série(s) em ${formatDuration(seconds)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salvar',
        onPress: async () => {
          setSaving(true);
          try {
            await api.post('/workout-sessions', { workoutId: workout.id, durationSec: seconds, sets });
            Alert.alert('Treino registrado!', 'Sua sessão foi salva e sincronizada com o personal.', [
              { text: 'OK', onPress: onBack },
            ]);
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader
        title={workout.name}
        subtitle={mode === 'treinar' ? formatDuration(seconds) + ' em treino' : 'Evolução de cargas'}
        onBack={onBack}
        right={
          mode === 'treinar' ? (
            <View style={st.timer}>
              <Feather name="clock" size={14} color={COLORS.accent} />
              <Text style={st.timerText}>{formatDuration(seconds)}</Text>
            </View>
          ) : undefined
        }
      />

      <Tabs<Mode>
        active={mode}
        onChange={setMode}
        items={[
          { key: 'treinar', label: 'Treinar' },
          { key: 'evolucao', label: 'Evolução' },
        ]}
      />

      {mode === 'treinar' ? (
        <>
          {workout.exercises.length === 0 ? (
            <EmptyState icon="activity" text="Este treino não tem exercícios." />
          ) : (
            workout.exercises.map((ex) => (
              <Card key={ex.id}>
                <Text style={st.exName}>{ex.name}</Text>
                <Text style={st.exMeta}>
                  Alvo: {ex.sets}x{ex.reps}
                  {ex.weightKg ? ` · ${ex.weightKg}kg` : ''}
                </Text>

                <View style={st.head}>
                  <Text style={[st.h, { width: 34 }]}>Sér.</Text>
                  <Text style={[st.h, { flex: 1 }]}>Carga (kg)</Text>
                  <Text style={[st.h, { flex: 1 }]}>Reps</Text>
                  <Text style={[st.h, { width: 38, textAlign: 'center' }]}>Feito</Text>
                </View>

                {(logs[ex.id] || []).map((r, i) => (
                  <View key={i} style={st.setRow}>
                    <Text style={st.setNum}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Field
                        placeholder="—"
                        keyboardType="decimal-pad"
                        value={r.weight}
                        onChangeText={(t) => setRow(ex.id, i, 'weight', t)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        placeholder={ex.reps}
                        keyboardType="numeric"
                        value={r.reps}
                        onChangeText={(t) => setRow(ex.id, i, 'reps', t)}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setRow(ex.id, i, 'done', !r.done)}
                      style={[st.check, r.done && st.checkOn]}
                      accessibilityLabel="Marcar série"
                    >
                      {r.done ? <Feather name="check" size={16} color="#fff" /> : null}
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                  <Button title="Série" icon="plus" size="sm" variant="ghost" onPress={() => addSet(ex.id)} />
                </View>
              </Card>
            ))
          )}

          {workout.exercises.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Button title="Concluir treino" icon="check-circle" loading={saving} full onPress={finish} />
            </View>
          )}
        </>
      ) : (
        <Evolution workoutId={workout.id} />
      )}
    </ScrollView>
  );
}

/* Evolução de cargas: maior carga por sessão, por exercício. */
function Evolution({ workoutId }: { workoutId: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<WorkoutSession[]>('/workout-sessions')
      .then((all) => setSessions(all.filter((s) => s.workoutId === workoutId)))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [workoutId]);

  if (loading) return <Loading />;
  if (!sessions.length) {
    return <EmptyState icon="bar-chart-2" text="Conclua um treino para ver sua evolução aqui." />;
  }

  // Ordem cronológica (a API devolve desc).
  const ordered = [...sessions].reverse();

  // Exercícios que têm carga registrada em alguma sessão.
  const exNames = Array.from(
    new Set(ordered.flatMap((s) => s.sets.map((x) => x.exerciseName))),
  );

  return (
    <>
      <Card>
        <Text style={st.exName}>Resumo</Text>
        <Text style={st.exMeta}>
          {sessions.length} sessão(ões) registrada(s) · última em {formatDate(ordered[ordered.length - 1].startedAt)}
        </Text>
      </Card>

      {exNames.map((name) => {
        const series = ordered.map((s) => {
          const weights = s.sets.filter((x) => x.exerciseName === name && x.weightKg != null).map((x) => x.weightKg as number);
          return weights.length ? Math.max(...weights) : 0;
        });
        if (series.every((v) => v === 0)) return null;
        return (
          <Card key={name}>
            <Text style={st.exName}>{name}</Text>
            <Text style={st.exMeta}>Maior carga por sessão (kg)</Text>
            <MiniBars values={series} />
          </Card>
        );
      })}
    </>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <View style={st.chart}>
      {values.map((v, i) => (
        <View key={i} style={st.barCol}>
          <Text style={st.barVal}>{v || ''}</Text>
          <View style={[st.bar, { height: Math.max(4, (v / max) * 70) }]} />
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accentSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  timerText: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },

  exName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  exMeta: { color: COLORS.text2, fontSize: 12, marginTop: 3, marginBottom: 10 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  h: { color: COLORS.text3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setNum: { width: 34, color: COLORS.text2, fontWeight: '700', fontSize: 14 },
  check: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: COLORS.accentDeep, borderColor: COLORS.accentDeep },

  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 96, marginTop: 10 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  barVal: { color: COLORS.text2, fontSize: 10 },
  bar: { width: '70%', borderRadius: 6, backgroundColor: COLORS.accentDeep },
});
