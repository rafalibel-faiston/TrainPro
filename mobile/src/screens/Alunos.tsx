import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import type { Appointment, Payment, Student, User } from '../types';
import { Avatar, Button, Card, EmptyState, Field, Loading, PageTitle, SearchInput, StatCard } from '../ui';
import { COLORS } from '../theme';

export function Alunos({
  user,
  onOpenStudent,
  onLogout,
}: {
  user: User;
  onOpenStudent: (id: string, name: string) => void;
  onLogout: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [goal, setGoal] = useState('');

  async function reload() {
    try {
      const [s, a, p] = await Promise.all([
        api.get<Student[]>('/students'),
        api.get<Appointment[]>('/appointments').catch(() => [] as Appointment[]),
        api.get<Payment[]>('/payments').catch(() => [] as Payment[]),
      ]);
      setStudents(s);
      setAppointments(a);
      setPayments(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((a) => a.status === 'SCHEDULED' && new Date(a.startsAt).toDateString() === today).length;
  }, [appointments]);

  const pendingCount = useMemo(() => payments.filter((p) => p.status !== 'PAID').length, [payments]);

  const filtered = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())),
    [students, query],
  );

  async function addStudent() {
    setBusy(true);
    setErr('');
    try {
      if (!name.trim() || !email.trim() || password.length < 6) {
        throw new Error('Preencha nome, e-mail e senha (mín. 6).');
      }
      await api.post('/students', { name: name.trim(), email: email.trim(), password, goal: goal.trim() || undefined });
      setName('');
      setEmail('');
      setPassword('');
      setGoal('');
      setShowForm(false);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao cadastrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
      <PageTitle
        eyebrow="Seus alunos"
        title="Alunos"
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={st.iconBtn} onPress={() => setShowForm((v) => !v)} accessibilityLabel="Novo aluno">
              <Feather name={showForm ? 'x' : 'plus'} size={20} color={COLORS.onAccent} />
            </TouchableOpacity>
            <TouchableOpacity style={st.iconBtnGhost} onPress={onLogout} accessibilityLabel="Sair">
              <Feather name="log-out" size={18} color={COLORS.text2} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={st.stats}>
        <StatCard value={students.length} label="Ativos" />
        <StatCard value={todayCount} label="Hoje" />
        <StatCard value={pendingCount} label="Pendentes" />
      </View>

      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar aluno..." />

      {err ? <Text style={{ color: COLORS.danger, marginBottom: 10 }}>{err}</Text> : null}

      {showForm && (
        <Card>
          <Field label="Nome" placeholder="Nome do aluno" value={name} onChangeText={setName} />
          <Field
            label="E-mail"
            placeholder="email@exemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Senha (mín. 6)" placeholder="Senha de acesso" secureTextEntry value={password} onChangeText={setPassword} />
          <Field label="Objetivo (opcional)" placeholder="Ex.: Hipertrofia" value={goal} onChangeText={setGoal} />
          <Button title="Cadastrar aluno" loading={busy} full onPress={addStudent} />
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState icon="users" text={students.length ? 'Nenhum aluno encontrado.' : 'Cadastre seu primeiro aluno no +.'} />
      ) : (
        filtered.map((s) => (
          <TouchableOpacity key={s.id} activeOpacity={0.85} onPress={() => onOpenStudent(s.id, s.name)}>
            <Card>
              <View style={st.row}>
                <Avatar name={s.name} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.name} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={st.meta} numberOfLines={1}>
                    {s.goal || s.email}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.text3} />
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  iconBtnGhost: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  meta: { color: COLORS.text2, fontSize: 13, marginTop: 2 },
});
