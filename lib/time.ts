// Всё время в CRM показываем и считаем по Бишкеку, независимо от часового пояса устройства.
// В Кыргызстане с 2005 года нет перехода на летнее время, смещение всегда UTC+6.
export const APP_TZ = 'Asia/Bishkek';
const OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (input: Date | string | number) => (input instanceof Date ? input : new Date(input));

/** Ключ дня YYYY-MM-DD по Бишкеку. */
export function bishkekDayKey(input: Date | string | number = new Date()): string {
  const shifted = new Date(toDate(input).getTime() + OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Начало дня (00:00 по Бишкеку) как момент времени. daysAgo = 0 это сегодня. */
export function bishkekDayStart(daysAgo = 0, now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + OFFSET_MS);
  const startUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysAgo);
  return new Date(startUtc - OFFSET_MS);
}

/** Сдвинуть момент на целое число суток (без DST это корректно). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** "DD.MM" по Бишкеку. */
export function bishkekDayLabel(input: Date | string | number): string {
  const [, m, d] = bishkekDayKey(input).split('-');
  return `${d}.${m}`;
}

export function formatTime(input: Date | string | number, withSeconds = false): string {
  return toDate(input).toLocaleTimeString('ru-RU', {
    timeZone: APP_TZ,
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
}

export function formatDateTime(input: Date | string | number): string {
  return toDate(input).toLocaleString('ru-RU', {
    timeZone: APP_TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
