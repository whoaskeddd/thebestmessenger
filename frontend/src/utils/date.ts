const DATE_MASK_MAX_DIGITS = 8;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, DATE_MASK_MAX_DIGITS);
}

export function formatDateInput(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function isValidDisplayDate(value: string): boolean {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return false;
  const [dayRaw, monthRaw, yearRaw] = value.split('.');
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (year < 1900 || year > 2100) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

export function displayDateToApiDate(value: string): string | null {
  if (!isValidDisplayDate(value)) return null;
  const [day, month, year] = value.split('.');
  return `${year}-${month}-${day}`;
}

export function apiDateToDisplayDate(value?: string | null): string {
  if (!value) return '—';
  const normalized = value.slice(0, 10);
  const parts = normalized.split('-');
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  const displayValue = `${day}.${month}.${year}`;
  return isValidDisplayDate(displayValue) ? displayValue : value;
}
