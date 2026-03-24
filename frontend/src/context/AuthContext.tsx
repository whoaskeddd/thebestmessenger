import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi, registerAuthClient } from '../api/auth';
import type { MeResponse, TokenPair } from '../types/api';

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: MeResponse | null;
  tokens: TokenPair | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadMe: () => Promise<void>;
};

const STORAGE_KEY = 'hr_connect_tokens';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setReady] = useState(false);
  const [tokens, setTokensState] = useState<TokenPair | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);

  const setTokens = useCallback(async (next: TokenPair | null) => {
    setTokensState(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    }
  }, []);

  const getTokens = useCallback(async (): Promise<TokenPair | null> => {
    if (tokens) return tokens;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  }, [tokens]);

  useEffect(() => {
    registerAuthClient({ setTokens, getTokens });
  }, [getTokens, setTokens]);

  const reloadMe = useCallback(async () => {
    if (!tokens) {
      setUser(null);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      await setTokens(null);
    }
  }, [setTokens, tokens]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as TokenPair;
        setTokensState(saved);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (isReady && tokens) {
      void reloadMe();
    }
  }, [isReady, reloadMe, tokens]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const pair = await authApi.login(email, password);
    await setTokens(pair);
    const me = await authApi.me();
    setUser(me);
  }, [setTokens]);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    const pair = await authApi.register(email, password);
    await setTokens(pair);
    const me = await authApi.me();
    setUser(me);
  }, [setTokens]);

  const logout = useCallback(async (): Promise<void> => {
    if (tokens?.refresh_token) {
      try {
        await authApi.logout(tokens.refresh_token);
      } catch {
        // ignore network errors on logout and clear local state anyway
      }
    }
    await setTokens(null);
  }, [setTokens, tokens?.refresh_token]);

  const value = useMemo<AuthContextValue>(() => ({
    isReady,
    isAuthenticated: Boolean(tokens?.access_token),
    user,
    tokens,
    login,
    register,
    logout,
    reloadMe,
  }), [isReady, login, logout, reloadMe, register, tokens, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
