import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { AppSettings, DEFAULT_SETTINGS, normalizeSettings } from '@/lib/settings';
import { friendlyError } from '@/lib/errors';

type Store = {
  settings: AppSettings;
  rowId: string | null;
  /** Сырые jsonb, чтобы при сохранении не потерять ключи, которых нет в форме. */
  raw: { pos_settings: Record<string, unknown>; inventory_settings: Record<string, unknown>; company: Record<string, unknown> };
  loaded: boolean;
  load: () => Promise<void>;
  /** Сохраняет настройки. Возвращает текст ошибки или null. */
  save: (next: AppSettings) => Promise<string | null>;
};

export const useSettingsStore = create<Store>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  rowId: null,
  raw: { pos_settings: {}, inventory_settings: {}, company: {} },
  loaded: false,
  load: async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('updated_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) { set({ loaded: true }); return; }
    set({
      settings: normalizeSettings(data),
      rowId: data?.id ?? null,
      raw: {
        pos_settings: data?.pos_settings || {},
        inventory_settings: data?.inventory_settings || {},
        company: data?.company || {},
      },
      loaded: true,
    });
  },
  save: async (next) => {
    const { rowId, raw } = get();
    const payload = {
      pos_settings: { ...raw.pos_settings, ...next.pos },
      inventory_settings: { ...raw.inventory_settings, ...next.inventory },
      company: { ...raw.company, ...next.company },
      updated_at: new Date().toISOString(),
    };
    const res = rowId
      ? await supabase.from('app_settings').update(payload).eq('id', rowId).select('*')
      : await supabase.from('app_settings').insert([payload]).select('*');
    if (res.error) return friendlyError(res.error);
    const row = res.data?.[0];
    // RLS молча отбрасывает UPDATE без прав: 0 строк значит «нет прав».
    if (!row) return 'Нет прав на изменение настроек';
    set({
      settings: normalizeSettings(row),
      rowId: row.id,
      raw: { pos_settings: row.pos_settings || {}, inventory_settings: row.inventory_settings || {}, company: row.company || {} },
    });
    return null;
  },
}));

/** Настройки с автозагрузкой при первом использовании. */
let started = false;
export function useSettings(): AppSettings {
  const settings = useSettingsStore((s) => s.settings);
  useEffect(() => {
    if (started) return;
    started = true;
    void useSettingsStore.getState().load();
  }, []);
  return settings;
}
