import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthTokens } from '../types/models';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 10000
});

const refreshApi = axios.create({
  baseURL,
  timeout: 10000
});

interface AuthHandlers {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
}

let authHandlers: AuthHandlers | null = null;
let refreshPromise: Promise<AuthTokens | null> | null = null;

export function configureApiAuth(handlers: AuthHandlers) {
  authHandlers = handlers;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authHandlers?.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;

    if (!authHandlers || status !== 401 || originalConfig?._retried) {
      return Promise.reject(error);
    }

    originalConfig._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }

      const tokens = await refreshPromise;
      refreshPromise = null;

      if (!tokens) {
        await authHandlers.logout();
        return Promise.reject(error);
      }

      originalConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalConfig);
    } catch (refreshError) {
      refreshPromise = null;
      await authHandlers.logout();
      return Promise.reject(refreshError);
    }
  }
);

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = authHandlers?.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await refreshApi.post('/auth/refresh', { refreshToken });
  const tokens = response.data as AuthTokens;

  await authHandlers?.setTokens(tokens);

  return tokens;
}
