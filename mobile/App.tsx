import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, getToken, setToken } from './src/api';
import type { User, Workout } from './src/types';
import { Background, BottomTabBar } from './src/ui';
import { COLORS } from './src/theme';
import { Login } from './src/screens/Login';
import { Alunos } from './src/screens/Alunos';
import { NovoTreino } from './src/screens/NovoTreino';
import { Agenda } from './src/screens/Agenda';
import { Chat } from './src/screens/Chat';
import { StudentDetail } from './src/screens/StudentDetail';
import { StudentHome } from './src/screens/StudentHome';
import { WorkoutPlayer } from './src/screens/WorkoutPlayer';

type TrainerTab = 'alunos' | 'treino' | 'agenda' | 'chat';

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

  async function logout() {
    await setToken(null);
    setUser(null);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgTop }}>
        <Background />
        <StatusBar style="light" />
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgTop }}>
      <Background />
      <StatusBar style="light" />
      {user.role === 'TRAINER' ? (
        <TrainerTabs user={user} onLogout={logout} />
      ) : (
        <StudentArea user={user} onLogout={logout} />
      )}
    </View>
  );
}

function TrainerTabs({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTab] = useState<TrainerTab>('alunos');
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);

  // Detalhe do aluno ocupa a tela toda (esconde as abas).
  if (student) {
    return <StudentDetail studentId={student.id} studentName={student.name} onBack={() => setStudent(null)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {tab === 'alunos' && (
        <Alunos user={user} onOpenStudent={(id, name) => setStudent({ id, name })} onLogout={onLogout} />
      )}
      {tab === 'treino' && <NovoTreino />}
      {tab === 'agenda' && <Agenda />}
      {tab === 'chat' && <Chat />}

      <BottomTabBar<TrainerTab>
        active={tab}
        onChange={setTab}
        items={[
          { key: 'alunos', label: 'Alunos', icon: 'users' },
          { key: 'treino', label: 'Treino', icon: 'activity' },
          { key: 'agenda', label: 'Agenda', icon: 'calendar' },
          { key: 'chat', label: 'Chat', icon: 'message-square' },
        ]}
      />
    </View>
  );
}

function StudentArea({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [workout, setWorkout] = useState<Workout | null>(null);

  if (workout) {
    return <WorkoutPlayer workout={workout} onBack={() => setWorkout(null)} />;
  }

  return <StudentHome user={user} onLogout={onLogout} onOpenWorkout={setWorkout} />;
}
