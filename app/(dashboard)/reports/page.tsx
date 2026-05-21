'use client';

import { useState } from 'react';
import { BarChart3, Printer, Download } from 'lucide-react';
import { useOrdersStore } from '@/lib/store/ordersStore';

export default function ReportsPage() {
  const { orders, todayRevenue, todayOrdersCount } = useOrdersStore();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Примерные данные для расчётов (в реальном проекте будут из базы)
  const totalRevenue = period === 'day' ? todayRevenue : todayRevenue * (period === 'week' ? 6.8 : 29);
  const totalOrders = period === 'day' ? todayOrdersCount : Math.round(todayOrdersCount * (period === 'week' ? 6.5 : 28));

  // Примерные расчёты
  const costOfGoods = Math.round(totalRevenue * 0.38);           // ~38% уходит на продукты
  const grossProfit = totalRevenue - costOfGoods;                // Валовая прибыль
  const taxRate = 0.05;                                          // 5% налог (можно менять)
  const taxes = Math.round(grossProfit * taxRate);
  const netProfit = grossProfit - taxes;                         // Чистая прибыль

  // Разбивка платежей
  const cash = Math.round(totalRevenue * 0.45);
  const card = Math.round(totalRevenue * 0.40);
  const transfer = totalRevenue - cash - card;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Финансовые отчёты</h1>
          <p className="text-[#C8A77E] mt-1">Детальный анализ прибыли и платежей</p>
        </div>

        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
        >
          <Printer className="w-6 h-6" />
          Распечатать отчёт
        </button>
      </div>

      {/* Период */}
      <div className="flex gap-2 mb-8 bg-[#3F2A1F] p-2 rounded-3xl w-fit">
        <button onClick={() => setPeriod('day')} className={`px-8 py-3 rounded-3xl font-medium ${period === 'day' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Сегодня</button>
        <button onClick={() => setPeriod('week')} className={`px-8 py-3 rounded-3xl font-medium ${period === 'week' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Эта неделя</button>
        <button onClick={() => setPeriod('month')} className={`px-8 py-3 rounded-3xl font-medium ${period === 'month' ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>Этот месяц</button>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card p-7">
          <p className="text-[#C8A77E]">Выручка</p>
          <p className="text-4xl font-semibold text-white mt-2">{totalRevenue.toLocaleString('ru-RU')} с</p>
        </div>
        <div className="card p-7">
          <p className="text-[#C8A77E]">Себестоимость товаров</p>
          <p className="text-4xl font-semibold text-white mt-2">{costOfGoods.toLocaleString('ru-RU')} с</p>
        </div>
        <div className="card p-7">
          <p className="text-[#C8A77E]">Чистая прибыль</p>
          <p className="text-4xl font-semibold text-emerald-400 mt-2">{netProfit.toLocaleString('ru-RU')} с</p>
        </div>
        <div className="card p-7">
          <p className="text-[#C8A77E]">Налог</p>
          <p className="text-4xl font-semibold text-amber-400 mt-2">{taxes.toLocaleString('ru-RU')} с ({taxRate * 100}%)</p>
        </div>
      </div>

      {/* Разбивка платежей */}
      <div className="card p-8 mb-10">
        <h2 className="text-xl font-semibold text-white mb-6">Разбивка по способам оплаты</h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">Наличные</p>
            <p className="text-4xl font-semibold text-white mt-3">{cash.toLocaleString('ru-RU')} с</p>
            <div className="h-3 bg-green-500 rounded-full mt-4"></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Карта</p>
            <p className="text-4xl font-semibold text-white mt-3">{card.toLocaleString('ru-RU')} с</p>
            <div className="h-3 bg-blue-500 rounded-full mt-4"></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Перевод</p>
            <p className="text-4xl font-semibold text-white mt-3">{transfer.toLocaleString('ru-RU')} с</p>
            <div className="h-3 bg-purple-500 rounded-full mt-4"></div>
          </div>
        </div>
      </div>

      {/* Детальная таблица */}
      <div className="card p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Финансовый отчёт</h2>
        <table className="w-full">
          <tbody>
            <tr className="border-b border-[#5C4030]">
              <td className="py-5 text-gray-400">Выручка</td>
              <td className="py-5 text-right text-white font-medium">{totalRevenue.toLocaleString('ru-RU')} с</td>
            </tr>
            <tr className="border-b border-[#5C4030]">
              <td className="py-5 text-gray-400">- Себестоимость продуктов</td>
              <td className="py-5 text-right text-white">-{costOfGoods.toLocaleString('ru-RU')} с</td>
            </tr>
            <tr className="border-b border-[#5C4030] bg-[#3F2A1F]/60">
              <td className="py-5 font-medium text-white">Валовая прибыль</td>
              <td className="py-5 text-right text-emerald-400 font-semibold">{grossProfit.toLocaleString('ru-RU')} с</td>
            </tr>
            <tr className="border-b border-[#5C4030]">
              <td className="py-5 text-gray-400">- Налоги ({taxRate * 100}%)</td>
              <td className="py-5 text-right text-amber-400">-{taxes.toLocaleString('ru-RU')} с</td>
            </tr>
            <tr className="bg-[#3F2A1F]">
              <td className="py-6 text-xl font-semibold text-white">Чистая прибыль</td>
              <td className="py-6 text-right text-4xl font-bold text-emerald-400">{netProfit.toLocaleString('ru-RU')} с</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">Отчёт сформирован {new Date().toLocaleString('ru-RU')}</p>
    </div>
  );
}