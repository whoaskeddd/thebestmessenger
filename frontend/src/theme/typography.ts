import { Platform } from 'react-native';

export const fontFamilies = {
  primary: Platform.select({
    web: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    default: undefined,
  }),
} as const;

export const typography = {
  title: {
    fontFamily: fontFamilies.primary,
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamilies.primary,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamilies.primary,
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
} as const;

