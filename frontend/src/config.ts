import { Platform } from 'react-native';

const androidEmulatorHost = 'http://10.0.2.2:8000';
const localhostHost = 'http://localhost:8000';

export const API_BASE_URL = Platform.select({
  android: androidEmulatorHost,
  default: localhostHost,
}) as string;

export const APP_TITLE = 'HR Connect';
