import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import type { Role, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    inviteCode?: string;
  }) => Promise<void>;
  logout: () => void;
  // Recarrega os dados do usuário (ex.: após vincular a um personal).
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(res.token);
    setUser(res.user);
  }

  async function register(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    inviteCode?: string;
  }) {
    const res = await api.post<{ token: string; user: User }>('/auth/register', data);
    setToken(res.token);
    setUser(res.user);
  }

  async function refresh() {
    const res = await api.get<{ user: User }>('/auth/me');
    setUser(res.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return ctx;
}
