'use client';

import { useState } from 'react';
import { Settings, User, Building2, Receipt, Package, Users, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'Общие', icon: Settings },
    { id: 'company', name: 'Компания', icon: Building2 },
    { id: 'pos', name: 'POS-касса', icon: Receipt },
    { id: 'inventory', name: 'Склад', icon: Package },
    { id: 'users', name: 'Пользователи', icon: Users },
    { id: 'security', name: 'Безопасность', icon: Shield },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Настройки</h1>
          <p className="text-[#C8A77E] mt-1">Управление системой Ma Cherie CRM</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Боковая панель */}
        <div className="w-72 bg-[#3F2A1F] rounded-3xl p-4 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl mb-1 transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-[#C8A77E] text-[#3F2A1F]'
                  : 'text-white hover:bg-[#5C4030]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Основное содержимое */}
        <div className="flex-1 bg-[#3F2A1F] rounded-3xl p-8">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Общие настройки</h2>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Название кофейни</label>
                  <input type="text" defaultValue="Ma Cherie Coffee & More" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Адрес</label>
                  <input type="text" defaultValue="Бишкек, ул. Московская, 123" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                    <input type="tel" defaultValue="+996 555 123 456" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Язык системы</label>
                    <select className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                      <option>Русский</option>
                      <option>Кыргызский</option>
                      <option>Английский</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pos' && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Настройки POS-кассы</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Автоматическое списание со склада</p>
                    <p className="text-sm text-gray-400">При закрытии заказа</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6 accent-[#C8A77E]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Налог по умолчанию (%)</label>
                  <input type="number" defaultValue="5" className="w-32 bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Округление чека</label>
                  <select className="w-full max-w-xs bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                    <option>До целого сома</option>
                    <option>До 10 сомов</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Пользователи и роли</h2>
              <p className="text-gray-400">Здесь можно управлять доступом сотрудников (бармен, повар, менеджер и т.д.)</p>
              {/* Можно расширить позже */}
            </div>
          )}

          {/* Остальные вкладки пока заглушки */}
          {activeTab === 'company' && <p className="text-gray-400 text-xl">Настройки компании (в разработке)</p>}
          {activeTab === 'inventory' && <p className="text-gray-400 text-xl">Настройки склада (в разработке)</p>}
          {activeTab === 'security' && <p className="text-gray-400 text-xl">Безопасность и уведомления (в разработке)</p>}

          <div className="mt-12 text-center text-xs text-gray-500">
            Ma Cherie CRM • Версия 1.0
          </div>
        </div>
      </div>
    </div>
  );
}