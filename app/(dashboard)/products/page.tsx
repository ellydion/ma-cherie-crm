'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Coffee, Utensils, GlassWater, Cake } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: 'coffee' | 'kitchen' | 'drinks' | 'desserts';
  unit: string;
  section: 'coffee' | 'kitchen';
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
      .select('id, name, price, category, unit, section')
      .order('name');

    if (error) console.error('Ошибка загрузки товаров:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSave = async (productData: any) => {
    if (!productData.name?.trim() || !productData.unit?.trim() || !productData.section) {
      alert('Название, единица измерения и секция обязательны!');
      return;
    }

    if (editingProduct) {
      await supabase
        .from('products')
        .update({ 
          name: productData.name, 
          price: productData.price, 
          category: productData.category,
          unit: productData.unit,
          section: productData.section
        })
        .eq('id', editingProduct.id);
    } else {
      await supabase
        .from('products')
        .insert([{ 
          name: productData.name, 
          price: productData.price, 
          category: productData.category,
          unit: productData.unit,
          section: productData.section
        }]);
    }

    fetchProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка товаров...</p>;

  return (
    <div>
      {/* Поиск */}
      <input
        type="text"
        placeholder="Поиск товара..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-5 mb-8 text-white placeholder:text-gray-400"
      />

      {/* Категории */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setActiveCategory('all')} className={`px-8 py-4 rounded-3xl font-medium ${activeCategory === 'all' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Все товары</button>
        <button onClick={() => setActiveCategory('coffee')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'coffee' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Coffee /> Кофейня</button>
        <button onClick={() => setActiveCategory('kitchen')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'kitchen' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Utensils /> Кухня</button>
        <button onClick={() => setActiveCategory('drinks')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'drinks' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><GlassWater /> Напитки</button>
        <button onClick={() => setActiveCategory('desserts')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'desserts' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Cake /> Десерты</button>
      </div>

      {/* Сетка товаров */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredProducts.map((product: any) => (
          <div 
            key={product.id} 
            className="card p-6 hover:scale-105 transition-all cursor-pointer"
            onClick={() => {
              setEditingProduct(product);
              setIsModalOpen(true);
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white text-xl">{product.name}</p>
                <p className="text-[#C8A77E] text-sm mt-1 capitalize">{product.category}</p>
              </div>
              <Edit2 className="w-5 h-5 text-[#C8A77E]" />
            </div>
            <p className="text-4xl font-mono text-[#C8A77E] mt-8">{product.price} с</p>
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
              <input 
                id="name" 
                type="text" 
                defaultValue={editingProduct?.name} 
                placeholder="Название товара" 
                className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" 
              />

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
                  <input 
                    id="unit" 
                    type="text" 
                    defaultValue={editingProduct?.unit || 'шт'} 
                    placeholder="шт, кг, л" 
                    className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Цена (сом)</label>
                <input 
                  id="price" 
                  type="number" 
                  defaultValue={editingProduct?.price} 
                  className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" 
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} 
                className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white"
              >
                Отмена
              </button>
              <button 
                onClick={() => {
                  const name = (document.getElementById('name') as HTMLInputElement).value;
                  const section = (document.getElementById('section') as HTMLSelectElement).value as any;
                  const unit = (document.getElementById('unit') as HTMLInputElement).value || 'шт';
                  const price = parseFloat((document.getElementById('price') as HTMLInputElement).value) || 0;
                  handleSave({ name, category: section, section, price, unit });
                }} 
                className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}