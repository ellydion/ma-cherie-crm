'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Trash2 } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'low' | 'out';
  timestamp: string;
  itemName: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ma-cherie-notifications');
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  const clearAll = () => {
    localStorage.removeItem('ma-cherie-notifications');
    setNotifications([]);
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-primary dark:text-white">Оповещения</h1>
          <p className="text-secondary dark:text-accent mt-1">Критические остатки и отсутствующие продукты</p>
        </div>
        <button onClick={clearAll} className="flex items-center gap-2 text-red-600 hover:text-red-700">
          <Trash2 className="w-5 h-5" />
          Очистить все
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-400">Нет активных оповещений</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="card p-6 flex gap-6 items-start">
              <AlertTriangle className={`w-8 h-8 flex-shrink-0 ${notif.type === 'out' ? 'text-red-600' : 'text-amber-600'}`} />
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg">{notif.title}</h3>
                  <span className="text-xs text-gray-400">{notif.timestamp}</span>
                </div>
                <p className="text-secondary">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}