import { Platform } from 'react-native';

const androidEmulatorHost = 'http://10.0.2.2:8001';
const localhostHost = 'http://localhost:8001';
const publicApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  publicApiUrl ??
  (Platform.select({
    android: androidEmulatorHost,
    default: localhostHost,
  }) as string);

export const APP_TITLE = 'HR Connect';
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';
export const DEV_BYPASS_ROLE = process.env.EXPO_PUBLIC_DEV_BYPASS_ROLE === 'employee' ? 'employee' : 'hr';
