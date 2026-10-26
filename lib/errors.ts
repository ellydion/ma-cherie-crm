type DbError = { message?: string; code?: string; details?: string | null } | null | undefined;

/** Понятный текст ошибки Supabase/Postgres для сотрудников, с исходным текстом в конце. */
export function friendlyError(err: DbError | unknown, fallback = 'Не удалось сохранить'): string {
  if (!err) return fallback;
  const e = err as { message?: string; code?: string };
  const raw = e.message || String(err);
  if (e.code === 'PGRST116') return `Запись не найдена или нет прав на изменение. ${raw}`;
  if (e.code === '23505') return `Такая запись уже есть (повтор). ${raw}`;
  if (e.code === '23503') return `Запись связана с другими данными и не может быть изменена так. ${raw}`;
  if (e.code === '42501' || /row-level security|permission denied/i.test(raw)) return `Нет прав на это действие. ${raw}`;
  if (/failed to fetch|network/i.test(raw)) return 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.';
  return `${fallback}: ${raw}`;
}
