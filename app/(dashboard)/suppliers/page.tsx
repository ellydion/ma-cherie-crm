'use client';

import { useState, useEffect } from 'react';
import { Plus, Truck, Calendar, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  created_at: string;
}

interface Delivery {
  id: string;
  delivery_date: string;
  total_amount: number;
  items: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<{ [key: string]: Delivery[] }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) console.error(error);
    else setSuppliers(data || []);
    setLoading(false);
  };

  const fetchDeliveries = async (supplierId: string) => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('delivery_date', { ascending: false });

    if (error) console.error(error);
    else {
      setDeliveries(prev => ({ ...prev, [supplierId]: data || [] }));
    }
  };

  const handleSaveSupplier = async (supplierData: any) => {
    if (editingSupplier) {
      await supabase
        .from('suppliers')
        .update({
          name: supplierData.name,
          contact: supplierData.contact,
          phone: supplierData.phone
        })
        .eq('id', editingSupplier.id);
    } else {
      await supabase
        .from('suppliers')
        .insert([{
          name: supplierData.name,
          contact: supplierData.contact,
          phone: supplierData.phone
        }]);
    }
    fetchSuppliers();
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSaveDelivery = async (deliveryData: any) => {
    if (!selectedSupplierId) return;

    await supabase
      .from('deliveries')
      .insert([{
        supplier_id: selectedSupplierId,
        delivery_date: deliveryData.delivery_date,
        total_amount: deliveryData.total_amount,
        items: deliveryData.items
      }]);

    fetchDeliveries(selectedSupplierId);
    setIsDeliveryModalOpen(false);
  };

  if (loading) return <p className="text-white text-center py-12">Загрузка поставщиков...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Поставщики</h1>
          <p className="text-[#C8A77E] mt-1">История поставок</p>
        </div>

        <button
          onClick={() => {
            setEditingSupplier(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-3 px-8 py-4"
        >
          <Plus className="w-6 h-6" />
          Новый поставщик
        </button>
      </div>

      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="card overflow-hidden">
            <div
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#3F2A1F]/70"
              onClick={() => {
                if (expandedSupplierId === supplier.id) {
                  setExpandedSupplierId(null);
                } else {
                  setExpandedSupplierId(supplier.id);
                  if (!deliveries[supplier.id]) fetchDeliveries(supplier.id);
                }
              }}
            >
              <div className="flex items-center gap-6">
                <Truck className="w-8 h-8 text-[#C8A77E]" />
                <div>
                  <p className="font-semibold text-white text-xl">{supplier.name}</p>
                  <p className="text-gray-400">{supplier.contact} • {supplier.phone}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSupplierId(supplier.id);
                  setIsDeliveryModalOpen(true);
                }}
                className="px-6 py-3 bg-[#5C4030] hover:bg-[#C8A77E] hover:text-[#3F2A1F] rounded-3xl text-sm font-medium transition-all"
              >
                + Поставка
              </button>
            </div>

            {/* История поставок */}
            {expandedSupplierId === supplier.id && (
              <div className="border-t border-[#5C4030] p-6 bg-[#2C241E]">
                <h4 className="font-medium text-[#C8A77E] mb-4">История поставок</h4>
                {deliveries[supplier.id]?.length === 0 ? (
                  <p className="text-gray-400">Поставок пока нет</p>
                ) : (
                  <div className="space-y-4">
                    {deliveries[supplier.id]?.map((delivery) => (
                      <div key={delivery.id} className="flex justify-between bg-[#3F2A1F] p-5 rounded-3xl">
                        <div>
                          <p className="text-white">{new Date(delivery.delivery_date).toLocaleDateString('ru-RU')}</p>
                          <p className="text-gray-400 text-sm">{delivery.items}</p>
                        </div>
                        <p className="font-mono text-2xl text-emerald-400">{delivery.total_amount} с</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно нового поставщика */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {editingSupplier ? 'Редактировать поставщика' : 'Новый поставщик'}
            </h2>
            <div className="space-y-6">
              <input id="name" type="text" defaultValue={editingSupplier?.name} placeholder="Название компании" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <input id="contact" type="text" defaultValue={editingSupplier?.contact} placeholder="Контактное лицо" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <input id="phone" type="text" defaultValue={editingSupplier?.phone} placeholder="+996 ___ ___ ___" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => { setIsModalOpen(false); setEditingSupplier(null); }} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={() => {
                const name = (document.getElementById('name') as HTMLInputElement).value;
                const contact = (document.getElementById('contact') as HTMLInputElement).value;
                const phone = (document.getElementById('phone') as HTMLInputElement).value;
                handleSaveSupplier({ name, contact, phone });
              }} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно новой поставки */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">Новая поставка</h2>
            <div className="space-y-6">
              <input id="delivery_date" type="date" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <input id="total_amount" type="number" placeholder="Сумма поставки" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
              <textarea id="items" placeholder="Что поставили (через запятую)" rows={3} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white" />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsDeliveryModalOpen(false)} className="flex-1 py-4 rounded-3xl border border-[#5C4030] text-white">Отмена</button>
              <button onClick={() => {
                const delivery_date = (document.getElementById('delivery_date') as HTMLInputElement).value;
                const total_amount = parseFloat((document.getElementById('total_amount') as HTMLInputElement).value) || 0;
                const items = (document.getElementById('items') as HTMLTextAreaElement).value;
                handleSaveDelivery({ delivery_date, total_amount, items });
              }} className="flex-1 py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-medium">Добавить поставку</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}