import { useState } from 'react';
import { useAuth } from '../auth';
import { ApiError } from '../api';
import type { Role } from '../types';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TRAINER');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          role,
          inviteCode: role === 'STUDENT' && inviteCode.trim() ? inviteCode.trim() : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao autenticar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1 style={{ color: 'var(--accent)', marginTop: 0 }}>TrainPro</h1>
        <p className="muted">
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </p>

        {mode === 'register' && (
          <>
            <label>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
            <label>Eu sou</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="TRAINER">Personal trainer</option>
              <option value="STUDENT">Aluno</option>
            </select>
            {role === 'STUDENT' && (
              <>
                <label>Código do personal (opcional)</label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ex.: CARLOS"
                  maxLength={12}
                />
              </>
            )}
          </>
        )}

        <label>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>

        <p className="muted" style={{ marginBottom: 0, marginTop: 12 }}>
          {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </a>
        </p>
      </form>
    </div>
  );
}
