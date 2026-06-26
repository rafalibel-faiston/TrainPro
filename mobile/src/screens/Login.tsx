import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api, setToken } from '../api';
import type { User } from '../types';
import { Background, Button, Card, Field } from '../ui';
import { COLORS } from '../theme';

export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email: email.trim(), password });
      await setToken(res.token);
      onLogin(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao entrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgTop }}>
      <Background />
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <View style={st.badge}>
          <LinearGradient colors={[COLORS.accent, COLORS.accentDeep]} style={StyleSheet.absoluteFill} />
          <Feather name="zap" size={26} color="#fff" />
        </View>
        <Text style={st.brand}>TrainPro</Text>
        <Text style={st.tagline}>Treine com propósito</Text>

        <Card style={{ width: '100%', maxWidth: 420, padding: 22 }}>
          <Text style={st.heading}>Bem-vindo de volta</Text>
          <Text style={st.sub}>Entre na sua conta para continuar</Text>

          <Field
            icon="mail"
            placeholder="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field icon="lock" placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />

          {error ? <Text style={st.error}>{error}</Text> : null}

          <Button title="Entrar" loading={busy} full onPress={submit} />

          <Text style={st.hint}>Demo: personal@trainpro.dev · senha 123456</Text>
        </Card>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  badge: {
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
  heading: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  sub: { color: COLORS.text2, fontSize: 13, marginTop: 4, marginBottom: 18 },
  error: { color: COLORS.danger, fontSize: 13, marginBottom: 10 },
  hint: { color: COLORS.text3, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
