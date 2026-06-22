import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#22c55e" />
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

  async function submit() {
    setError('');
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      });
      await setToken(res.token);
      onLogin(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao entrar.');
    }
  }

  return (
    <View style={[styles.container, styles.center]}>
      <StatusBar style="light" />
      <Text style={styles.brand}>TrainPro</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    api.get<Workout[]>('/workouts').then(setWorkouts).catch(() => setWorkouts([]));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>Olá, {user.name}</Text>
        <TouchableOpacity
          onPress={async () => {
            await setToken(null);
            onLogout();
          }}
        >
          <Text style={styles.link}>Sair</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.section}>Treinos</Text>
      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        ListEmptyComponent={<Text style={styles.muted}>Nenhum treino.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.exercises.map((ex) => (
              <Text key={ex.id} style={styles.muted}>
                {ex.name} — {ex.sets}x{ex.reps}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 60 },
  center: { justifyContent: 'center', alignItems: 'center' },
  brand: { color: '#22c55e', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { color: '#e2e8f0', fontSize: 18, fontWeight: '600', marginVertical: 12 },
  input: {
    width: '100%',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: { backgroundColor: '#22c55e', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' },
  buttonText: { color: '#052e16', fontWeight: '700' },
  link: { color: '#94a3b8' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#e2e8f0', fontWeight: '700', marginBottom: 6 },
  muted: { color: '#94a3b8' },
  error: { color: '#f87171', marginBottom: 8 },
});
