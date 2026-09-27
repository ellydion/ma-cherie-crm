'use client';

import AuthGate from '@/components/layout/AuthGate';
import DashboardPage from './(dashboard)/page';

export default function HomePage() {
  return (
    <AuthGate>
      <DashboardPage />
    </AuthGate>
  );
}
