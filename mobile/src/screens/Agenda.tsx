import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import type { Appointment } from '../types';
import { Card, EmptyState, Loading, PageTitle } from '../ui';
import { COLORS, avatarColor, formatTime } from '../theme';

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const SHORT = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const FULL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayIdx, setDayIdx] = useState(() => (new Date().getDay() + 6) % 7); // 0 = segunda

  useEffect(() => {
    api
      .get<Appointment[]>('/appointments')
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  // Dias da semana atual (segunda a domingo).
  const week = useMemo(() => {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - offset);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const perDay = useMemo(
    () => week.map((d) => appointments.filter((a) => sameDay(new Date(a.startsAt), d))),
    [week, appointments],
  );

  const selected = perDay[dayIdx] || [];
  const maxCount = Math.max(...perDay.map((x) => x.length), 1);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 110 }}>
      <PageTitle eyebrow="Semana atual" title="Agenda" />

      <View style={st.days}>
        {SHORT.map((lb, i) => {
          const on = i === dayIdx;
          const has = perDay[i].length > 0;
          return (
            <TouchableOpacity key={i} onPress={() => setDayIdx(i)} style={[st.day, on && st.dayOn]} activeOpacity={0.85}>
              <Text style={[st.dayText, on && { color: COLORS.onAccent }]}>{lb}</Text>
              <View style={[st.dot, has && { backgroundColor: on ? COLORS.onAccent : COLORS.accent }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <Loading />
      ) : selected.length ? (
        selected.map((a) => (
          <View key={a.id} style={st.sessionCard}>
            <View style={[st.sessionBar, { backgroundColor: avatarColor(a.student?.user.name || 'x') }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.sessionName} numberOfLines={1}>
                {a.student?.user.name || 'Sessão'}
              </Text>
              {a.notes ? (
                <Text style={st.sessionSub} numberOfLines={1}>
                  {a.notes}
                </Text>
              ) : null}
            </View>
            <View style={st.sessionTime}>
              <Feather name="clock" size={13} color={COLORS.text2} />
              <Text style={st.sessionTimeText}>{formatTime(a.startsAt)}</Text>
            </View>
          </View>
        ))
      ) : (
        <EmptyState icon="calendar" text="Sem sessões neste dia." />
      )}

      <Card style={{ marginTop: 8 }}>
        <Text style={st.cardTitle}>Visão da semana</Text>
        {FULL.map((lb, i) => (
          <View key={i} style={st.barRow}>
            <Text style={st.barLabel}>{lb}</Text>
            <View style={st.barTrack}>
              <View style={{ flex: perDay[i].length, backgroundColor: COLORS.accent, borderRadius: 6 }} />
              <View style={{ flex: Math.max(0.0001, maxCount - perDay[i].length) }} />
            </View>
            <Text style={st.barCount}>{perDay[i].length}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  days: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayText: { color: COLORS.text2, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sessionBar: { width: 4, alignSelf: 'stretch', borderRadius: 4 },
  sessionName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  sessionSub: { color: COLORS.text2, fontSize: 13, marginTop: 2 },
  sessionTime: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionTimeText: { color: COLORS.text2, fontSize: 13, fontWeight: '700' },

  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { color: COLORS.text2, fontSize: 12, width: 30 },
  barTrack: { flex: 1, flexDirection: 'row', height: 8, backgroundColor: COLORS.surfaceStrong, borderRadius: 6, overflow: 'hidden' },
  barCount: { color: COLORS.text2, fontSize: 12, width: 16, textAlign: 'right' },
});
