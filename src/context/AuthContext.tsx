import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { Player } from '../types';

interface AuthContextType {
  player: Player | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.get('/players/me').then((r) => setPlayer(r.data)).catch(() => logout());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setPlayer(data.player);
  }

  async function register(username: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setPlayer(data.player);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setPlayer(null);
  }

  return (
    <AuthContext.Provider value={{ player, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
