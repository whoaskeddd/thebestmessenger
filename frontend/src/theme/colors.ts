export const colors = {
  // Base
  pageBg: '#F5F3EE',
  surface: '#FFFFFF',
  border: '#B9CBB4',

  // Text
  textPrimary: '#1B3A28',
  textSecondary: '#4A6B52',
  textMuted: '#7A9A80',

  // Accents
  primary: '#2D5E3A',
  primarySoft: '#E3EAD9',
  cardStrong: '#C8DBBC',
  cardSoft: '#D7E4CF',
  actionBlue: '#2E6DE0',

  // Legacy names (keep for existing components)
  loginPrimary: '#2D5E3A',
  registerPrimary: '#2E6DE0',

  // Status
  success: '#1AAE63',
  warning: '#F5A524',
  danger: '#D93C15',
};

export const gradients = {
  // Legacy exports (kept to avoid churn)
  login: [colors.pageBg, colors.pageBg, colors.pageBg] as const,
  register: [colors.pageBg, colors.pageBg, colors.pageBg] as const,
  registerPage: [colors.pageBg, colors.pageBg] as const,
};
