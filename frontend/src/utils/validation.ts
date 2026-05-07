const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Введите email';
  if (!EMAIL_REGEX.test(email)) return 'Введите корректный email, например name@company.com';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Введите пароль';
  if (value.length < PASSWORD_MIN_LENGTH) return 'Пароль должен быть не короче 8 символов';
  if (!PASSWORD_REGEX.test(value)) {
    return 'Пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру';
  }
  return null;
}
