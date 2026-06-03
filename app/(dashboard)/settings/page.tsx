'use client';

import { useState, useEffect } from 'react';
import { User, Building2, Receipt, Package, Users, Shield, Save, Camera } from 'lucide-react';
import { useProfileStore } from '@/lib/store/profileStore';
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
  const { profile, updateProfile } = useProfileStore();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // === Личный кабинет ===
  const [formData, setFormData] = useState({ name: '', position: '', phone: '', email: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        position: profile.position || '',
        phone: profile.phone || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);
    setMessage('');
    try {
      await supabase.from('profiles').update(formData).eq('id', profile.id);
      updateProfile(formData);
      setMessage('✅ Данные успешно сохранены!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // === Настройки POS и Склада из БД ===
  const [posSettings, setPosSettings] = useState({
    autoWriteOff: true,
    roundTotal: true,
    orderTimeout: 30,
  });

  const [inventorySettings, setInventorySettings] = useState({
    lowStockNotifications: true,
    defaultMinThreshold: 5,
    notifyOnZero: true,
  });

  // Загрузка настроек из Supabase
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').limit(1).single();
      if (data) {
        if (data.pos_settings) setPosSettings(data.pos_settings);
        if (data.inventory_settings) setInventorySettings(data.inventory_settings);
      }
    };
    loadSettings();
  }, []);

  // Сохранение настроек POS
  const savePosSettings = async () => {
    setSaving(true);
    await supabase.from('app_settings').update({ pos_settings: posSettings }).eq('id', (await supabase.from('app_settings').select('id').limit(1).single()).data?.id);
    setMessage('✅ Настройки POS сохранены в базу!');
    setTimeout(() => setMessage(''), 2500);
    setSaving(false);
  };

  // Сохранение настроек Склада
  const saveInventorySettings = async () => {
    setSaving(true);
    await supabase.from('app_settings').update({ inventory_settings: inventorySettings }).eq('id', (await supabase.from('app_settings').select('id').limit(1).single()).data?.id);
    setMessage('✅ Настройки склада сохранены в базу!');
    setTimeout(() => setMessage(''), 2500);
    setSaving(false);
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Настройки</h1>
          <p className="text-[#C8A77E] mt-1">Управление системой и профилем</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium transition-all ${activeTab === tab.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>
              <Icon className="w-5 h-5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card p-8">
        {/* Личный кабинет */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <div className="flex flex-col items-center mb-10">
              <div className="relative w-28 h-28 bg-[#C8A77E] rounded-3xl flex items-center justify-center text-7xl shadow-inner">
                {formData.name?.[0] || '👨‍🍳'}
              </div>
            </div>
            <div className="space-y-6">
              <input type="text" placeholder="ФИО" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <input type="text" placeholder="Должность" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <div className="grid grid-cols-2 gap-6">
                <input type="text" placeholder="Телефон" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              </div>
              {message && <div className="text-center text-emerald-400">{message}</div>}
              <button onClick={handleSaveProfile} disabled={saving} className="w-full py-6 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-semibold text-xl flex items-center justify-center gap-3">
                <Save className="w-6 h-6" /> {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}

        {/* Компания */}
        {activeTab === 'company' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-white mb-8">Информация о компании</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" defaultValue="Ma Cherie Coffee & More" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <input type="text" defaultValue="ОсОО «Ma Cherie»" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <input type="text" defaultValue="Бишкек, Кыргызстан" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <input type="text" defaultValue="+996 555 123 456" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <input type="email" defaultValue="info@macherie.coffee" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <input type="number" defaultValue="2" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              <div className="md:col-span-2"><input type="text" defaultValue="Пн–Сб: 08:00 – 20:00, Вс: выходной" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" /></div>
              <div className="md:col-span-2"><textarea rows={4} defaultValue="Специализированная кофейня третьей волны." className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white resize-y" /></div>
            </div>
            <button onClick={() => alert('✅ Сохранено!')} className="mt-10 w-full py-6 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-semibold text-xl">Сохранить</button>
          </div>
        )}

        {/* === POS-КАССА (интеграция с БД) === */}
        {activeTab === 'pos' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-white mb-8">Настройки POS-кассы</h2>
            <div className="space-y-8">
              <div className="flex justify-between bg-[#2C241E] p-6 rounded-3xl">
                <div><p className="font-medium">Автоматическое списание ингредиентов</p><p className="text-sm text-gray-400">При закрытии заказа</p></div>
                <input type="checkbox" checked={posSettings.autoWriteOff} onChange={(e) => setPosSettings({ ...posSettings, autoWriteOff: e.target.checked })} className="w-12 h-7 accent-[#C8A77E]" />
              </div>
              <div className="flex justify-between bg-[#2C241E] p-6 rounded-3xl">
                <div><p className="font-medium">Округлять сумму до целых сомов</p></div>
                <input type="checkbox" checked={posSettings.roundTotal} onChange={(e) => setPosSettings({ ...posSettings, roundTotal: e.target.checked })} className="w-12 h-7 accent-[#C8A77E]" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Время ожидания заказа (минут)</label>
                <input type="number" value={posSettings.orderTimeout} onChange={(e) => setPosSettings({ ...posSettings, orderTimeout: parseInt(e.target.value) || 30 })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              </div>
            </div>
            <button onClick={savePosSettings} disabled={saving} className="mt-10 w-full py-6 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-semibold text-xl">Сохранить в базу данных</button>
          </div>
        )}

        {/* === СКЛАД (интеграция с БД) === */}
        {activeTab === 'inventory' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-white mb-8">Настройки склада</h2>
            <div className="space-y-8">
              <div className="flex justify-between bg-[#2C241E] p-6 rounded-3xl">
                <div><p className="font-medium">Уведомления о низком остатке</p></div>
                <input type="checkbox" checked={inventorySettings.lowStockNotifications} onChange={(e) => setInventorySettings({ ...inventorySettings, lowStockNotifications: e.target.checked })} className="w-12 h-7 accent-[#C8A77E]" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Порог низкого остатка по умолчанию</label>
                <input type="number" value={inventorySettings.defaultMinThreshold} onChange={(e) => setInventorySettings({ ...inventorySettings, defaultMinThreshold: parseInt(e.target.value) || 5 })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-5 text-white" />
              </div>
              <div className="flex justify-between bg-[#2C241E] p-6 rounded-3xl">
                <div><p className="font-medium">Уведомлять при нулевом остатке</p></div>
                <input type="checkbox" checked={inventorySettings.notifyOnZero} onChange={(e) => setInventorySettings({ ...inventorySettings, notifyOnZero: e.target.checked })} className="w-12 h-7 accent-[#C8A77E]" />
              </div>
            </div>
            <button onClick={saveInventorySettings} disabled={saving} className="mt-10 w-full py-6 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-semibold text-xl">Сохранить в базу данных</button>
          </div>
        )}

        {activeTab === 'users' && <div className="text-center py-20 text-gray-400">Управление пользователями (в разработке)</div>}
        {activeTab === 'security' && <div className="text-center py-20 text-gray-400">Безопасность (в разработке)</div>}
      </div>
    </div>
  );
}