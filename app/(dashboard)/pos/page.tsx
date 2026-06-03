'use client';

import { useState, useEffect } from 'react';
import { Coffee, Utensils, GlassWater, Cake, Plus, Minus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: 'coffee' | 'kitchen' | 'drinks' | 'desserts';
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  comment: string;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'coffee' | 'kitchen' | 'drinks' | 'desserts'>('all');
  const [search, setSearch] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const currentOrder = openOrders.find(o => o.id === currentOrderId);
  const subtotal = currentOrder
    ? currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  // Загрузка товаров
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      if (data) setProducts(data);
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const categoryMatch = activeCategory === 'all' || p.category === activeCategory;
    const searchMatch = p.name.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Создать новый заказ
  const createNewOrder = () => {
    const newOrder: Order = {
      id: 'ORD-' + Date.now(),
      table: tableNumber || `Стол ${openOrders.length + 1}`,
      items: [],
      comment: '',
    };
    setOpenOrders([...openOrders, newOrder]);
    setCurrentOrderId(newOrder.id);
    setTableNumber('');
  };

  // === ПРОВЕРКА: можно ли добавить товар (хватает ли ингредиентов) ===
  const canAddToOrder = async (product: Product): Promise<boolean> => {
    // Ищем техкарту по названию
    const { data: techcard } = await supabase
      .from('techcards')
      .select('id')
      .ilike('name', `%${product.name}%`)
      .single();

    // Если техкарты нет — проверяем остаток самого товара
    if (!techcard) {
      const { data: prod } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', product.id)
        .single();

      return prod ? prod.quantity >= 1 : false;
    }

    // Если техкарта есть — проверяем все ингредиенты
    const { data: ingredients } = await supabase
      .from('techcard_ingredients')
      .select('product_id, quantity')
      .eq('techcard_id', techcard.id);

    if (!ingredients || ingredients.length === 0) return true;

    for (const ing of ingredients) {
      const { data: prod } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', ing.product_id)
        .single();

      if (!prod || prod.quantity < ing.quantity) {
        return false;
      }
    }

    return true;
  };

  // === ДОБАВИТЬ ТОВАР В ЗАКАЗ (с блокировкой) ===
  const addToOrder = async (product: Product) => {
    if (!currentOrder) return;

    const canAdd = await canAddToOrder(product);

    if (!canAdd) {
      alert(`Недостаточно ингредиентов на складе для «${product.name}»`);
      return;
    }

    setOpenOrders(openOrders.map(order => {
      if (order.id !== currentOrder.id) return order;

      const existing = order.items.find(i => i.id === product.id);
      if (existing) {
        return {
          ...order,
          items: order.items.map(i =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      return {
        ...order,
        items: [...order.items, { ...product, quantity: 1 }]
      };
    }));
  };

  // Изменить количество
  const changeQuantity = (productId: string, delta: number) => {
    if (!currentOrder) return;
    setOpenOrders(openOrders.map(order => {
      if (order.id !== currentOrder.id) return order;
      return {
        ...order,
        items: order.items.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
      };
    }));
  };

  // Удалить товар из заказа
  const removeFromOrder = (productId: string) => {
    if (!currentOrder) return;
    setOpenOrders(openOrders.map(order => {
      if (order.id !== currentOrder.id) return order;
      return {
        ...order,
        items: order.items.filter(i => i.id !== productId)
      };
    }));
  };

  // === ЗАКРЫТИЕ ЗАКАЗА + АВТОМАТИЧЕСКОЕ СПИСАНИЕ ИНГРЕДИЕНТОВ ===
  const closeOrder = async (paymentMethod: 'cash' | 'transfer') => {
    if (!currentOrder || currentOrder.items.length === 0) return;

    // 1. Сохраняем заказ
    const { data: orderData, error } = await supabase
      .from('orders')
      .insert([{
        table_number: currentOrder.table,
        total: subtotal,
        payment_method: paymentMethod,
        status: 'completed'
      }])
      .select()
      .single();

    if (error) {
      alert('Ошибка сохранения заказа');
      return;
    }

    // 2. Сохраняем позиции заказа
    const orderItems = currentOrder.items.map(item => ({
      order_id: orderData.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    await supabase.from('order_items').insert(orderItems);

    // === АВТОМАТИЧЕСКОЕ СПИСАНИЕ ИНГРЕДИЕНТОВ ===
    for (const item of currentOrder.items) {
      const { data: techcard } = await supabase
        .from('techcards')
        .select('id')
        .ilike('name', `%${item.name}%`)
        .single();

      if (techcard) {
        const { data: ingredients } = await supabase
          .from('techcard_ingredients')
          .select('product_id, quantity')
          .eq('techcard_id', techcard.id);

        if (ingredients && ingredients.length > 0) {
          for (const ing of ingredients) {
            await supabase.rpc('decrement_product_quantity', {
              product_id: ing.product_id,
              qty: ing.quantity * item.quantity
            });
          }
        }
      }
    }

    // 3. Удаляем заказ из открытых
    setOpenOrders(openOrders.filter(o => o.id !== currentOrder.id));
    setCurrentOrderId(null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Касса POS</h1>
        <button onClick={createNewOrder} className="btn-primary flex items-center gap-3 px-8 py-4">
          <Plus className="w-6 h-6" /> Новый заказ
        </button>
      </div>

      {/* Вкладки заказов */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {openOrders.map(order => (
          <button
            key={order.id}
            onClick={() => setCurrentOrderId(order.id)}
            className={`px-6 py-3 rounded-3xl font-medium whitespace-nowrap transition-all ${
              currentOrderId === order.id
                ? 'bg-[#C8A77E] text-[#3F2A1F]'
                : 'bg-[#3F2A1F] text-white hover:bg-[#5C4030]'
            }`}
          >
            {order.table} • {order.items.length} поз.
          </button>
        ))}
      </div>

      <div className="flex gap-8 flex-1">
        {/* Меню товаров */}
        <div className="flex-1 flex flex-col">
          <div className="flex gap-2 mb-6 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
            <button onClick={() => setActiveCategory('all')} className={`px-8 py-4 rounded-3xl font-medium ${activeCategory === 'all' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Все</button>
            <button onClick={() => setActiveCategory('coffee')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'coffee' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Coffee /> Кофейня</button>
            <button onClick={() => setActiveCategory('kitchen')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'kitchen' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Utensils /> Кухня</button>
            <button onClick={() => setActiveCategory('drinks')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'drinks' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><GlassWater /> Напитки</button>
            <button onClick={() => setActiveCategory('desserts')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeCategory === 'desserts' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}><Cake /> Десерты</button>
          </div>

          <input
            type="text"
            placeholder="Поиск товара..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#3F2A1F] border border-[#5C4030] focus:border-[#C8A77E] rounded-3xl px-6 py-4 mb-6 text-white"
          />

          <div className="grid grid-cols-5 gap-3 flex-1 overflow-auto">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToOrder(product)}
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
            {currentOrder ? currentOrder.table : 'Создайте новый заказ'}
          </h2>

          <div className="flex-1 overflow-auto space-y-3">
            {!currentOrder || currentOrder.items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Заказ пустой</p>
              </div>
            ) : (
              currentOrder.items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#2C241E] px-5 py-3 rounded-3xl">
                  <div className="flex-1">
                    <p className="text-white">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => changeQuantity(item.id, -1)}><Minus /></button>
                    <span className="font-mono text-white w-8 text-center">{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.id, 1)}><Plus /></button>
                    <button onClick={() => removeFromOrder(item.id)} className="text-red-400"><Trash2 /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-[#5C4030]">
            <div className="flex justify-between text-3xl font-semibold text-white mb-6">
              <span>Итого:</span>
              <span>{subtotal} с</span>
            </div>

            {/* Кнопки оплаты */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => closeOrder('cash')}
                disabled={!currentOrder || currentOrder.items.length === 0}
                className="py-7 text-2xl font-semibold rounded-3xl bg-emerald-600 text-white disabled:bg-gray-600 disabled:text-gray-400"
              >
                Наличка
              </button>
              <button
                onClick={() => closeOrder('transfer')}
                disabled={!currentOrder || currentOrder.items.length === 0}
                className="py-7 text-2xl font-semibold rounded-3xl bg-blue-600 text-white disabled:bg-gray-600 disabled:text-gray-400"
              >
                Перевод
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}