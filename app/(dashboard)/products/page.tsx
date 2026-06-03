'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Coffee, Utensils, GlassWater, Cake } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: 'coffee' | 'kitchen' | 'drinks' | 'desserts';
  unit: string;
  section: 'coffee' | 'kitchen';
  is_ingredient: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'coffee' | 'kitchen' | 'drinks' | 'desserts'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) console.error(error);
    else setProducts(data || []);
    setLoading(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const name = (document.getElementById('name') as HTMLInputElement).value;
    const section = (document.getElementById('section') as HTMLSelectElement).value as 'coffee' | 'kitchen';
    const unit = (document.getElementById('unit') as HTMLInputElement).value || 'шт';
    const price = parseFloat((document.getElementById('price') as HTMLInputElement).value) || 0;
    const is_ingredient = (document.getElementById('is_ingredient') as HTMLInputElement).checked;

    if (!name) {
      alert('Название обязательно');
      return;
    }

    const productData = {
      name,
      section,
      unit,
      price,
      category: section,
      is_ingredient,
    };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([productData]);
    }

    fetchProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка товаров...</p>;

  return (
    <div>
      {/* Кнопка Добавить товар */}
      <div className="flex justify-end mb-6">
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-3 px-8 py-4">
          <Plus className="w-6 h-6" /> Добавить товар
        </button>
      </div>

      {/* Фильтры категорий */}
      <div className="flex gap-2 mb-6 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setActiveCategory('all')} className={`px-8 py-4 rounded-3xl font-medium ${activeCategory === 'all' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Все</button>
        <button onClick={() => setActiveCategory('coffee')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'coffee' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Coffee /> Кофейня</button>
        <button onClick={() => setActiveCategory('kitchen')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'kitchen' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Utensils /> Кухня</button>
        <button onClick={() => setActiveCategory('drinks')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'drinks' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><GlassWater /> Напитки</button>
        <button onClick={() => setActiveCategory('desserts')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'desserts' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Cake /> Десерты</button>
      </div>

      {/* Поиск */}
      <input
        type="text"
        placeholder="Поиск товара..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-5 mb-8 text-white placeholder:text-gray-400"
      />

      {/* Карточки товаров */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => openModal(product)}
            className="card p-6 hover:scale-105 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white text-xl">{product.name}</p>
                <p className="text-[#C8A77E] text-sm mt-1 capitalize">{product.category}</p>
              </div>
              <Edit2 className="w-5 h-5 text-[#C8A77E]" />
            </div>

            <div className="mt-8 flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-400">Цена</p>
                <p className="text-4xl font-mono text-[#C8A77E]">{product.price} с</p>
              </div>

              {product.is_ingredient && (
                <span className="px-4 py-1.5 text-xs rounded-3xl bg-emerald-600 text-white font-medium">
                  Ингредиент
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingProduct ? 'Редактировать товар' : 'Новый товар'}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Название</label>
                <input id="name" type="text" defaultValue={editingProduct?.name} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Секция</label>
                  <select id="section" defaultValue={editingProduct?.section} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                    <option value="coffee">Кофейня</option>
                    <option value="kitchen">Кухня</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Ед. измерения</label>
                  <input id="unit" type="text" defaultValue={editingProduct?.unit || 'шт'} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Цена (сом)</label>
                <input id="price" type="number" defaultValue={editingProduct?.price} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="is_ingredient"
                  type="checkbox"
                  defaultChecked={editingProduct?.is_ingredient}
                  className="w-5 h-5 accent-[#C8A77E]"
                />
                <label htmlFor="is_ingredient" className="text-white cursor-pointer">
                  Это ингредиент склада
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={handleSave} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}