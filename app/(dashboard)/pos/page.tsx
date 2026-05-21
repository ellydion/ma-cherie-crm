'use client';

import { useState } from 'react';
import { Coffee, Utensils, GlassWater, Cake, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useOrdersStore } from '@/lib/store/ordersStore';
import { useProductsStore } from '@/lib/store/productsStore';
import { cn } from '@/lib/utils/cn';

export default function PosPage() {
  const { products } = useProductsStore();
  const addOrder = useOrdersStore((state) => state.addOrder);

  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'coffee' | 'kitchen' | 'drinks' | 'desserts'>('all');
  const [search, setSearch] = useState('');
  const [table, setTable] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [comment, setComment] = useState('');

  const currentOrder = openOrders.find((o: any) => o.id === currentOrderId);

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const createNewOrder = () => {
    const newOrder = {
      id: 'ORD-' + Date.now(),
      table: table || 'Новый',
      items: [],
      comment: '',
      paymentMethod: 'cash' as const,
    };
    setOpenOrders([...openOrders, newOrder]);
    setCurrentOrderId(newOrder.id);
    setTable('');
  };

  const addToCurrentOrder = (product: any) => {
    if (!currentOrder) return;
    const existing = currentOrder.items.find((i: any) => i.id === product.id);
    if (existing) {
      setOpenOrders(openOrders.map((o: any) =>
        o.id === currentOrderId
          ? { ...o, items: o.items.map((i: any) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) }
          : o
      ));
    } else {
      setOpenOrders(openOrders.map((o: any) =>
        o.id === currentOrderId
          ? { ...o, items: [...o.items, { ...product, quantity: 1 }] }
          : o
      ));
    }
  };

  const removeFromOrder = (id: number) => {
    if (!currentOrder) return;
    setOpenOrders(openOrders.map((o: any) =>
      o.id === currentOrderId
        ? { ...o, items: o.items.filter((i: any) => i.id !== id) }
        : o
    ));
  };

  const changeQuantity = (id: number, delta: number) => {
    if (!currentOrder) return;
    setOpenOrders(openOrders.map((o: any) =>
      o.id === currentOrderId
        ? {
            ...o,
            items: o.items.map((i: any) =>
              i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
            )
          }
        : o
    ));
  };

  const subtotal = currentOrder ? currentOrder.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) : 0;

  const closeCurrentOrder = () => {
    if (!currentOrder || currentOrder.items.length === 0) return;

    addOrder({
      items: currentOrder.items.map((i: any) => `${i.name} ×${i.quantity}`),
      total: subtotal,
      table: currentOrder.table || 'Касса',
    });

    setOpenOrders(openOrders.filter((o: any) => o.id !== currentOrderId));
    setCurrentOrderId(openOrders.length > 1 ? openOrders[0].id : null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Касса (POS)</h1>
        <button onClick={createNewOrder} className="btn-primary flex items-center gap-3 px-8 py-4">
          <Plus className="w-6 h-6" />
          Новый заказ
        </button>
      </div>

      {/* Вкладки заказов */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {openOrders.map((order: any) => (
          <button
            key={order.id}
            onClick={() => setCurrentOrderId(order.id)}
            className={cn(
              "px-6 py-3 rounded-3xl font-medium whitespace-nowrap transition-all",
              currentOrderId === order.id ? "bg-[#C8A77E] text-[#3F2A1F]" : "bg-[#3F2A1F] text-white hover:bg-[#5C4030]"
            )}
          >
            {order.table || 'Новый'} • {order.items.length} поз.
          </button>
        ))}
      </div>

      <div className="flex gap-8 flex-1">
        {/* Меню товаров */}
        <div className="flex-1 flex flex-col">
          {/* Категории */}
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
            className="bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-4 mb-6 text-white placeholder:text-gray-400"
          />

          {/* Сетка товаров — теперь с нормальной прокруткой */}
          <div className="grid grid-cols-5 gap-3 flex-1 overflow-auto pr-2">
            {filteredProducts.map((product: any) => (
              <button
                key={product.id}
                onClick={() => currentOrder && addToCurrentOrder(product)}
                className="card h-28 flex flex-col justify-center items-center hover:scale-105 active:scale-95 transition-all p-4 text-center"
              >
                <p className="font-semibold text-white text-base leading-tight">{product.name}</p>
                <p className="text-3xl font-mono text-[#C8A77E] mt-2">{product.price} с</p>
              </button>
            ))}
          </div>
        </div>

        {/* Текущий заказ */}
        <div className="w-96 bg-[#3F2A1F] rounded-3xl p-6 flex flex-col">
          <h2 className="text-2xl font-semibold text-white mb-4">
            {currentOrder ? `Заказ ${currentOrder.table || 'Новый'}` : 'Создайте новый заказ'}
          </h2>

          <div className="flex-1 overflow-auto space-y-2">
            {!currentOrder ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-lg">Нажмите «Новый заказ»</p>
              </div>
            ) : currentOrder.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-lg">Заказ пустой</p>
              </div>
            ) : (
              currentOrder.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between bg-[#2C241E] px-5 py-3 rounded-3xl">
                  <div className="flex-1">
                    <p className="text-white">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => changeQuantity(item.id, -1)} className="text-xl text-gray-400 hover:text-white"><Minus /></button>
                    <span className="font-mono text-white w-8 text-center">{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.id, 1)} className="text-xl text-gray-400 hover:text-white"><Plus /></button>
                    <button onClick={() => removeFromOrder(item.id)} className="text-red-400 hover:text-red-500"><Trash2 /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {currentOrder && (
            <div className="mt-auto pt-6 border-t border-[#5C4030]">
              <div className="flex justify-between text-3xl font-semibold text-white mb-6">
                <span>Итого:</span>
                <span>{subtotal} с</span>
              </div>

              <button
                onClick={closeCurrentOrder}
                disabled={currentOrder.items.length === 0}
                className="w-full py-7 text-2xl font-semibold rounded-3xl bg-[#C8A77E] text-[#3F2A1F] disabled:bg-gray-600 disabled:text-gray-400"
              >
                Закрыть заказ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}