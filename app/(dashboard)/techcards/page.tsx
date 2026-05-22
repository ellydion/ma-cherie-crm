'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, ChefHat, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface TechCard {
  id: string;
  name: string;
  category: string;
  yield: number;
  cost_price: number;
}

export default function TechcardsPage() {
  const [techcards, setTechcards] = useState<TechCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<TechCard | null>(null);

  useEffect(() => {
    fetchTechcards();
  }, []);

  const fetchTechcards = async () => {
    const { data, error } = await supabase
      .from('techcards')
      .select('*')
      .order('name');

    if (error) console.error(error);
    else setTechcards(data || []);
    setLoading(false);
  };

  const filteredTechcards = techcards.filter(card =>
    card.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (cardData: any) => {
    if (editingCard) {
      await supabase
        .from('techcards')
        .update({
          name: cardData.name,
          category: cardData.category,
          yield: cardData.yield,
          cost_price: cardData.cost_price
        })
        .eq('id', editingCard.id);
    } else {
      await supabase
        .from('techcards')
        .insert([{
          name: cardData.name,
          category: cardData.category,
          yield: cardData.yield,
          cost_price: cardData.cost_price
        }]);
    }
    fetchTechcards();
    setIsModalOpen(false);
    setEditingCard(null);
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка техкарт...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Техкарты</h1>
          <p className="text-[#C8A77E] mt-1">Рецептуры и себестоимость</p>
        </div>

        <button
          onClick={() => {
            setEditingCard(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-3 px-8 py-4"
        >
          <Plus className="w-6 h-6" />
          Новая техкарта
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск техкарты..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-5 mb-8 text-white placeholder:text-gray-400"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTechcards.map((card) => (
          <div
            key={card.id}
            className="card p-6 hover:scale-105 transition-all cursor-pointer"
            onClick={() => {
              setEditingCard(card);
              setIsModalOpen(true);
            }}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-white text-xl">{card.name}</p>
                <p className="text-[#C8A77E] capitalize">{card.category}</p>
              </div>
              <ChefHat className="w-8 h-8 text-[#C8A77E]" />
            </div>
            <div className="mt-8">
              <p className="text-sm text-gray-400">Выход</p>
              <p className="text-3xl font-medium text-white">{card.yield} г/мл</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-400">Себестоимость</p>
              <p className="text-4xl font-mono text-emerald-400">{card.cost_price} с</p>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingCard ? 'Редактировать техкарту' : 'Новая техкарта'}
            </h2>
            <div className="space-y-6">
              <input id="name" type="text" defaultValue={editingCard?.name} placeholder="Название блюда" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Категория</label>
                  <select id="category" defaultValue={editingCard?.category} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                    <option value="coffee">Кофейня</option>
                    <option value="kitchen">Кухня</option>
                    <option value="drinks">Напитки</option>
                    <option value="desserts">Десерты</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Выход (г/мл)</label>
                  <input id="yield" type="number" defaultValue={editingCard?.yield} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Себестоимость (сом)</label>
                <input id="cost_price" type="number" defaultValue={editingCard?.cost_price} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsModalOpen(false); setEditingCard(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={() => {
                const name = (document.getElementById('name') as HTMLInputElement).value;
                const category = (document.getElementById('category') as HTMLSelectElement).value;
                const yieldVal = parseFloat((document.getElementById('yield') as HTMLInputElement).value) || 0;
                const costPrice = parseFloat((document.getElementById('cost_price') as HTMLInputElement).value) || 0;
                handleSave({ name, category, yield: yieldVal, cost_price: costPrice });
              }} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}