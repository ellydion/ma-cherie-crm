'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyalty_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  total_spent: number;
  last_visit: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) console.error(error);
    else setCustomers(data || []);
    setLoading(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSave = async (customerData: any) => {
    if (editingCustomer) {
      await supabase
        .from('customers')
        .update({
          name: customerData.name,
          phone: customerData.phone,
          loyalty_level: customerData.loyalty_level,
          points: customerData.points,
          total_spent: customerData.total_spent
        })
        .eq('id', editingCustomer.id);
    } else {
      await supabase
        .from('customers')
        .insert([{
          name: customerData.name,
          phone: customerData.phone,
          loyalty_level: customerData.loyalty_level || 'Bronze',
          points: customerData.points || 0,
          total_spent: customerData.total_spent || 0
        }]);
    }
    fetchCustomers();
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const getLoyaltyColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'bg-purple-600';
      case 'Gold': return 'bg-yellow-600';
      case 'Silver': return 'bg-gray-400';
      default: return 'bg-amber-600';
    }
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка клиентов...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Клиенты</h1>
          <p className="text-[#C8A77E] mt-1">Программа лояльности</p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-3 px-8 py-4"
        >
          <Plus className="w-6 h-6" />
          Новый клиент
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-5 mb-8 text-white placeholder:text-gray-400"
      />

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
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70 cursor-pointer" onClick={() => {
                setEditingCustomer(customer);
                setIsModalOpen(true);
              }}>
                <td className="p-6 font-medium text-white">{customer.name}</td>
                <td className="p-6 text-gray-300">{customer.phone}</td>
                <td className="p-6">
                  <span className={`inline-flex px-6 py-2 rounded-3xl text-sm font-medium text-white ${getLoyaltyColor(customer.loyalty_level)}`}>
                    {customer.loyalty_level}
                  </span>
                </td>
                <td className="p-6 font-mono text-emerald-400">{customer.points}</td>
                <td className="p-6 font-mono">{customer.total_spent} с</td>
                <td className="p-6 text-gray-400">{customer.last_visit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingCustomer ? 'Редактировать клиента' : 'Новый клиент'}
            </h2>
            <div className="space-y-6">
              <input id="name" type="text" defaultValue={editingCustomer?.name} placeholder="ФИО" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <input id="phone" type="text" defaultValue={editingCustomer?.phone} placeholder="+996 ___ ___ ___" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Уровень лояльности</label>
                  <select id="loyalty_level" defaultValue={editingCustomer?.loyalty_level} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Баллы</label>
                  <input id="points" type="number" defaultValue={editingCustomer?.points} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Всего потрачено (сом)</label>
                <input id="total_spent" type="number" defaultValue={editingCustomer?.total_spent} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={() => {
                const name = (document.getElementById('name') as HTMLInputElement).value;
                const phone = (document.getElementById('phone') as HTMLInputElement).value;
                const loyalty_level = (document.getElementById('loyalty_level') as HTMLSelectElement).value;
                const points = parseInt((document.getElementById('points') as HTMLInputElement).value) || 0;
                const total_spent = parseFloat((document.getElementById('total_spent') as HTMLInputElement).value) || 0;
                handleSave({ name, phone, loyalty_level, points, total_spent });
              }} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}