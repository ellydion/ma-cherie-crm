'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Coffee, Utensils, GlassWater, Cake, ChefHat } from 'lucide-react';
import { useProductsStore } from '@/lib/store/productsStore';

export default function ProductsPage() {
  const { products, addProduct, updateProduct } = useProductsStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'coffee' | 'kitchen' | 'drinks' | 'desserts'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<any>(null);

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveProduct = (product: any) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product);
    } else {
      addProduct(product);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  function handleSave(arg0: { name: string; category: any; price: number; }) {
    throw new Error('Function not implemented.');
  }

  return (
    <div>
      {/* Категории */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setActiveCategory('all')} className={`px-8 py-4 rounded-3xl font-medium ${activeCategory === 'all' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Все товары</button>
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
        {filteredProducts.map((product: any) => (
          <div key={product.id} className="card p-6 hover:scale-105 transition-all cursor-pointer" onClick={() => setSelectedProductForRecipe(product)}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white text-xl">{product.name}</p>
                <p className="text-[#C8A77E] text-sm mt-1 capitalize">{product.category}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProduct(product);
                  setIsModalOpen(true);
                }}
              >
                <Edit2 className="w-5 h-5 text-[#C8A77E]" />
              </button>
            </div>
            <p className="text-4xl font-mono text-[#C8A77E] mt-8">{product.price} с</p>
          </div>
        ))}
      </div>

      {/* Модальное окно редактирования товара */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingProduct ? 'Редактировать товар' : 'Новый товар'}
            </h2>
            <div className="space-y-6">
              <input id="name" type="text" defaultValue={editingProduct?.name} placeholder="Название товара" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Категория</label>
                  <select id="category" defaultValue={editingProduct?.category} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                    <option value="coffee">Кофейня</option>
                    <option value="kitchen">Кухня</option>
                    <option value="drinks">Напитки</option>
                    <option value="desserts">Десерты</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Цена (сом)</label>
                  <input id="price" type="number" defaultValue={editingProduct?.price} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={() => {
                const name = (document.getElementById('name') as HTMLInputElement).value;
                const category = (document.getElementById('category') as HTMLSelectElement).value as any;
                const price = parseInt((document.getElementById('price') as HTMLInputElement).value) || 0;
                handleSave({ name, category, price });
              }} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно рецептуры */}
      {selectedProductForRecipe && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <ChefHat className="w-6 h-6" />
                {selectedProductForRecipe.name}
              </h2>
              <button onClick={() => setSelectedProductForRecipe(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <p className="text-[#C8A77E] mb-6">Рецептура / Техкарта</p>
            <p className="text-gray-400 text-sm">Пока рецептура не заполнена. В следующих шагах мы добавим возможность привязывать ингредиенты из склада.</p>
            <button onClick={() => setSelectedProductForRecipe(null)} className="mt-8 w-full py-4 rounded-3xl border border-[#5C4030] text-white">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}