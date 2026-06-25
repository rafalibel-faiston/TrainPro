import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api, getToken, setToken } from './src/api';

interface User {
  name: string;
  role: 'TRAINER' | 'STUDENT';
}

interface Workout {
  id: string;
  name: string;
  exercises: { id: string; name: string; sets: number; reps: string }[];
}

const COLORS = {
  bgTop: '#0A1124',
  bgMid: '#0C1B3A',
  bgBot: '#0B2447',
  accent: '#2E90FF',
  accentDeep: '#1E6FE0',
  text: '#EAF2FB',
  text2: '#9FB3C8',
  text3: '#5E7390',
  surface: 'rgba(255,255,255,0.05)',
  surfaceStrong: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.10)',
  danger: '#F87171',
};

/** Fundo da tela: gradiente em tela cheia + dois brilhos suaves. */
function Background() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBot]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowBlue]} />
      <View style={[styles.glow, styles.glowCyan]} />
    </View>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (await getToken()) {
        try {
          const res = await api.get<{ user: User }>('/auth/me');
          setUser(res.user);
        } catch {
          await setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Background />
        <StatusBar style="light" />
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser} />;
  return <HomeScreen user={user} onLogout={() => setUser(null)} />;
}

function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      });
      await setToken(res.token);
      onLogin(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao entrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.fill}>
      <Background />
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.fill, styles.center, { padding: 24 }]}
      >
        <View style={styles.logoBadge}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDeep]}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="zap" size={26} color="#fff" />
        </View>
        <Text style={styles.brand}>TrainPro</Text>
        <Text style={styles.tagline}>Treine com propósito</Text>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Bem-vindo de volta</Text>
          <Text style={styles.cardSub}>Entre na sua conta para continuar</Text>

          <Field
            icon="mail"
            placeholder="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            icon="lock"
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity activeOpacity={0.85} onPress={submit} disabled={busy}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, busy && { opacity: 0.6 }]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Demo: personal@trainpro.dev · senha 123456
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  icon,
  ...props
}: { icon: keyof typeof Feather.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Feather name={icon} size={18} color={COLORS.text3} style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.text3}
        {...props}
      />
    </View>
  );
}

function HomeScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Workout[]>('/workouts')
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
      .finally(() => setLoading(false));
  }, []);

  const totalExercises = workouts.reduce((acc, w) => acc + w.exercises.length, 0);

  return (
    <View style={styles.fill}>
      <Background />
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Olá,</Text>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.role}>
              {user.role === 'TRAINER' ? 'Personal Trainer' : 'Aluno'}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.name || 'TP')}</Text>
          </View>
        </View>

        {/* Faixa de destaque preenchendo a tela */}
        <LinearGradient
          colors={['rgba(46,144,255,0.22)', 'rgba(30,111,224,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBand}
        >
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{workouts.length}</Text>
            <Text style={styles.heroLabel}>Treinos</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{totalExercises}</Text>
            <Text style={styles.heroLabel}>Exercícios</Text>
          </View>
          <View style={styles.heroDivider} />
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await setToken(null);
              onLogout();
            }}
          >
            <Feather name="log-out" size={18} color={COLORS.text2} />
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.section}>Seus treinos</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(w) => w.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="inbox" size={30} color={COLORS.text3} />
                <Text style={styles.emptyText}>Nenhum treino ainda.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.workoutCard}>
                <View style={styles.workoutTop}>
                  <View style={styles.workoutIcon}>
                    <Feather name="activity" size={16} color={COLORS.accent} />
                  </View>
                  <Text style={styles.workoutTitle}>{item.name}</Text>
                </View>
                <View style={styles.chips}>
                  {item.exercises.map((ex) => (
                    <View key={ex.id} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {ex.name} · {ex.sets}x{ex.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: COLORS.bgTop },
  center: { justifyContent: 'center', alignItems: 'center' },
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 64 },

  // Brilhos de fundo
  glow: { position: 'absolute', borderRadius: 9999, opacity: 0.5 },
  glowBlue: {
    width: 420,
    height: 420,
    top: -140,
    right: -120,
    backgroundColor: 'rgba(46,144,255,0.25)',
  },
  glowCyan: {
    width: 360,
    height: 360,
    bottom: -120,
    left: -110,
    backgroundColor: 'rgba(14,165,233,0.16)',
  },

  // Login
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brand: { color: COLORS.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: COLORS.text2, fontSize: 14, marginTop: 4, marginBottom: 26 },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 22,
  },
  cardHeading: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  cardSub: { color: COLORS.text2, fontSize: 13, marginTop: 4, marginBottom: 18 },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: { flex: 1, color: COLORS.text, paddingVertical: 13, fontSize: 15 },

  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { color: COLORS.text3, fontSize: 12, textAlign: 'center', marginTop: 14 },
  error: { color: COLORS.danger, fontSize: 13, marginBottom: 10 },

  // Home
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  hello: { color: COLORS.text2, fontSize: 14 },
  name: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  role: { color: COLORS.text3, fontSize: 12, marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46,144,255,0.18)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 15 },

  heroBand: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 22,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  heroLabel: { color: COLORS.text2, fontSize: 12, marginTop: 2 },
  heroDivider: { width: 1, height: 34, backgroundColor: COLORS.border },
  logoutBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },

  workoutCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  workoutTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  workoutIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(46,144,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  workoutTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  chipText: { color: COLORS.text2, fontSize: 12 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: COLORS.text3, fontSize: 14 },
});
