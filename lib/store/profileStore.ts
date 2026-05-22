import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

interface Profile {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  avatar: string;
}

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      loading: true,

      fetchProfile: async () => {
        set({ loading: true });
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Ошибка загрузки профиля:', error);
        }

        set({
          profile: data || {
            id: '',
            name: 'Айбек Султанов',
            position: 'Администратор',
            phone: '+996 555 123 456',
            email: 'aibek@macherie.coffee',
            avatar: '👨‍🍳'
          },
          loading: false,
        });
      },

      updateProfile: (data) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : null,
        })),
    }),
    { name: 'ma-cherie-profile' }
  )
);