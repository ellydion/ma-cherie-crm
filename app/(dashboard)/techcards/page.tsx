'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, ChefHat, Trash2 } from 'lucide-react';
import { useProductsStore } from '@/lib/store/productsStore';

interface TechCardIngredient {
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number; // цена за единицу измерения
}

interface TechCard {
  id: number;
  name: string;
  category: 'coffee' | 'kitchen' | 'drinks' | 'desserts';
  ingredients: TechCardIngredient[];
  yield: number; // выход в граммах/мл
  costPrice: number; // автоматическая себестоимость
}

export default function TechcardsPage() {
  const { products } = useProductsStore();

  const [techcards, setTechcards] = useState<TechCard[]>([
    {
      id: 1,
      name: 'Латте',
      category: 'coffee',
      ingredients: [
        { productId: 999, name: 'Кофе в зёрнах', quantity: 18, unit: 'г', costPerUnit: 4.5 },
        { productId: 2, name: 'Молоко 3.2%', quantity: 240, unit: 'мл', costPerUnit: 0.45 },
      ],
      yield: 300,
      costPrice: 128,
    },
  ]);

  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<TechCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCard, setNewCard] = useState<Partial<TechCard>>({
    name: '',
    category: 'coffee',
    ingredients: [],
    yield: 300,
  });

  const filteredCards = techcards.filter(card =>
    card.name.toLowerCase().includes(search.toLowerCase())
  );

  // Автоматический расчёт себестоимости
  const calculateCostPrice = (ingredients: TechCardIngredient[]) => {
    return ingredients.reduce((total, ing) => total + (ing.quantity * ing.costPerUnit), 0);
  };

  const handleSaveTechcard = () => {
    if (!newCard.name) return;

    const costPrice = calculateCostPrice(newCard.ingredients || []);

    const card: TechCard = {
      id: Date.now(),
      name: newCard.name!,
      category: newCard.category!,
      ingredients: newCard.ingredients || [],
      yield: newCard.yield || 300,
      costPrice: Math.round(costPrice),
    };

    setTechcards([...techcards, card]);
    setIsModalOpen(false);
    setNewCard({ name: '', category: 'coffee', ingredients: [], yield: 300 });
  };

  const addIngredientToNewCard = (product: any) => {
    const existing = newCard.ingredients?.find((i: any) => i.productId === product.id);
    if (existing) return;

    const newIngredient: TechCardIngredient = {
      productId: product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit || 'г',
      costPerUnit: product.price / 10 || 5, // примерная цена за единицу
    };

    setNewCard({
      ...newCard,
      ingredients: [...(newCard.ingredients || []), newIngredient],
    });
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Техкарты</h1>
          <p className="text-[#C8A77E] mt-1">Рецептуры с автоматическим расчётом себестоимости</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-3 px-8 py-4"
        >
          <Plus className="w-6 h-6" />
          Новая техкарта
        </button>
      </div>

      {/* Поиск */}
      <input
        type="text"
        placeholder="Поиск техкарты..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-5 mb-8 text-white"
      />

      {/* Сетка техкарт */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="card p-6 hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-white text-xl">{card.name}</p>
                <p className="text-[#C8A77E] text-sm capitalize">{card.category}</p>
              </div>
              <ChefHat className="w-8 h-8 text-[#C8A77E]" />
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-400">Себестоимость</p>
              <p className="text-4xl font-mono text-emerald-400">{card.costPrice} с</p>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно создания новой техкарты */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">Новая техкарта</h2>

            <input
              type="text"
              placeholder="Название блюда / напитка"
              value={newCard.name || ''}
              onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
              className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 mb-6 text-white"
            />

            {/* Выбор категории */}
            <select
              value={newCard.category}
              onChange={(e) => setNewCard({ ...newCard, category: e.target.value as any })}
              className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 mb-6 text-white"
            >
              <option value="coffee">Кофейня</option>
              <option value="kitchen">Кухня</option>
              <option value="drinks">Напитки</option>
              <option value="desserts">Десерты</option>
            </select>

            {/* Добавление ингредиентов */}
            <h3 className="text-white font-medium mb-3">Ингредиенты</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {products.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => addIngredientToNewCard(product)}
                  className="bg-[#2C241E] hover:bg-[#3F2A1F] p-4 rounded-3xl text-left transition-all"
                >
                  <p className="text-white">{product.name}</p>
                  <p className="text-[#C8A77E] text-sm">{product.price} с / ед.</p>
                </button>
              ))}
            </div>

            {/* Список выбранных ингредиентов */}
            <div className="space-y-3 mb-8">
              {newCard.ingredients?.map((ing: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-[#2C241E] p-4 rounded-3xl">
                  <span className="text-white">{ing.name}</span>
                  <span className="text-gray-400">{ing.quantity} {ing.unit}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={handleSaveTechcard} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить техкарту</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}