'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToQueueOrders } from '../../lib/firestore';
import { subscribeToCollectingOrders, subscribeToCompletedOrders } from '../../services/orders.service';
import { OrderCard } from '../../components/OrderCard';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeaderNew';
import { BottomNav } from '../../components/BottomNav';
import type { Order } from '../../types/order';

export default function OrdersQueuePage() {
  const router = useRouter();
  const { firebaseUser, userProfile, isLoading } = useAuth();
  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const [collectingOrders, setCollectingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingCollecting, setLoadingCollecting] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [desktopWidths, setDesktopWidths] = useState<number[]>([25, 25, 25, 25]);
  const [collapsedCols, setCollapsedCols] = useState<boolean[]>([false, false, false, false]);
  const desktopContainerRef = useRef<HTMLDivElement | null>(null);

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

    setLoadingQueue(true);
    setLoadingCollecting(true);
    setLoadingCompleted(true);

    const unsubQueue = subscribeToQueueOrders(userProfile.store_id, (list) => {
      setQueueOrders(list);
      setLoadingQueue(false);
    });

    const unsubCollecting = subscribeToCollectingOrders(
      userProfile.store_id,
      firebaseUser.uid,
      (list) => {
        setCollectingOrders(list);
        setLoadingCollecting(false);
      },
    );

    const unsubCompleted = subscribeToCompletedOrders((list) => {
      const byStore = userProfile.store_id
        ? list.filter((order) => order.store_id === userProfile.store_id)
        : list;
      setCompletedOrders(byStore);
      setLoadingCompleted(false);
    });

    return () => {
      unsubQueue();
      unsubCollecting();
      unsubCompleted();
    };
  }, [firebaseUser, userProfile?.store_id, isLoading, router]);

  const sortedAllQueueOrders = useMemo(
    () => [...queueOrders].sort((a, b) => a.queue_position - b.queue_position),
    [queueOrders],
  );

  const sortedQueueOrders = useMemo(
    () =>
      [...queueOrders]
        .filter((o) => o.status === 'not_started')
        .sort((a, b) => a.queue_position - b.queue_position),
    [queueOrders],
  );

  const desktopAllOrders = useMemo(
    () => [...sortedQueueOrders, ...collectingOrders, ...completedOrders],
    [sortedQueueOrders, collectingOrders, completedOrders],
  );

  useEffect(() => {
    if (desktopAllOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !desktopAllOrders.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(desktopAllOrders[0].id);
    }
  }, [desktopAllOrders, selectedOrderId]);

  const loadOrders = () => {
    // Данные обновляются в реальном времени через onSnapshot
  };

  function handleOpenOrder(order: { id: string; status: string }) {
    router.push(`/picking/${order.id}`);
  }

  function startResize(dividerIndex: number, event: React.MouseEvent<HTMLDivElement>) {
    if (collapsedCols[dividerIndex] || collapsedCols[dividerIndex + 1]) return;
    event.preventDefault();
    const container = desktopContainerRef.current;
    if (!container) return;

    const startX = event.clientX;
    const startWidths = [...desktopWidths];
    const minWidthPercent = 15;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const containerWidth = container.getBoundingClientRect().width;
      if (containerWidth <= 0) return;
      const deltaPercent = (dx / containerWidth) * 100;

      let left = startWidths[dividerIndex] + deltaPercent;
      let right = startWidths[dividerIndex + 1] - deltaPercent;

      if (left < minWidthPercent) {
        right -= minWidthPercent - left;
        left = minWidthPercent;
      }
      if (right < minWidthPercent) {
        left -= minWidthPercent - right;
        right = minWidthPercent;
      }
      if (left < minWidthPercent || right < minWidthPercent) return;

      const next = [...startWidths];
      next[dividerIndex] = left;
      next[dividerIndex + 1] = right;
      setDesktopWidths(next);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function toggleColumn(index: number) {
    setCollapsedCols((prev) => {
      const openCount = prev.filter((v) => !v).length;
      if (!prev[index] && openCount <= 1) return prev;
      return prev.map((v, i) => (i === index ? !v : v));
    });
  }

  function handleDesktopSelect(orderId: string) {
    setSelectedOrderId(orderId);
    setCollapsedCols((prev) => (prev[3] ? prev.map((v, i) => (i === 3 ? false : v)) : prev));
  }

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:bg-[#081A3F] lg:pb-0">
      <div className="lg:hidden">
        <PageHeader title="Очередь заказов на сборку" onRefresh={loadOrders} />
      </div>

      <div className="hidden lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#081A3F] px-5 py-4">
          <h1 className="text-xl font-bold text-white">Рабочий стол сборки</h1>
          <div className="flex items-center gap-2">
            {collapsedCols[0] && (
              <button
                type="button"
                onClick={() => toggleColumn(0)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Показать: Очередь
              </button>
            )}
            {collapsedCols[1] && (
              <button
                type="button"
                onClick={() => toggleColumn(1)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Показать: Я собираю
              </button>
            )}
            {collapsedCols[2] && (
              <button
                type="button"
                onClick={() => toggleColumn(2)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Показать: Собраны
              </button>
            )}
            {collapsedCols[3] && (
              <button
                type="button"
                onClick={() => toggleColumn(3)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Показать: Детали
              </button>
            )}
          </div>
        </div>
        <div ref={desktopContainerRef} className="flex min-h-0 flex-1 bg-[#081A3F] p-4">
          <div
            className="min-w-0 pr-2"
            style={{
              display: collapsedCols[0] ? 'none' : 'block',
              minWidth: 0,
              flex: `${desktopWidths[0]} 1 0%`,
            }}
          >
            <DesktopOrdersColumn
              title="Очередь"
              loading={loadingQueue}
              orders={sortedQueueOrders}
              selectedOrderId={selectedOrderId}
              onSelect={handleDesktopSelect}
              currentPickerId={firebaseUser?.uid}
              onToggleCollapse={() => toggleColumn(0)}
            />
          </div>
          {!collapsedCols[0] && !collapsedCols[1] && <DesktopResizeHandle onMouseDown={(e) => startResize(0, e)} />}

          <div
            className="min-w-0 px-2"
            style={{
              display: collapsedCols[1] ? 'none' : 'block',
              minWidth: 0,
              flex: `${desktopWidths[1]} 1 0%`,
            }}
          >
            <DesktopOrdersColumn
              title="Я собираю"
              loading={loadingCollecting}
              orders={collectingOrders}
              selectedOrderId={selectedOrderId}
              onSelect={handleDesktopSelect}
              currentPickerId={firebaseUser?.uid}
              onToggleCollapse={() => toggleColumn(1)}
            />
          </div>
          {!collapsedCols[1] && !collapsedCols[2] && <DesktopResizeHandle onMouseDown={(e) => startResize(1, e)} />}

          <div
            className="min-w-0 px-2"
            style={{
              display: collapsedCols[2] ? 'none' : 'block',
              minWidth: 0,
              flex: `${desktopWidths[2]} 1 0%`,
            }}
          >
            <DesktopOrdersColumn
              title="Собраны"
              loading={loadingCompleted}
              orders={completedOrders}
              selectedOrderId={selectedOrderId}
              onSelect={handleDesktopSelect}
              currentPickerId={firebaseUser?.uid}
              onToggleCollapse={() => toggleColumn(2)}
            />
          </div>
          {!collapsedCols[2] && !collapsedCols[3] && <DesktopResizeHandle onMouseDown={(e) => startResize(2, e)} />}

          <section
            className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-2 pl-2"
            style={{
              display: collapsedCols[3] ? 'none' : 'flex',
              minWidth: 0,
              flex: `${desktopWidths[3]} 1 0%`,
            }}
          >
            <div className="mb-2 flex w-full items-center justify-between px-1">
              <h2 className="text-[32px] font-bold leading-none text-[#081A3F]">Детали заказа</h2>
              <button
                type="button"
                onClick={() => toggleColumn(3)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                title="Закрыть колонку"
              >
                <span className="text-base leading-none">×</span>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {selectedOrderId ? (
                <iframe
                  title={`order-${selectedOrderId}`}
                  src={`/picking/${selectedOrderId}`}
                  className="h-full w-full rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                  Выберите заказ из колонок слева
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <main className="flex flex-1 flex-col px-4 py-4 lg:hidden">
        {loadingQueue ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-11 w-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-2 w-full rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedAllQueueOrders.length === 0 ? (
          <EmptyState
            title="Нет активных заказов"
            subtitle="Заказы появятся здесь."
          />
        ) : (
          <div className="space-y-4">
            {sortedAllQueueOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCardClick={handleOpenOrder}
                currentPickerId={firebaseUser?.uid}
              />
            ))}
          </div>
        )}
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

function DesktopResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className="group relative w-2 cursor-col-resize"
    >
      <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-slate-300 transition group-hover:bg-[#0C58FE]" />
    </div>
  );
}

function DesktopOrdersColumn({
  title,
  loading,
  orders,
  selectedOrderId,
  onSelect,
  currentPickerId,
  onToggleCollapse,
}: {
  title: string;
  loading: boolean;
  orders: Order[];
  selectedOrderId: string | null;
  onSelect: (orderId: string) => void;
  currentPickerId?: string | null;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-2">
      <div className="mb-2 flex w-full items-center justify-between px-1">
        <h3 className="text-[26px] font-bold leading-none text-[#081A3F]">{title}</h3>
        <span className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-500">{orders.length}</span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            title="Закрыть колонку"
          >
            <span className="text-base leading-none">×</span>
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
            Пусто
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-xl transition">
              <OrderCard
                order={order}
                onCardClick={(o) => onSelect(o.id)}
                currentPickerId={currentPickerId}
                showStartButton={order.status !== 'done' && order.status !== 'out_of_stock' && order.status !== 'cancelled'}
                selected={selectedOrderId === order.id}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
