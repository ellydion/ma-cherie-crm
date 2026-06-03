'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_threshold: number;
  section: 'coffee' | 'kitchen';
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [form, setForm] = useState({
    name: '',
    unit: 'шт',
    quantity: 0,
    min_threshold: 5,
    section: 'coffee' as 'coffee' | 'kitchen'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  // Загружаем ТОЛЬКО ингредиенты (is_ingredient = true)
  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, unit, quantity, min_threshold, section')
      .eq('is_ingredient', true)
      .order('name');

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (quantity: number, minThreshold: number) => {
    if (quantity <= 0) return { label: 'Отсутствует', color: 'bg-red-600 text-white' };
    if (quantity < minThreshold) return { label: 'Низкий остаток', color: 'bg-amber-600 text-white' };
    return { label: 'В наличии', color: 'bg-emerald-600 text-white' };
  };

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        min_threshold: item.min_threshold,
        section: item.section
      });
    } else {
      setEditingItem(null);
      setForm({
        name: '',
        unit: 'шт',
        quantity: 0,
        min_threshold: 5,
        section: 'coffee'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      alert('Название обязательно');
      return;
    }

    if (editingItem) {
      await supabase.from('products').update(form).eq('id', editingItem.id);
    } else {
      await supabase.from('products').insert([{
        ...form,
        is_ingredient: true,           // ← автоматически помечаем как ингредиент
        price: 0,
        category: form.section
      }]);
    }

    fetchInventory();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить этот ингредиент?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchInventory();
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка склада...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Склад</h1>
          <p className="text-[#C8A77E]">Только ингредиенты для приготовления блюд</p>
        </div>

        <button onClick={() => openModal()} className="btn-primary flex items-center gap-3 px-8 py-4">
          <Plus className="w-6 h-6" /> Добавить ингредиент
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск ингредиента..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-5 mb-8 text-white placeholder:text-gray-400"
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5C4030]">
              <th className="text-left p-6">Ингредиент</th>
              <th className="text-left p-6">Остаток</th>
              <th className="text-left p-6">Ед. изм.</th>
              <th className="text-left p-6">Мин. остаток</th>
              <th className="text-left p-6">Статус</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">
                  Ингредиентов пока нет. Добавьте первый ингредиент.
                </td>
              </tr>
            )}

            {filteredItems.map((item) => {
              const status = getStatus(item.quantity, item.min_threshold);
              return (
                <tr key={item.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70">
                  <td className="p-6 font-medium text-white">{item.name}</td>
                  <td className="p-6 font-mono text-3xl">{item.quantity}</td>
                  <td className="p-6 text-gray-400">{item.unit}</td>
                  <td className="p-6 text-gray-400">{item.min_threshold}</td>
                  <td className="p-6">
                    <span className={`px-5 py-2 rounded-3xl text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="p-6 flex gap-3">
                    <button onClick={() => openModal(item)} className="text-[#C8A77E] hover:text-white">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingItem ? 'Редактировать ингредиент' : 'Новый ингредиент'}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Название</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Ед. измерения</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Мин. остаток</label>
                  <input
                    type="number"
                    value={form.min_threshold}
                    onChange={(e) => setForm({ ...form, min_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Текущий остаток</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Секция</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value as 'coffee' | 'kitchen' })}
                  className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                >
                  <option value="coffee">Кофейня</option>
                  <option value="kitchen">Кухня</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={handleSave} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}