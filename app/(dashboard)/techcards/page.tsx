'use client';

import { useState, useEffect } from 'react';
import { Plus, ChefHat, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface TechCard {
  id: string;
  name: string;
  category: string;
  yield: number;
  cost_price: number;
}

interface Ingredient {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
}

export default function TechcardsPage() {
  const [techcards, setTechcards] = useState<TechCard[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // только ингредиенты
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<TechCard | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'coffee',
    yield: 300,
    cost_price: 0
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ingredientQty, setIngredientQty] = useState(1);

  useEffect(() => {
    fetchTechcards();
    fetchIngredientsProducts();
  }, []);

  const fetchTechcards = async () => {
    const { data } = await supabase.from('techcards').select('*').order('name');
    if (data) setTechcards(data);
    setLoading(false);
  };

  // Загружаем ТОЛЬКО товары, которые отмечены как ингредиенты
  const fetchIngredientsProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, unit')
      .eq('is_ingredient', true)
      .order('name');
    if (data) setProducts(data);
  };

  const fetchIngredients = async (techcardId: string) => {
    const { data } = await supabase
      .from('techcard_ingredients')
      .select(`
        id,
        quantity,
        products (id, name, unit)
      `)
      .eq('techcard_id', techcardId);

    if (data) {
      const formatted = data.map((row: any) => ({
        id: row.id,
        product_id: row.products.id,
        product_name: row.products.name,
        quantity: row.quantity,
        unit: row.products.unit
      }));
      setIngredients(formatted);
    }
  };

  const filteredTechcards = techcards.filter(card =>
    card.name.toLowerCase().includes(search.toLowerCase())
  );

  // === ИСПРАВЛЕННАЯ КНОПКА ДОБАВИТЬ ===
  const addIngredient = () => {
    if (!selectedProductId) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (ingredients.some(i => i.product_id === selectedProductId)) {
      alert('Этот ингредиент уже добавлен');
      return;
    }

    setIngredients([
      ...ingredients,
      {
        product_id: selectedProductId,
        product_name: product.name,
        quantity: ingredientQty,
        unit: product.unit
      }
    ]);

    setSelectedProductId('');
    setIngredientQty(1);
  };

  const removeIngredient = (productId: string) => {
    setIngredients(ingredients.filter(i => i.product_id !== productId));
  };

  const openModal = async (card?: TechCard) => {
    if (card) {
      setEditingCard(card);
      setForm({
        name: card.name,
        category: card.category,
        yield: card.yield,
        cost_price: card.cost_price
      });
      await fetchIngredients(card.id);
    } else {
      setEditingCard(null);
      setForm({ name: '', category: 'coffee', yield: 300, cost_price: 0 });
      setIngredients([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      alert('Название техкарты обязательно');
      return;
    }

    let techcardId = editingCard?.id;

    if (editingCard) {
      await supabase.from('techcards').update(form).eq('id', editingCard.id);
    } else {
      const { data, error } = await supabase
        .from('techcards')
        .insert([form])
        .select()
        .single();

      if (error || !data) {
        alert('Ошибка создания техкарты');
        return;
      }
      techcardId = data.id;
    }

    if (editingCard) {
      await supabase.from('techcard_ingredients').delete().eq('techcard_id', techcardId);
    }

    if (ingredients.length > 0 && techcardId) {
      const ingredientsToInsert = ingredients.map(ing => ({
        techcard_id: techcardId,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit: ing.unit
      }));
      await supabase.from('techcard_ingredients').insert(ingredientsToInsert);
    }

    setIsModalOpen(false);
    fetchTechcards();
    setIngredients([]);
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка техкарт...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Техкарты</h1>
          <p className="text-[#C8A77E] mt-1">Рецептуры • Ингредиенты со склада</p>
        </div>

        <button onClick={() => openModal()} className="btn-primary flex items-center gap-3 px-8 py-4">
          <Plus className="w-6 h-6" /> Новая техкарта
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
          <div key={card.id} onClick={() => openModal(card)} className="card p-6 hover:scale-105 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white text-xl">{card.name}</p>
                <p className="text-[#C8A77E] text-sm capitalize mt-1">{card.category}</p>
              </div>
              <ChefHat className="w-8 h-8 text-[#C8A77E]" />
            </div>
            <div className="mt-6">
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
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingCard ? 'Редактировать техкарту' : 'Новая техкарта'}
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Название</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Категория</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                  <option value="coffee">Кофейня</option>
                  <option value="kitchen">Кухня</option>
                  <option value="drinks">Напитки</option>
                  <option value="desserts">Десерты</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Выход (г/мл)</label>
                <input type="number" value={form.yield} onChange={(e) => setForm({ ...form, yield: parseFloat(e.target.value) || 0 })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Себестоимость (сом)</label>
                <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
            </div>

            {/* Ингредиенты */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Ингредиенты (выбираются только из Склада)</h3>

              <div className="flex gap-4 mb-6">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                >
                  <option value="">Выберите ингредиент со склада</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={ingredientQty}
                  onChange={(e) => setIngredientQty(parseFloat(e.target.value) || 1)}
                  className="w-32 bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
                />
                <button onClick={addIngredient} className="px-8 py-4 bg-[#C8A77E] text-[#3F2A1F] rounded-3xl font-medium">
                  Добавить
                </button>
              </div>

              {ingredients.length > 0 && (
                <div className="space-y-3 mb-6">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="flex justify-between items-center bg-[#2C241E] px-6 py-4 rounded-3xl">
                      <div>
                        <span className="text-white">{ing.product_name}</span>
                        <span className="text-gray-400 ml-3">— {ing.quantity} {ing.unit}</span>
                      </div>
                      <button onClick={() => removeIngredient(ing.product_id)} className="text-red-400 hover:text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => { setIsModalOpen(false); setIngredients([]); setEditingCard(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={handleSave} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить техкарту</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}