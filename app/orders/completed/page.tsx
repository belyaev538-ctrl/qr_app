'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { markOrderDone, subscribeToCompletedOrders } from '../../../services/orders.service';
import { OrderCard } from '../../../components/OrderCard';
import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeaderNew';
import { BottomNav } from '../../../components/BottomNav';
import type { Order } from '../../../types/order';

export default function CompletedOrdersPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);
  const [markDoneConfirmId, setMarkDoneConfirmId] = useState<string | null>(null);
  const [showMarkDoneConfirm, setShowMarkDoneConfirm] = useState(false);

  const loadOrders = useCallback(() => {
    // данные обновляются в реальном времени через subscribeToCompletedOrders
  }, []);

  function requestMarkDone(orderId: string) {
    if (markingDoneId) return;
    setMarkDoneConfirmId(orderId);
    setShowMarkDoneConfirm(true);
  }

  async function confirmMarkDone() {
    if (!markDoneConfirmId || markingDoneId) return;
    const orderId = markDoneConfirmId;
    setShowMarkDoneConfirm(false);
    setMarkDoneConfirmId(null);
    setMarkingDoneId(orderId);
    try {
      await markOrderDone(orderId);
    } finally {
      setMarkingDoneId(null);
    }
  }

  useEffect(() => {
    if (isLoading) return;
    if (!firebaseUser) {
      router.push('/login');
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToCompletedOrders(
      (list) => {
        const missingPickingFinishedAtIds = list
          .filter((order) => !order.picking_finished_at)
          .map((order) => order.id);
        // #region agent log
        fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check-4',hypothesisId:'H7',location:'app/orders/completed/page.tsx:subscribeCallback',message:'completed page received orders with picking_finished_at check',data:{count:list.length,missingPickingFinishedAtCount:missingPickingFinishedAtIds.length,missingPickingFinishedAtIds:missingPickingFinishedAtIds.slice(0,5)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setOrders(list);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [firebaseUser, isLoading, router]);

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      <PageHeader title="Собранные заказы" onRefresh={loadOrders} />

      <main className="flex flex-1 flex-col px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-11 w-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-2 w-full rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="Нет собранных заказов"
            subtitle="Завершённые заказы появятся здесь."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/picking/${order.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/picking/${order.id}`)}
                className="cursor-pointer"
              >
                <OrderCard
                  order={order}
                  showStartButton={false}
                  showDoneButton
                  doneButtonLabel={markingDoneId === order.id ? 'ОБНОВЛЕНИЕ...' : 'ЗАКАЗ ЗАБРАЛИ'}
                  onMarkDone={requestMarkDone}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      {showMarkDoneConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#08266A]/33 p-0 backdrop-blur-[12px] sm:p-4 sm:items-center">
          <div className="w-full overflow-hidden rounded-[33px] bg-white p-6 shadow-xl sm:max-w-sm sm:rounded-2xl">
            <p className="mb-6 text-center text-base font-semibold text-slate-900">Заказ точно забрали?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmMarkDone}
                className="flex-1 rounded-[33px] border-2 border-blue-600 bg-white py-3 font-semibold text-blue-600"
              >
                ДА
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMarkDoneConfirm(false);
                  setMarkDoneConfirmId(null);
                }}
                className="flex-1 rounded-[33px] bg-red-600 py-3 font-semibold text-white"
              >
                НЕТ
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
