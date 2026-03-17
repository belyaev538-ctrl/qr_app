'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeToCollectingOrders } from '../../../services/orders.service';
import { OrderCard } from '../../../components/OrderCard';
import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeaderNew';
import { BottomNav } from '../../../components/BottomNav';
import type { Order } from '../../../types/order';

export default function CollectingPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!firebaseUser) {
      router.push('/login');
      return;
    }
    if (!userProfile?.store_id) {
      router.push('/store-connect');
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToCollectingOrders(
      userProfile.store_id,
      firebaseUser.uid,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [firebaseUser, userProfile?.store_id, isLoading, router]);

  const loadOrders = useCallback(() => {
    // Данные обновляются в реальном времени через subscribeToCollectingOrders
  }, []);

  function handleOpenOrder(order: Order) {
    router.push(`/picking/${order.id}`);
  }

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      <PageHeader title="Я собираю эти заказы" onRefresh={loadOrders} />

      <main className="flex flex-1 flex-col px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-11 w-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="Нет активных заказов"
            subtitle="Ожидайте поступления новых заказов."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCardClick={handleOpenOrder}
                showStartButton
                buttonLabel="ПРОДОЛЖИТЬ СБОР"
                currentPickerId={firebaseUser?.uid}
              />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
