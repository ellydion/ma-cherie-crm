'use client';

import { useState } from 'react';
import { Users, Plus, Search, Crown, Trophy, Edit2 } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  loyaltyLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  totalSpent: number;
  lastVisit: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: 'Айжан Султанова', phone: '+996 555 123 456', loyaltyLevel: 'Gold', points: 2450, totalSpent: 12480, lastVisit: '21.05.2026' },
    { id: 2, name: 'Бекзат Турдубаев', phone: '+996 777 987 654', loyaltyLevel: 'Silver', points: 890, totalSpent: 5670, lastVisit: '20.05.2026' },
    { id: 3, name: 'Мария Иванова', phone: '+996 700 555 333', loyaltyLevel: 'Platinum', points: 4120, totalSpent: 28900, lastVisit: '22.05.2026' },
    { id: 4, name: 'Эмир Асанов', phone: '+996 555 111 222', loyaltyLevel: 'Bronze', points: 320, totalSpent: 1890, lastVisit: '18.05.2026' },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const loyaltyColors: Record<string, string> = {
    Bronze: 'bg-amber-700 text-white',
    Silver: 'bg-gray-400 text-white',
    Gold: 'bg-[#C8A77E] text-[#3F2A1F]',
    Platinum: 'bg-[#3F2A1F] text-white',
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (customer: Customer) => {
    if (editingCustomer) {
      // Редактирование
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
    } else {
      // Добавление нового
      setCustomers([...customers, { ...customer, id: Date.now() }]);
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Клиенты</h1>
          <p className="text-[#C8A77E] mt-1">Программа лояльности • {customers.length} клиентов</p>
        </div>

        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
        >
          <Plus className="w-6 h-6" />
          Добавить клиента
        </button>
      </div>

      {/* Поиск */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C8A77E] w-5 h-5" />
        <input
          type="text"
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-5 bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl text-white placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Таблица */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5C4030]">
              <th className="text-left p-6 font-medium text-[#C8A77E]">Клиент</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Телефон</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Уровень</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Баллы</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Потрачено</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Последний визит</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70 transition-colors">
                <td className="p-6 font-medium text-white">{customer.name}</td>
                <td className="p-6 text-gray-300">{customer.phone}</td>
                <td className="p-6">
                  <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-3xl text-sm font-semibold ${loyaltyColors[customer.loyaltyLevel]}`}>
                    {customer.loyaltyLevel === 'Platinum' && <Crown className="w-4 h-4" />}
                    {customer.loyaltyLevel === 'Gold' && <Trophy className="w-4 h-4" />}
                    {customer.loyaltyLevel}
                  </span>
                </td>
                <td className="p-6 font-mono text-2xl font-semibold text-white">{customer.points}</td>
                <td className="p-6 font-medium text-white">{customer.totalSpent.toLocaleString('ru-RU')} с</td>
                <td className="p-6 text-gray-400">{customer.lastVisit}</td>
                <td className="p-6">
                  <button onClick={() => openEditModal(customer)} className="p-3 hover:bg-[#5C4030] rounded-2xl transition-colors">
                    <Edit2 className="w-5 h-5 text-[#C8A77E]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно добавления / редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingCustomer ? 'Редактировать клиента' : 'Добавить клиента'}
            </h2>

            <div className="space-y-6">
              <input
                type="text"
                placeholder="Имя клиента"
                defaultValue={editingCustomer?.name}
                className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                id="name"
              />
              <input
                type="tel"
                placeholder="Телефон"
                defaultValue={editingCustomer?.phone}
                className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                id="phone"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Уровень лояльности</label>
                  <select id="level" defaultValue={editingCustomer?.loyaltyLevel || 'Bronze'} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Баллы</label>
                  <input type="number" id="points" defaultValue={editingCustomer?.points || 0} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white font-medium"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById('name') as HTMLInputElement).value;
                  const phone = (document.getElementById('phone') as HTMLInputElement).value;
                  const level = (document.getElementById('level') as HTMLSelectElement).value as any;
                  const points = parseInt((document.getElementById('points') as HTMLInputElement).value) || 0;

                  handleSaveCustomer({
                    id: editingCustomer?.id || 0,
                    name,
                    phone,
                    loyaltyLevel: level,
                    points,
                    totalSpent: editingCustomer?.totalSpent || 0,
                    lastVisit: editingCustomer?.lastVisit || new Date().toLocaleDateString('ru-RU'),
                  });
                }}
                className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium"
              >
                {editingCustomer ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}