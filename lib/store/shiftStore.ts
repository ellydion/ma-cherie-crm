import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export type Shift = {
  id: string;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  note: string | null;
};

type Store = {
  current: Shift | null;
  loading: boolean;
  /** true после первого ответа о текущей смене (до этого статус неизвестен). */
  checked: boolean;
  refresh: () => Promise<void>;
  /** true, пока идёт запрос открытия или закрытия смены. */
  busy: boolean;
  /** Текст последней ошибки/предупреждения для показа пользователю. */
  lastMessage: string;
  openShift: () => Promise<string | null>;
  closeShift: () => Promise<boolean>;
};

// Защита от двойного нажатия даже до перерисовки кнопки.
let inFlight = false;

export const useShiftStore = create<Store>((set, get) => ({
  current: null,
  loading: false,
  checked: false,
  busy: false,
  lastMessage: '',
  refresh: async () => {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    set({ current: (data as Shift) || null, checked: true });
  },
  openShift: async () => {
    if (inFlight) return null;
    inFlight = true;
    set({ busy: true, lastMessage: '' });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      // Если у пользователя уже есть открытая смена, просто подтягиваем её.
      if (uid) {
        const { data: existing } = await supabase
          .from('shifts').select('*').eq('user_id', uid).is('ended_at', null)
          .order('started_at', { ascending: false }).limit(1).maybeSingle();
        if (existing) {
          set({ current: existing as Shift, checked: true, lastMessage: 'Смена уже открыта, показываю её' });
          return null;
        }
      }
      const { data, error } = await supabase
        .from('shifts')
        .insert([{ user_id: uid, note: 'Смена открыта' }])
        .select()
        .single();
      if (error) {
        // 23505: уникальный индекс shifts_one_open_per_user, смена уже открыта.
        if ((error as { code?: string }).code === '23505') {
          await get().refresh();
          set({ lastMessage: 'Смена уже открыта, показываю её' });
          return null;
        }
        console.error(error);
        set({ lastMessage: 'Не удалось открыть смену. Попробуй ещё раз или сообщи администратору.' });
        return null;
      }
      set({ current: data as Shift, checked: true });
      return data.id as string;
    } finally {
      inFlight = false;
      set({ busy: false });
    }
  },
  closeShift: async () => {
    const cur = get().current;
    if (!cur || inFlight) return false;
    inFlight = true;
    set({ busy: true, lastMessage: '' });
    try {
      const { error } = await supabase
        .from('shifts')
        .update({ ended_at: new Date().toISOString(), note: 'Смена закрыта' })
        .eq('id', cur.id)
        .is('ended_at', null);
      if (error) {
        console.error(error);
        set({ lastMessage: 'Не удалось закрыть смену. Попробуй ещё раз.' });
        return false;
      }
      set({ current: null });
      return true;
    } finally {
      inFlight = false;
      set({ busy: false });
    }
  },
}));
