'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { getMyOrders } from '../../../services/orders.service';
import { OrderCard } from '../../../components/OrderCard';
import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeaderNew';
import { BottomNav } from '../../../components/BottomNav';
import type { Order } from '../../../types/order';

export default function MyOrdersPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!firebaseUser || !userProfile?.store_id) return;
    setLoading(true);
    try {
      const storeId = 'store_1';
      const pickerId = 'ilawgbItdWhT6XpxfqviU1sY4Qb2';
      const list = await getMyOrders(storeId, pickerId);
      const filtered = list
        .filter((order) =>
          order.status === 'done' || order.status === 'out_of_stock' || order.status === 'cancelled',
        )
        .sort((a, b) => {
          const aTime = a.picking_finished_at instanceof Date ? a.picking_finished_at.getTime() : 0;
          const bTime = b.picking_finished_at instanceof Date ? b.picking_finished_at.getTime() : 0;
          return bTime - aTime; // по убыванию: свежие выше
        });
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',location:'orders/mine/page.tsx:loadOrders',message:'My orders loaded',data:{total:list.length,filtered:filtered.length,statuses:list.map(o=>o.status),pickerId:firebaseUser?.uid},timestamp:Date.now(),hypothesisId:'my-orders-filter'})}).catch(()=>{});
      // #endregion
      setOrders(filtered);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',location:'orders/mine/page.tsx:loadOrders',message:'My orders load error',data:{error:error instanceof Error ? error.message : String(error),pickerId:firebaseUser?.uid},timestamp:Date.now(),hypothesisId:'my-orders-error'})}).catch(()=>{});
      // #endregion
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, userProfile?.store_id]);

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
    loadOrders();
  }, [firebaseUser, userProfile?.store_id, isLoading, loadOrders, router]);

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      <PageHeader title="Мои заказы" onRefresh={loadOrders} />

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
            title="Нет ваших заказов"
            subtitle="Заказы, которые вы соберёте, появятся здесь."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showStartButton={order.status === 'collecting'}
                buttonLabel={order.status === 'collecting' ? 'ПРОДОЛЖИТЬ СБОР' : undefined}
                onCardClick={(o) =>
                  o.status === 'collecting' || o.status === 'done' || o.status === 'out_of_stock' || o.status === 'cancelled'
                    ? router.push(`/picking/${o.id}`)
                    : router.push(`/completed/${o.id}`)
                }
                showDetailsButton={order.status === 'out_of_stock' || order.status === 'cancelled'}
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
