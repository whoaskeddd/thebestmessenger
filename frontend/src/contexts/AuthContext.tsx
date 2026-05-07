import React, { createContext, useEffect, useMemo, useState } from 'react';
import { currentUser } from '../data/mock';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from '../services/authStorage';
import { api, configureApiAuth } from '../services/api';
import { AuthTokens, User } from '../types/models';

interface AuthContextValue {
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { fullName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => tokens?.accessToken ?? null,
      getRefreshToken: () => tokens?.refreshToken ?? null,
      setTokens: async (nextTokens) => {
        setTokens(nextTokens);
        await setStoredTokens(nextTokens);
      },
      logout
    });
  }, [tokens]);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const saved = await getStoredTokens();
      if (!saved) {
        setIsLoading(false);
        return;
      }

      setTokens(saved);

      try {
        const response = await api.get<User>('/users/me');
        setUser(response.data);
      } catch {
        setUser(currentUser);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const nextTokens = response.data as AuthTokens;
      setTokens(nextTokens);
      await setStoredTokens(nextTokens);

      try {
        const meResponse = await api.get<User>('/users/me');
        setUser(meResponse.data);
      } catch {
        setUser({ ...currentUser, email });
      }
    } catch {
      // Fallback for local frontend development before backend is connected.
      const devTokens: AuthTokens = {
        accessToken: `dev-access-${Date.now()}`,
        refreshToken: `dev-refresh-${Date.now()}`
      };
      setTokens(devTokens);
      await setStoredTokens(devTokens);
      setUser({ ...currentUser, email });
    }
  }

  async function register(payload: { fullName: string; email: string; password: string }) {
    try {
      await api.post('/auth/register', payload);
    } catch {
      // Ignore in mocked mode.
    }

    await login(payload.email, payload.password);
    setUser((prev) => (prev ? { ...prev, fullName: payload.fullName } : prev));
  }

  async function logout() {
    setTokens(null);
    setUser(null);
    await clearStoredTokens();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      accessToken: tokens?.accessToken ?? null,
      login,
      register,
      logout
    }),
    [isLoading, user, tokens]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
