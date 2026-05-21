'use client';

import { useState } from 'react';
import { Truck, Plus, Search, Edit2 } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  lastDelivery: string;
  totalDeliveries: number;
}

interface Delivery {
  id: number;
  supplierId: number;
  date: string;
  items: string;
  total: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 1, name: 'Кофейный Импорт KG', contact: 'Азамат', phone: '+996 555 777 111', lastDelivery: '20.05.2026', totalDeliveries: 12 },
    { id: 2, name: 'Молочная Ферма "Ак-Мар"', contact: 'Гульмира', phone: '+996 700 222 333', lastDelivery: '21.05.2026', totalDeliveries: 8 },
    { id: 3, name: 'Мясной Двор', contact: 'Нурлан', phone: '+996 555 444 555', lastDelivery: '19.05.2026', totalDeliveries: 15 },
  ]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');

  // Модальное окно новой поставки
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    date: new Date().toISOString().split('T')[0],
    items: '',
    total: 0,
  });

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const supplierDeliveries = deliveries.filter(d => d.supplierId === selectedSupplier?.id);

  const handleRowClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleAddDelivery = () => {
    if (!selectedSupplier || !newDelivery.items.trim()) return;

    const newDel: Delivery = {
      id: Date.now(),
      supplierId: selectedSupplier.id,
      date: newDelivery.date,
      items: newDelivery.items,
      total: newDelivery.total,
    };

    setDeliveries([newDel, ...deliveries]);

    // Обновляем информацию у поставщика
    setSuppliers(suppliers.map(s => {
      if (s.id === selectedSupplier.id) {
        return {
          ...s,
          lastDelivery: newDelivery.date,
          totalDeliveries: s.totalDeliveries + 1,
        };
      }
      return s;
    }));

    // Сброс формы
    setNewDelivery({ date: new Date().toISOString().split('T')[0], items: '', total: 0 });
    setIsDeliveryModalOpen(false);
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Поставщики</h1>
          <p className="text-[#C8A77E] mt-1">Нажми на поставщика → история появляется снизу</p>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C8A77E] w-5 h-5" />
        <input
          type="text"
          placeholder="Поиск поставщика..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-5 bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl text-white placeholder:text-gray-400"
        />
      </div>

      {/* Таблица поставщиков */}
      <div className="card overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5C4030]">
              <th className="text-left p-6 font-medium text-[#C8A77E]">Поставщик</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Контакт</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Телефон</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Последняя поставка</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Всего поставок</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr
                key={supplier.id}
                onClick={() => handleRowClick(supplier)}
                className={`border-b border-[#5C4030] hover:bg-[#3F2A1F]/70 transition-colors cursor-pointer ${selectedSupplier?.id === supplier.id ? 'bg-[#3F2A1F]/80' : ''}`}
              >
                <td className="p-6 font-medium text-white">{supplier.name}</td>
                <td className="p-6 text-gray-300">{supplier.contact}</td>
                <td className="p-6 text-gray-300">{supplier.phone}</td>
                <td className="p-6 text-gray-400">{supplier.lastDelivery}</td>
                <td className="p-6 font-mono text-white">{supplier.totalDeliveries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* История поставок */}
      {selectedSupplier && (
        <div className="card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              История поставок — <span className="text-[#C8A77E]">{selectedSupplier.name}</span>
            </h2>

            {/* Работающая кнопка */}
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="btn-primary flex items-center gap-3 px-8 py-4"
            >
              <Plus className="w-6 h-6" />
              Новая поставка
            </button>
          </div>

          <div className="space-y-4">
            {supplierDeliveries.length === 0 ? (
              <p className="text-gray-400 py-12 text-center">Пока нет поставок от этого поставщика</p>
            ) : (
              supplierDeliveries.map((del) => (
                <div key={del.id} className="flex justify-between items-center bg-[#2C241E] p-5 rounded-3xl">
                  <div>
                    <div className="text-sm text-gray-400">{del.date}</div>
                    <div className="text-white mt-1">{del.items}</div>
                  </div>
                  <div className="font-semibold text-xl text-white">
                    {del.total.toLocaleString('ru-RU')} с
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!selectedSupplier && (
        <div className="text-center py-16 text-gray-400">
          Выберите поставщика в таблице выше, чтобы увидеть историю поставок
        </div>
      )}

      {/* Модальное окно новой поставки */}
      {isDeliveryModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">Новая поставка</h2>
            <p className="text-[#C8A77E] mb-6">{selectedSupplier.name}</p>

            <div className="space-y-6">
              <input
                type="date"
                value={newDelivery.date}
                onChange={(e) => setNewDelivery({ ...newDelivery, date: e.target.value })}
                className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
              />

              <textarea
                placeholder="Что поставили (через запятую)"
                value={newDelivery.items}
                onChange={(e) => setNewDelivery({ ...newDelivery, items: e.target.value })}
                className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white h-28"
              />

              <input
                type="number"
                placeholder="Сумма поставки"
                value={newDelivery.total}
                onChange={(e) => setNewDelivery({ ...newDelivery, total: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
              />
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleAddDelivery}
                className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium"
              >
                Добавить поставку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}