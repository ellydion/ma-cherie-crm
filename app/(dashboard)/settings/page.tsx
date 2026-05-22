'use client';

import { useState, useEffect } from 'react';
import { Settings, Building2, Receipt, Package, Users, Shield, Save, User, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const tabs = [
  { id: 'profile', label: 'Личный кабинет', icon: User },
  { id: 'company', label: 'Компания', icon: Building2 },
  { id: 'pos', label: 'POS-касса', icon: Receipt },
  { id: 'inventory', label: 'Склад', icon: Package },
  { id: 'users', label: 'Пользователи', icon: Users },
  { id: 'security', label: 'Безопасность', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    position: '',
    phone: '',
    email: '',
    avatar: '👨‍🍳'
  });
  const [loading, setLoading] = useState(true);

  // Загрузка профиля из Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') console.error(error);
      if (data) setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile.name) {
      alert('Имя обязательно!');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id || undefined,
        name: profile.name,
        position: profile.position,
        phone: profile.phone,
        email: profile.email,
        avatar: profile.avatar
      });

    if (error) {
      console.error(error);
      alert('Ошибка сохранения');
    } else {
      alert('✅ Данные успешно сохранены в Supabase!');
    }
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка профиля...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Настройки</h1>
          <p className="text-[#C8A77E] mt-1">Личный кабинет и системные настройки</p>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium transition-all ${
                activeTab === tab.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card p-8">
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center mb-10">
              <div className="w-28 h-28 bg-[#C8A77E] rounded-3xl flex items-center justify-center text-7xl shadow-inner relative">
                {profile.avatar}
                <button className="absolute -bottom-1 -right-1 bg-[#3F2A1F] p-2 rounded-2xl border border-[#C8A77E]">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <h2 className="text-3xl font-semibold text-white mt-6">{profile.name || 'Сотрудник'}</h2>
              <p className="text-[#C8A77E]">{profile.position}</p>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-sm text-gray-400 block mb-2">ФИО</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Должность</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Телефон</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-[#5C4030]">
                <button
                  onClick={handleSave}
                  className="w-full py-6 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-semibold text-xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
                >
                  <Save className="w-6 h-6" />
                  Сохранить в Supabase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Остальные вкладки */}
        {activeTab !== 'profile' && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Раздел в разработке</p>
          </div>
        )}
      </div>
    </div>
  );
}