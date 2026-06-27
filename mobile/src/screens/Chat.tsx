import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import type { Student } from '../types';
import { Avatar, Card, EmptyState, Loading, PageTitle } from '../ui';
import { COLORS } from '../theme';

export function Chat() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Student[]>('/students')
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 110 }}>
      <PageTitle eyebrow="Conversas" title="Mensagens" />

      {loading ? (
        <Loading />
      ) : students.length ? (
        <>
          {students.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Chat', 'As mensagens em tempo real chegam numa próxima atualização.')}
            >
              <Card>
                <View style={st.row}>
                  <Avatar name={s.name} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.name} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={st.sub} numberOfLines={1}>
                      {s.goal || 'Iniciar conversa'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={COLORS.text3} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          <Text style={st.note}>O chat em tempo real chega numa próxima atualização.</Text>
        </>
      ) : (
        <EmptyState icon="message-square" text="Sem conversas ainda." />
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  sub: { color: COLORS.text2, fontSize: 13, marginTop: 2 },
  note: { color: COLORS.text3, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
