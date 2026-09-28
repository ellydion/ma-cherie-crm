'use client';
import { useProfileStore } from '@/lib/store/profileStore';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { profile, updateProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name || '');
  const [position, setPosition] = useState(profile?.position || '');

  const save = async () => {
    if (!profile?.id) return;
    await supabase.from('profiles').update({ name, position }).eq('id', profile.id);
    updateProfile({ name, position });
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-4xl font-semibold mb-8">Настройки</h1>
      <div className="card p-8 space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4" />
        <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4" />
        <button onClick={save} className="btn-primary w-full py-4">Сохранить</button>
      </div>
    </div>
  );
}
