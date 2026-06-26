import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import type { Student, User } from '../types';
import { AppHeader, Button, Card, EmptyState, Field, Loading } from '../ui';
import { COLORS, initials } from '../theme';

export function TrainerHome({
  user,
  onOpenStudent,
  onLogout,
}: {
  user: User;
  onOpenStudent: (id: string, name: string) => void;
  onLogout: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Formulário de novo aluno
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [goal, setGoal] = useState('');

  async function reload() {
    try {
      setStudents(await api.get<Student[]>('/students'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function addStudent() {
    setBusy(true);
    setErr('');
    try {
      if (!name.trim() || !email.trim() || password.length < 6) {
        throw new Error('Preencha nome, e-mail e senha (mín. 6).');
      }
      await api.post('/students', {
        name: name.trim(),
        email: email.trim(),
        password,
        goal: goal.trim() || undefined,
      });
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
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <AppHeader
        title={user.name}
        subtitle="Personal Trainer"
        right={
          <TouchableOpacity onPress={onLogout} style={st.logout} accessibilityLabel="Sair">
            <Feather name="log-out" size={18} color={COLORS.text2} />
          </TouchableOpacity>
        }
      />

      <LinearGradient
        colors={['rgba(46,144,255,0.22)', 'rgba(30,111,224,0.10)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.hero}
      >
        <View style={st.heroStat}>
          <Text style={st.heroValue}>{students.length}</Text>
          <Text style={st.heroLabel}>Alunos</Text>
        </View>
      </LinearGradient>

      <View style={{ marginBottom: 14 }}>
        <Button
          title={showForm ? 'Cancelar' : 'Novo aluno'}
          icon={showForm ? 'x' : 'user-plus'}
          variant={showForm ? 'ghost' : 'primary'}
          onPress={() => setShowForm((v) => !v)}
        />
      </View>

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
      ) : students.length === 0 ? (
        <EmptyState icon="users" text="Nenhum aluno ainda. Cadastre o primeiro!" />
      ) : (
        students.map((s) => (
          <TouchableOpacity key={s.id} activeOpacity={0.85} onPress={() => onOpenStudent(s.id, s.name)}>
            <Card>
              <View style={st.studentRow}>
                <View style={st.avatar}>
                  <Text style={st.avatarText}>{initials(s.name)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.studentName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={st.studentMeta} numberOfLines={1}>
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

  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(46,144,255,0.18)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 14 },
  studentName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  studentMeta: { color: COLORS.text2, fontSize: 13, marginTop: 2 },
});
