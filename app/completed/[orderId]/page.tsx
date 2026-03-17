'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '../../../components/BottomNav';
import { useAuth } from '../../../contexts/AuthContext';
import { getOrderById } from '../../../services/orders.service';
import type { Order } from '../../../types/order';

export default function CompletedPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
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
        if (mounted) setOrder(o ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [firebaseUser, userProfile?.store_id, isLoading, orderId, router]);

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Заказ выполнен</h1>
        {loading ? (
          <p className="mt-2 text-gray-500">Загрузка...</p>
        ) : order ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-left">
            <p className="font-medium text-gray-900">#{order.order_number}</p>
            <p className="text-sm text-gray-600">
              {order.items_collected} товаров собрано
            </p>
            <p className="mt-1 font-medium text-gray-900">
              Итого: {order.order_total.toFixed(0)} ₽
            </p>
          </div>
        ) : (
          <p className="mt-2 text-gray-500">Нет данных по заказу</p>
        )}
        <Link
          href="/orders"
          className="mt-6 block w-full rounded-xl bg-blue-500 px-4 py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-blue-600 active:bg-blue-700"
        >
          Вернуться в очередь
        </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
