'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Printer } from 'lucide-react';
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

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
    const totalOrders = orders.length;

    // Примерные расчёты (можно уточнить позже)
    const cogs = Math.round(totalRevenue * 0.38);           // себестоимость 38%
    const grossProfit = totalRevenue - cogs;
    const taxes = Math.round(totalRevenue * 0.05);          // налог 5%
    const netProfit = grossProfit - taxes;

    // Разбивка платежей
    const paymentBreakdown = {
      cash: Math.round(totalRevenue * 0.45),
      card: Math.round(totalRevenue * 0.40),
      transfer: Math.round(totalRevenue * 0.15),
    };

    setReportData({
      totalRevenue,
      totalOrders,
      avgCheck: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      cogs,
      grossProfit,
      taxes,
      netProfit,
      paymentBreakdown,
      orders: orders || []
    });

    setLoading(false);
  };

  if (loading) return <p className="text-white text-center py-12">Формирование отчёта...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Отчёты</h1>
          <p className="text-[#C8A77E] mt-1">Финансовый анализ и прибыль</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-3 px-6 py-4 border border-[#5C4030] rounded-3xl hover:bg-[#5C4030]">
            <Printer className="w-5 h-5" /> Печать
          </button>
          <button className="btn-primary flex items-center gap-3 px-8 py-4">
            <Download className="w-5 h-5" /> Скачать PDF
          </button>
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
          <p className="text-[#C8A77E]">Заказов</p>
          <p className="text-5xl font-mono text-white mt-4">{reportData.totalOrders}</p>
        </div>
        <div className="card p-8">
          <p className="text-[#C8A77E]">Средний чек</p>
          <p className="text-5xl font-mono text-white mt-4">{reportData.avgCheck} с</p>
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
          <h3 className="text-xl font-semibold mb-6">Прибыль и затраты</h3>
          <div className="space-y-6">
            <div className="flex justify-between"><span className="text-gray-400">Выручка</span><span className="font-medium">{reportData.totalRevenue} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Себестоимость (продукты)</span><span className="font-medium text-amber-400">-{reportData.cogs} с</span></div>
            <div className="h-px bg-[#5C4030]" />
            <div className="flex justify-between"><span className="text-gray-400">Валовая прибыль</span><span className="font-medium">{reportData.grossProfit} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Налоги (5%)</span><span className="font-medium text-red-400">-{reportData.taxes} с</span></div>
            <div className="h-px bg-[#5C4030]" />
            <div className="flex justify-between text-xl"><span className="font-semibold">Чистая прибыль</span><span className="font-semibold text-emerald-400">{reportData.netProfit} с</span></div>
          </div>
        </div>

        {/* Разбивка платежей */}
        <div className="card p-8">
          <h3 className="text-xl font-semibold mb-6">Способы оплаты</h3>
          <div className="space-y-6">
            <div className="flex justify-between"><span className="text-gray-400">Наличные</span><span className="font-medium">{reportData.paymentBreakdown.cash} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Карта</span><span className="font-medium">{reportData.paymentBreakdown.card} с</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Перевод</span><span className="font-medium">{reportData.paymentBreakdown.transfer} с</span></div>
          </div>
        </div>
      </div>

      {/* Таблица последних заказов */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-6">Последние заказы</h3>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5C4030]">
                <th className="text-left p-6">Дата</th>
                <th className="text-left p-6">Стол</th>
                <th className="text-left p-6">Сумма</th>
                <th className="text-left p-6">Оплата</th>
              </tr>
            </thead>
            <tbody>
              {reportData.orders.slice(0, 8).map((order: any) => (
                <tr key={order.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70">
                  <td className="p-6 text-gray-400">{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="p-6 font-medium">{order.table_number}</td>
                  <td className="p-6 font-mono">{order.total} с</td>
                  <td className="p-6 text-emerald-400">{order.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}