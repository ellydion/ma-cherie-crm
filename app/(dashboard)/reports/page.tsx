'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    const now = new Date();
    let startDate = new Date();

    if (period === 'day') startDate.setHours(0, 0, 0, 0);
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    if (period === 'month') startDate.setMonth(now.getMonth() - 1);

    // === 1. Выручка и заказы ===
    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate.toISOString());

    const totalRevenue = orders?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // === 2. РЕАЛЬНЫЙ ЗАКУП из таблицы deliveries ===
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('total_amount, delivery_date')
      .gte('delivery_date', startDate.toISOString().split('T')[0]);

    const totalPurchases = deliveries?.reduce((sum: number, d: any) => sum + Number(d.total_amount), 0) || 0;

    // === 3. Расчёт прибыли ===
    const grossProfit = totalRevenue - totalPurchases;
    const taxes = Math.round(totalRevenue * 0.05); // 5% налог (можно изменить)
    const netProfit = grossProfit - taxes;

    // Средний % закупа от выручки
    const purchasePercent = totalRevenue > 0 ? Math.round((totalPurchases / totalRevenue) * 100) : 0;

    setReportData({
      totalRevenue,
      totalOrders,
      avgCheck,
      totalPurchases,
      grossProfit,
      taxes,
      netProfit,
      purchasePercent,
      orders: orders || [],
      deliveries: deliveries || []
    });

    setLoading(false);
  };

  if (loading) return <p className="text-white text-center py-12">Формирование отчёта...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Отчёты</h1>
          <p className="text-[#C8A77E] mt-1">Выручка, закупки и прибыль</p>
        </div>
      </div>

      {/* Период */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setPeriod('day')} className={`px-8 py-4 rounded-3xl font-medium ${period === 'day' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Сегодня</button>
        <button onClick={() => setPeriod('week')} className={`px-8 py-4 rounded-3xl font-medium ${period === 'week' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Неделя</button>
        <button onClick={() => setPeriod('month')} className={`px-8 py-4 rounded-3xl font-medium ${period === 'month' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Месяц</button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card p-8">
          <p className="text-[#C8A77E]">Выручка</p>
          <p className="text-5xl font-mono text-white mt-4">{reportData.totalRevenue.toLocaleString('ru-RU')} с</p>
        </div>
        <div className="card p-8">
          <p className="text-[#C8A77E]">Закупки</p>
          <p className="text-5xl font-mono text-amber-400 mt-4">{reportData.totalPurchases.toLocaleString('ru-RU')} с</p>
          <p className="text-sm text-gray-400 mt-1">({reportData.purchasePercent}% от выручки)</p>
        </div>
        <div className="card p-8">
          <p className="text-[#C8A77E]">Валовая прибыль</p>
          <p className="text-5xl font-mono text-emerald-400 mt-4">{reportData.grossProfit.toLocaleString('ru-RU')} с</p>
        </div>
        <div className="card p-8 bg-emerald-900/30 border-emerald-500">
          <p className="text-emerald-400">Чистая прибыль</p>
          <p className="text-5xl font-mono text-emerald-400 mt-4">{reportData.netProfit.toLocaleString('ru-RU')} с</p>
        </div>
      </div>

      {/* Детализация */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Прибыль */}
        <div className="card p-8">
          <h3 className="text-xl font-semibold mb-6">Расчёт прибыли</h3>
          <div className="space-y-6">
            <div className="flex justify-between"><span className="text-gray-400">Выручка</span><span className="font-medium">{reportData.totalRevenue} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Закупки (реальные)</span><span className="font-medium text-amber-400">-{reportData.totalPurchases} с</span></div>
            <div className="h-px bg-[#5C4030]" />
            <div className="flex justify-between"><span className="text-gray-400">Валовая прибыль</span><span className="font-medium">{reportData.grossProfit} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Налоги (5%)</span><span className="font-medium text-red-400">-{reportData.taxes} с</span></div>
            <div className="h-px bg-[#5C4030]" />
            <div className="flex justify-between text-xl"><span className="font-semibold">Чистая прибыль</span><span className="font-semibold text-emerald-400">{reportData.netProfit} с</span></div>
          </div>
        </div>

        {/* Статистика */}
        <div className="card p-8">
          <h3 className="text-xl font-semibold mb-6">Статистика</h3>
          <div className="space-y-6">
            <div className="flex justify-between"><span className="text-gray-400">Количество заказов</span><span className="font-medium">{reportData.totalOrders}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Средний чек</span><span className="font-medium">{reportData.avgCheck} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Средний % закупа</span><span className="font-medium">{reportData.purchasePercent}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}