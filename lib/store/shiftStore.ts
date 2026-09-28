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
  refresh: () => Promise<void>;
  openShift: () => Promise<string | null>;
  closeShift: () => Promise<void>;
};

export const useShiftStore = create<Store>((set, get) => ({
  current: null,
  loading: false,
  refresh: async () => {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    set({ current: (data as Shift) || null });
  },
  openShift: async () => {
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('shifts')
      .insert([{ user_id: auth.user?.id || null, note: 'Смена открыта' }])
      .select()
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    set({ current: data as Shift });
    return data.id as string;
  },
  closeShift: async () => {
    const cur = get().current;
    if (!cur) return;
    await supabase.from('shifts').update({ ended_at: new Date().toISOString(), note: 'Смена закрыта' }).eq('id', cur.id);
    set({ current: null });
  },
}));
