import { API_BASE_URL } from '../config';
import type { MeResponse, TokenPair } from '../types/api';

type RequestInitEx = RequestInit & { skipAuth?: boolean };

type AuthClient = {
  setTokens: (tokens: TokenPair | null) => Promise<void>;
  getTokens: () => Promise<TokenPair | null>;
};

let authClient: AuthClient | null = null;

export const registerAuthClient = (client: AuthClient): void => {
  authClient = client;
};

const getAuthHeader = async (): Promise<HeadersInit> => {
  if (!authClient) return {};
  const tokens = await authClient.getTokens();
  if (!tokens?.access_token) return {};

  return { Authorization: `Bearer ${tokens.access_token}` };
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
};

function parseErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown } | undefined;
    if (first && typeof first.msg === 'string' && first.msg.trim()) return first.msg;
  }
  return null;
}

const request = async <T>(path: string, init: RequestInitEx = {}): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.skipAuth ? {} : await getAuthHeader()),
    ...(init.headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && !init.skipAuth && authClient) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...init, skipAuth: false });
    }
  }

  if (!response.ok) {
    const body = await parseJson<unknown>(response).catch(() => null);
    throw new Error(parseErrorMessage(body) ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return parseJson<T>(response);
};

const tryRefresh = async (): Promise<boolean> => {
  if (!authClient) return false;

  const tokens = await authClient.getTokens();
  if (!tokens?.refresh_token) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });

  if (!response.ok) {
    await authClient.setTokens(null);
    return false;
  }

  const nextTokens = (await response.json()) as TokenPair;
  await authClient.setTokens(nextTokens);
  return true;
};

export const authApi = {
  login(email: string, password: string): Promise<TokenPair> {
    return request<TokenPair>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string): Promise<TokenPair> {
    return request<TokenPair>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  },

  me(): Promise<MeResponse> {
    return request<MeResponse>('/auth/me');
  },

  logout(refreshToken: string): Promise<void> {
    return request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  request,
};
