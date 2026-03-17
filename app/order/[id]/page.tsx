'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getOrderById } from '../../../services/orders.service';
import { OrderCard } from '../../../components/OrderCard';
import { BottomNav } from '../../../components/BottomNav';
import type { Order } from '../../../types/order';

export default function OrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { firebaseUser, userProfile, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
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

    let mounted = true;
    async function load() {
      try {
        const o = await getOrderById(orderId);
        if (mounted) setOrder(o);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [firebaseUser, userProfile?.store_id, isLoading, orderId, router]);

  useEffect(() => {
    if (order?.status === 'collecting') {
      router.replace(`/picking/${order.id}`);
    }
  }, [order?.status, order?.id, router]);

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/orders" className="text-indigo-600 hover:text-indigo-500">
          ← В очередь
        </Link>
      </header>

      <main className="px-4 py-4">
        {loading ? (
          <p className="text-center text-gray-500">Загрузка заказа...</p>
        ) : !order ? (
          <p className="text-center text-gray-500">Заказ не найден</p>
        ) : (
          <OrderCard
            order={order}
            showStartButton={order.status === 'not_started'}
            onCardClick={(o) => router.push(`/picking/${o.id}`)}
            currentPickerId={firebaseUser?.uid}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
