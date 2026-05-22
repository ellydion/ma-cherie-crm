'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, Coffee, Utensils, Upload, Trash2, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_threshold: number;
  section: 'coffee' | 'kitchen';
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'coffee' | 'kitchen'>('coffee');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const currentProducts = products.filter(p => p.section === activeTab);

  const getStatus = (quantity: number, minThreshold: number) => {
    if (quantity <= 0) return { label: 'Отсутствует', color: 'bg-red-600' };
    if (quantity < minThreshold) return { label: 'Низкий остаток', color: 'bg-amber-600' };
    return { label: 'В наличии', color: 'bg-emerald-600' };
  };

  const handleSave = async (productData: any) => {
    if (editingProduct) {
      await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([productData]);
    }
    fetchProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Удалить продукт?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const importXLSX = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const newProducts = json.map((row: any) => ({
        name: row['Название'] || row.name,
        unit: row['Ед'] || row.unit || 'шт',
        quantity: parseFloat(row['Остаток'] || row.quantity) || 0,
        min_threshold: parseFloat(row['Мин'] || row.min_threshold) || 5,
        section: row['Секция'] === 'Кухня' ? 'kitchen' : 'coffee'
      }));

      await supabase.from('products').insert(newProducts);
      fetchProducts();
      alert('Импорт завершён!');
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка склада...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Склад</h1>
          <p className="text-[#C8A77E]">Продукты • Автоматические оповещения</p>
        </div>

        <div className="flex gap-4">
          <label className="btn-primary flex items-center gap-3 px-8 py-4 cursor-pointer">
            <Upload className="w-6 h-6" />
            Импорт XLSX
            <input type="file" accept=".xlsx,.xls" onChange={importXLSX} className="hidden" />
          </label>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-3 px-8 py-4"
          >
            <Plus className="w-6 h-6" />
            Добавить продукт
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setActiveTab('coffee')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeTab === 'coffee' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>
          <Coffee className="w-5 h-5" /> Кофейня
        </button>
        <button onClick={() => setActiveTab('kitchen')} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-medium ${activeTab === 'kitchen' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>
          <Utensils className="w-5 h-5" /> Кухня
        </button>
      </div>

      {/* Таблица */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5C4030]">
              <th className="text-left p-6">Продукт</th>
              <th className="text-left p-6">Остаток</th>
              <th className="text-left p-6">Ед.</th>
              <th className="text-left p-6">Мин. остаток</th>
              <th className="text-left p-6">Статус</th>
              <th className="w-32"></th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => {
              const status = getStatus(product.quantity, product.min_threshold);
              return (
                <tr key={product.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70">
                  <td className="p-6 font-medium text-white">{product.name}</td>
                  <td className="p-6 font-mono text-3xl">{product.quantity}</td>
                  <td className="p-6 text-gray-400">{product.unit}</td>
                  <td className="p-6 text-gray-400">{product.min_threshold}</td>
                  <td className="p-6">
                    <span className={`px-5 py-2 rounded-3xl text-sm font-medium text-white ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="p-6 flex gap-3">
                    <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="text-[#C8A77E] hover:text-white">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="text-red-400 hover:text-red-500">
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
              {editingProduct ? 'Редактировать продукт' : 'Новый продукт'}
            </h2>
            <div className="space-y-6">
              <input id="name" type="text" defaultValue={editingProduct?.name} placeholder="Название" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Ед. изм.</label>
                  <input id="unit" type="text" defaultValue={editingProduct?.unit || 'шт'} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Остаток</label>
                  <input id="quantity" type="number" defaultValue={editingProduct?.quantity} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Мин. остаток</label>
                  <input id="min_threshold" type="number" defaultValue={editingProduct?.min_threshold} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Секция</label>
                <select id="section" defaultValue={editingProduct?.section} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                  <option value="coffee">Кофейня</option>
                  <option value="kitchen">Кухня</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={() => {
                const name = (document.getElementById('name') as HTMLInputElement).value;
                const unit = (document.getElementById('unit') as HTMLInputElement).value;
                const quantity = parseFloat((document.getElementById('quantity') as HTMLInputElement).value) || 0;
                const min_threshold = parseFloat((document.getElementById('min_threshold') as HTMLInputElement).value) || 5;
                const section = (document.getElementById('section') as HTMLSelectElement).value as 'coffee' | 'kitchen';
                handleSave({ name, unit, quantity, min_threshold, section });
              }} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F]">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}