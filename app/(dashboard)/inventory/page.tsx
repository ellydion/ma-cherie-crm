'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Package, Plus, AlertTriangle, Coffee, Utensils, Check, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  lastUpdated: string;
  section: 'coffee' | 'kitchen';
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'low' | 'out';
  timestamp: string;
  productName: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'coffee' | 'kitchen'>('coffee');
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'quantity' | null>(null);
  const [tempValue, setTempValue] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    unit: 'шт',
    quantity: 0,
    minThreshold: 5,
    section: 'coffee' as 'coffee' | 'kitchen',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ma-cherie-products');
    if (saved) setProducts(JSON.parse(saved));

    const savedNotifs = localStorage.getItem('ma-cherie-notifications');
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('ma-cherie-products', JSON.stringify(newProducts));
  };

  const saveNotifications = (newNotifs: Notification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('ma-cherie-notifications', JSON.stringify(newNotifs));
  };

  const currentProducts = products.filter(p => p.section === activeTab);

  const startEditing = (id: number, field: 'name' | 'quantity', value: string | number) => {
    setEditingId(id);
    setEditingField(field);
    setTempValue(value.toString());
  };

  const saveEdit = () => {
    if (editingId === null || editingField === null) return;

    const updatedProducts = products.map(product => {
      if (product.id === editingId) {
        const updated = { ...product };
        if (editingField === 'quantity') updated.quantity = parseFloat(tempValue) || 0;
        if (editingField === 'name') updated.name = tempValue;
        updated.lastUpdated = new Date().toLocaleDateString('ru-RU');

        if (updated.quantity < updated.minThreshold) {
          const isOut = updated.quantity <= 0;
          const newNotif: Notification = {
            id: Date.now(),
            title: isOut ? 'Продукт отсутствует' : 'Низкий остаток',
            message: `${updated.name} — ${updated.quantity} ${updated.unit} (мин. ${updated.minThreshold})`,
            type: isOut ? 'out' : 'low',
            timestamp: new Date().toLocaleString('ru-RU'),
            productName: updated.name,
          };
          saveNotifications([newNotif, ...notifications]);
        }
        return updated;
      }
      return product;
    });

    saveProducts(updatedProducts);
    setEditingId(null);
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
  };

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;

    const newP: Product = {
      id: Date.now(),
      name: newProduct.name,
      unit: newProduct.unit,
      quantity: newProduct.quantity,
      minThreshold: newProduct.minThreshold,
      lastUpdated: new Date().toLocaleDateString('ru-RU'),
      section: newProduct.section,
    };

    saveProducts([...products, newP]);

    if (newP.quantity < newP.minThreshold) {
      const isOut = newP.quantity <= 0;
      const newNotif: Notification = {
        id: Date.now(),
        title: isOut ? 'Продукт отсутствует' : 'Низкий остаток',
        message: `${newP.name} — ${newP.quantity} ${newP.unit}`,
        type: isOut ? 'out' : 'low',
        timestamp: new Date().toLocaleString('ru-RU'),
        productName: newP.name,
      };
      saveNotifications([newNotif, ...notifications]);
    }

    setNewProduct({ name: '', unit: 'шт', quantity: 0, minThreshold: 5, section: 'coffee' });
    setIsModalOpen(false);
  };

  const getStatus = (quantity: number, minThreshold: number) => {
    if (quantity <= 0) return { label: 'Отсутствует', color: 'bg-red-600 text-white' };
    if (quantity < minThreshold) return { label: 'Низкий остаток', color: 'bg-amber-600 text-white' };
    return { label: 'В наличии', color: 'bg-emerald-600 text-white' };
  };

  function handleFileUpload(event: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Склад</h1>
          <p className="text-[#C8A77E] mt-1">Продукты • Автоматические оповещения</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-3 px-8 py-4">
          <Plus className="w-6 h-6" />
          Добавить продукт
        </button>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setActiveTab('coffee')} className={`flex items-center gap-3 px-8 py-3 rounded-3xl font-medium transition-all ${activeTab === 'coffee' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>
          <Coffee className="w-5 h-5" /> Кофейня
        </button>
        <button onClick={() => setActiveTab('kitchen')} className={`flex items-center gap-3 px-8 py-3 rounded-3xl font-medium transition-all ${activeTab === 'kitchen' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>
          <Utensils className="w-5 h-5" /> Кухня
        </button>
      </div>

      {/* Таблица продуктов */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5C4030]">
              <th className="text-left p-6 font-medium text-[#C8A77E]">Продукт</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Остаток</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Ед. изм.</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Мин. остаток</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Статус</th>
              <th className="text-left p-6 font-medium text-[#C8A77E]">Обновлено</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => {
              const status = getStatus(product.quantity, product.minThreshold);
              return (
                <tr key={product.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70 transition-colors">
                  <td className="p-6 font-medium text-white">
                    {editingId === product.id && editingField === 'name' ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1 bg-[#2C241E] border border-[#C8A77E] rounded-2xl px-4 py-2 text-white" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                        <button onClick={saveEdit}><Check size={20} className="text-emerald-500" /></button>
                        <button onClick={cancelEdit}><X size={20} className="text-red-500" /></button>
                      </div>
                    ) : (
                      <span onClick={() => startEditing(product.id, 'name', product.name)} className="cursor-pointer hover:text-[#C8A77E]">{product.name}</span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === product.id && editingField === 'quantity' ? (
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.1" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="w-28 text-center font-mono text-3xl font-semibold bg-[#2C241E] border border-[#C8A77E] rounded-3xl py-2 text-white" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                        <button onClick={saveEdit}><Check size={20} className="text-emerald-500" /></button>
                        <button onClick={cancelEdit}><X size={20} className="text-red-500" /></button>
                      </div>
                    ) : (
                      <span onClick={() => startEditing(product.id, 'quantity', product.quantity)} className={`cursor-pointer font-mono text-3xl font-semibold ${product.quantity < product.minThreshold ? 'text-red-400' : 'text-white'}`}>
                        {product.quantity}
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-gray-400">{product.unit}</td>
                  <td className="p-6 text-gray-400">{product.minThreshold}</td>
                  <td className="p-6">
                    <span className={`inline-flex px-5 py-1.5 rounded-3xl text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="p-6 text-xs text-gray-400">{product.lastUpdated}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <input type="file" ref={fileInputRef} accept=".xlsx" onChange={handleFileUpload} className="hidden" />

      {/* Модальное окно добавления продукта */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">Добавить продукт</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Название продукта" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newProduct.section} onChange={(e) => setNewProduct({ ...newProduct, section: e.target.value as 'coffee' | 'kitchen' })} className="bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white">
                  <option value="coffee">Кофейня</option>
                  <option value="kitchen">Кухня</option>
                </select>
                <input type="text" placeholder="Ед. изм." value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} className="bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.1" placeholder="Количество" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: parseFloat(e.target.value) || 0 })} className="bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
                <input type="number" placeholder="Мин. остаток" value={newProduct.minThreshold} onChange={(e) => setNewProduct({ ...newProduct, minThreshold: parseFloat(e.target.value) || 5 })} className="bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={handleAddProduct} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F]">Добавить продукт</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}