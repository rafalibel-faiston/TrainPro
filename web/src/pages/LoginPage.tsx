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
        await register({ name, email, password, role });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao autenticar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="auth-logo-text">TrainPro</span>
        </div>

        <h2 className="auth-heading">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h2>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Entre na sua conta para continuar'
            : 'Preencha os dados para começar'}
        </p>

        {mode === 'register' && (
          <>
            <div className="auth-field">
              <label>Nome completo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="auth-field">
              <label>Perfil</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="TRAINER">Personal Trainer</option>
                <option value="STUDENT">Aluno</option>
              </select>
            </div>
          </>
        )}

        <div className="auth-field">
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="auth-field">
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="auth-btn" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <p className="auth-footer">
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
