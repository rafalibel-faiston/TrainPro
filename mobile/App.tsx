import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, getToken, setToken } from './src/api';
import type { User, Workout } from './src/types';
import { Background } from './src/ui';
import { COLORS } from './src/theme';
import { Login } from './src/screens/Login';
import { TrainerHome } from './src/screens/TrainerHome';
import { StudentDetail } from './src/screens/StudentDetail';
import { StudentHome } from './src/screens/StudentHome';
import { WorkoutPlayer } from './src/screens/WorkoutPlayer';

type TrainerRoute = { name: 'home' } | { name: 'student'; id: string; studentName: string };

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
        <TrainerArea user={user} onLogout={logout} />
      ) : (
        <StudentArea user={user} onLogout={logout} />
      )}
    </View>
  );
}

function TrainerArea({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [route, setRoute] = useState<TrainerRoute>({ name: 'home' });

  if (route.name === 'student') {
    return (
      <StudentDetail
        studentId={route.id}
        studentName={route.studentName}
        onBack={() => setRoute({ name: 'home' })}
      />
    );
  }

  return (
    <TrainerHome
      user={user}
      onOpenStudent={(id, name) => setRoute({ name: 'student', id, studentName: name })}
      onLogout={onLogout}
    />
  );
}

function StudentArea({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [workout, setWorkout] = useState<Workout | null>(null);

  if (workout) {
    return <WorkoutPlayer workout={workout} onBack={() => setWorkout(null)} />;
  }

  return <StudentHome user={user} onLogout={onLogout} onOpenWorkout={setWorkout} />;
}
