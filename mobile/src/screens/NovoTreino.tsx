import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import type { Student } from '../types';
import { Avatar, Button, Card, Field, PageTitle } from '../ui';
import { COLORS } from '../theme';

interface ExRow {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

export function NovoTreino() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exs, setExs] = useState<ExRow[]>([{ name: '', sets: '4', reps: '8', rest: '90' }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get<Student[]>('/students').then(setStudents).catch(() => {});
  }, []);

  function setEx(i: number, key: keyof ExRow, val: string) {
    setExs((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));
  }
  function addEx() {
    setExs((prev) => [...prev, { name: '', sets: '3', reps: '12', rest: '60' }]);
  }
  function removeEx(i: number) {
    setExs((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function send() {
    setErr('');
    if (!selected) return setErr('Selecione um aluno.');
    const valid = exs.filter((e) => e.name.trim());
    if (!valid.length) return setErr('Adicione ao menos um exercício.');
    setBusy(true);
    try {
      await api.post('/workouts', {
        studentId: selected,
        name: name.trim() || 'Treino',
        notes: notes.trim() || undefined,
        exercises: valid.map((e, order) => ({
          name: e.name.trim(),
          sets: Number(e.sets) || 1,
          reps: e.reps.trim() || '12',
          restSeconds: e.rest ? Number(e.rest) : undefined,
          order,
        })),
      });
      setName('');
      setNotes('');
      setExs([{ name: '', sets: '4', reps: '8', rest: '90' }]);
      setSelected(null);
      Alert.alert('Enviado!', 'Treino enviado ao aluno.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao enviar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <PageTitle eyebrow="Montar e enviar" title="Novo treino" />

      <Field label="Nome do treino" placeholder="Ex.: Treino A — Peito" value={name} onChangeText={setName} />

      <Text style={st.section}>Aluno</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 18 }}>
        {students.map((s) => {
          const on = selected === s.id;
          return (
            <TouchableOpacity key={s.id} onPress={() => setSelected(s.id)} style={[st.studentChip, on && st.studentChipOn]} activeOpacity={0.85}>
              <Avatar name={s.name} size={26} />
              <Text style={[st.studentChipText, on && { color: COLORS.text }]}>{s.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={st.section}>Exercícios</Text>
      {exs.map((ex, i) => (
        <Card key={i}>
          <View style={st.exHead}>
            <TextInput
              style={st.exName}
              placeholder="Nome do exercício"
              placeholderTextColor={COLORS.text3}
              value={ex.name}
              onChangeText={(t) => setEx(i, 'name', t)}
            />
            <TouchableOpacity onPress={() => removeEx(i)} accessibilityLabel="Remover">
              <Feather name="trash-2" size={18} color={COLORS.text3} />
            </TouchableOpacity>
          </View>
          <View style={st.pills}>
            <Pill label="SETS" value={ex.sets} onChange={(t) => setEx(i, 'sets', t)} />
            <Pill label="REPS" value={ex.reps} onChange={(t) => setEx(i, 'reps', t)} />
            <Pill label="REST" value={ex.rest} suffix="s" onChange={(t) => setEx(i, 'rest', t)} />
          </View>
        </Card>
      ))}

      <TouchableOpacity style={st.addEx} onPress={addEx} activeOpacity={0.8}>
        <Feather name="plus" size={16} color={COLORS.text} />
        <Text style={st.addExText}>Adicionar exercício</Text>
      </TouchableOpacity>

      <Text style={st.section}>Observação</Text>
      <View style={st.textareaWrap}>
        <TextInput
          style={st.textarea}
          multiline
          placeholder="Ex: Foca na cadência. Aquece bem antes do supino..."
          placeholderTextColor={COLORS.text3}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {err ? <Text style={{ color: COLORS.danger, marginBottom: 10 }}>{err}</Text> : null}

      <Button title="Enviar treino" icon="send" loading={busy} full onPress={send} />
    </ScrollView>
  );
}

function Pill({ label, value, onChange, suffix }: { label: string; value: string; onChange: (t: string) => void; suffix?: string }) {
  return (
    <View style={st.pill}>
      <Text style={st.pillLabel}>{label}</Text>
      <TextInput style={st.pillInput} keyboardType="numeric" value={value} onChangeText={onChange} />
      {suffix ? <Text style={st.pillLabel}>{suffix}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  section: { color: COLORS.eyebrow, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentChipOn: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  studentChipText: { color: COLORS.text2, fontWeight: '700', fontSize: 13 },

  exHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  exName: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '700', paddingVertical: 0 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  pillLabel: { color: COLORS.text3, fontSize: 10, fontWeight: '700' },
  pillInput: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '700', paddingVertical: 0, textAlign: 'center' },

  addEx: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  addExText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },

  textareaWrap: {
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  textarea: { color: COLORS.text, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
});
