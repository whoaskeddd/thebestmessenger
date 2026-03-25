import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens } from '../types/models';

const ACCESS_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY)
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function setStoredTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, tokens.accessToken),
    AsyncStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  ]);
}

export async function clearStoredTokens(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(ACCESS_KEY), AsyncStorage.removeItem(REFRESH_KEY)]);
}
