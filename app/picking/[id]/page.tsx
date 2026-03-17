'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../contexts/AuthContext';
import { getOrderById } from '../../../services/orders.service';
import { getItemsByOrder, setQuantityCollected, markOutOfStock, revertFromOutOfStock } from '../../../services/items.service';
import { cancelOrder, deleteOrder, markOrderDone, restoreOrderToCollecting, startPicking, finishOrder } from '../../../services/orders.service';
import { updateOrderProgress } from '../../../services/picking.service';
import { ProgressBar } from '../../../components/ProgressBar';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { BottomNav } from '../../../components/BottomNav';
import { getOrderStatusLabel } from '../../../types/order';
import type { Order } from '../../../types/order';
import type { OrderItem } from '../../../types/orderItem';

function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value: number): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' р.';
}

function getStatusButtonStyle(status: Order['status']) {
  switch (status) {
    case 'not_started':
      return { bg: '#007BFF', text: '#FFFFFF', icon: 'clock' };
    case 'collecting':
      return { bg: '#F3C611', text: '#000000', icon: 'box' };
    case 'collected':
      return { bg: '#90B94E', text: '#FFFFFF', icon: 'check' };
    case 'out_of_stock':
      return { bg: '#EF4444', text: '#FFFFFF', icon: 'x' };
    case 'cancelled':
      return { bg: '#6B7280', text: '#FFFFFF', icon: 'x' };
    default:
      return { bg: '#007BFF', text: '#FFFFFF', icon: 'clock' };
  }
}

function getQueueCircleStyle(pos: number | undefined) {
  const p = pos ?? 0;
  if (p === 1) return { bg: '#F13134', text: '#FFFFFF' };
  if (p === 2) return { bg: '#F76D0B', text: '#FFFFFF' };
  if (p === 3) return { bg: '#F13134', text: '#FFFFFF' };
  return { bg: '#FFFFFF', border: '#1A4ED8', text: '#1A4ED8' };
}

export default function PickingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { firebaseUser, userProfile, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<{ itemId: string; value: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/orders');
  }

  const loadData = useCallback(async () => {
    const [o, list] = await Promise.all([
      getOrderById(orderId),
      getItemsByOrder(orderId),
    ]);
    const orderData = o ?? null;
    const itemsForStore =
      orderData?.store_id
        ? list.filter((item) => !item.store_id || item.store_id === orderData.store_id)
        : list;
    setOrder(orderData);
    setItems(itemsForStore);
  }, [orderId]);

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
    async function init() {
      setLoading(true);
      try {
        await loadData();
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, [firebaseUser, userProfile?.store_id, isLoading, loadData, router]);

  async function handleQuantityChange(item: OrderItem, delta: number) {
    if (busy) return;
    setBusy(true);
    try {
      const next = Math.max(0, Math.min(item.quantity, (item.quantity_collected ?? 0) + delta));
      if (order?.status === 'not_started' && firebaseUser && next > 0) {
        await startPicking(orderId, firebaseUser.uid);
      }
      await setQuantityCollected(item.id, next, item.quantity);
      await updateOrderProgress(orderId);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function handleQuantityInputBlur(item: OrderItem, rawValue: string) {
    setEditingQuantity(null);
    if (busy) return;
    const parsed = parseInt(rawValue.trim(), 10);
    if (isNaN(parsed)) return;
    const next = Math.max(0, Math.min(item.quantity, parsed));
    const current = item.quantity_collected ?? 0;
    if (next === current) return;
    setBusy(true);
    try {
      if (order?.status === 'not_started' && firebaseUser && next > 0) {
        await startPicking(orderId, firebaseUser.uid);
      }
      await setQuantityCollected(item.id, next, item.quantity);
      await updateOrderProgress(orderId);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function handleOutOfStock(itemId: string) {
    if (busy) return;
    setBusy(true);
    try {
      if (order?.status === 'not_started' && firebaseUser) {
        await startPicking(orderId, firebaseUser.uid);
      }
      await markOutOfStock(itemId);
      await updateOrderProgress(orderId);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function handleCollectAll(item: OrderItem) {
    if (busy) return;
    const current = item.quantity_collected ?? 0;
    if (current >= item.quantity) return;
    setBusy(true);
    try {
      if (order?.status === 'not_started' && firebaseUser) {
        await startPicking(orderId, firebaseUser.uid);
      }
      await setQuantityCollected(item.id, item.quantity, item.quantity);
      await updateOrderProgress(orderId);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function handleRevertOutOfStock(itemId: string) {
    if (busy) return;
    setBusy(true);
    try {
      await revertFromOutOfStock(itemId);
      await updateOrderProgress(orderId);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check',hypothesisId:'H4',location:'app/picking/[id]/page.tsx:handleFinish:before',message:'finish button flow started',data:{orderId,currentStatus:order?.status ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      await finishOrder(orderId);
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check',hypothesisId:'H4',location:'app/picking/[id]/page.tsx:handleFinish:after',message:'finishOrder resolved, navigating to completed details',data:{orderId},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      router.push(`/completed/${orderId}`);
    } finally {
      setFinishing(false);
    }
  }

  async function handleCancel() {
    if (busy) return;
    setBusy(true);
    try {
      await cancelOrder(orderId);
      router.push('/orders');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreCancelled() {
    if (busy || !firebaseUser) return;
    setBusy(true);
    try {
      await restoreOrderToCollecting(orderId, firebaseUser.uid);
      router.push('/orders/collecting');
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkDone() {
    if (markingDone) return;
    setMarkingDone(true);
    try {
      await markOrderDone(orderId);
      await loadData();
    } finally {
      setMarkingDone(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await deleteOrder(orderId);
      router.push('/orders');
    } finally {
      setBusy(false);
    }
  }

  const totalItems = items.length;
  const processedItems = items.filter((i) => i.status === 'collected' || i.status === 'out_of_stock').length;
  const progress = totalItems > 0 ? (processedItems / totalItems) * 100 : 0;

  const allProcessed = totalItems > 0 && processedItems === totalItems;
  const allItemsOutOfStock = totalItems > 0 && items.every((i) => i.status === 'out_of_stock');
  const statusStyle = order ? getStatusButtonStyle(order.status) : getStatusButtonStyle('not_started');
  const circleStyle = getQueueCircleStyle(order?.queue_position);

  if (isLoading || !firebaseUser) return null;

  if (loading && !order) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A1929]">
        <div className="flex items-center justify-center py-20 text-white">Загрузка...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A1929]">
        <div className="flex items-center justify-center py-20 text-white">Заказ не найден</div>
        <button
          type="button"
          onClick={handleBack}
          className="mx-4 rounded-lg bg-white/20 px-4 py-2 text-white"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A1929]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex min-h-[240px] flex-col gap-4 border-b border-white/10 bg-[#081A3F] px-4 pt-4 pb-5">
        {/* Top: Назад + СРОЧНЫЙ */}
        <div className="flex min-h-[46px] items-center justify-between border-b border-[#5C73A1] pb-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex min-h-[30px] items-center gap-2 text-white"
          >
            <span
              className="inline-block h-[30px] w-[30px] shrink-0"
              style={{
                mask: 'url(/icon/back.svg) no-repeat center',
                WebkitMask: 'url(/icon/back.svg) no-repeat center',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                backgroundColor: '#0C58FE',
              }}
            />
            <span className="font-medium" style={{ fontSize: 17 }}>Назад</span>
          </button>
          {!['out_of_stock', 'collected'].includes(order.status) && (
            <span className="flex items-center">
              <PriorityBadge priority={order.priority_status} />
            </span>
          )}
        </div>

        {/* Middle: круг + Очередь | A-109 + progress + Товаров|До|цена + Доставка/Заберут */}
        <div className="flex min-h-[88px] flex-1 flex-col pb-5">
          <div className="flex flex-1 items-stretch gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
              style={{
                backgroundColor: circleStyle.bg,
                color: circleStyle.text,
                border:
                  order.status === 'done'
                    ? '2px solid #90B94E'
                    : `2px solid ${(order.queue_position ?? 0) >= 4 ? '#0C58FE' : '#FF7660'}`,
              }}
            >
              {order.status === 'out_of_stock' ? (
                <Image
                  src="/icon/out_of_stock.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              ) : order.status === 'done' ? (
                <Image
                  src="/icon/galka.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              ) : (
                order.queue_position ?? '-'
              )}
            </div>
            <span className="mt-auto text-xs" style={{ color: '#5C73A1' }}>
              {order.status === 'out_of_stock' ? '' : order.status === 'done' ? '' : 'Очередь'}
            </span>
          </div>
          <div className="h-[50px] w-px shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col justify-between pt-0.5">
            <div className="flex flex-1 flex-col justify-between gap-3">
<div className="flex h-[38px] items-center justify-between gap-2">
              <span className="font-bold text-white leading-none" style={{ fontSize: 28 }}>{order.order_number}</span>
                {order.order_type === 'delivery' ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Image src="/icon/car.svg" alt="" width={16} height={16} className="shrink-0 brightness-0 invert" />
                    Доставка
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Image src="/icon/zaberut.svg" alt="" width={16} height={16} className="shrink-0 brightness-0 invert" />
                    Заберут
                  </span>
                )}
              </div>
              <div className="flex shrink-0 justify-center">
                <ProgressBar value={progress} />
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-[10px] text-[13px] leading-none" style={{ color: '#5C73A1' }}>
                <span className="shrink-0 whitespace-nowrap">
                  Товаров <span className="ml-1 font-semibold text-white">{processedItems}/{totalItems}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap">
                  До <span className="ml-1 font-semibold text-white">{formatTime(order.collect_until)}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap font-semibold text-white">
                  {formatPrice(order.order_total)}
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Bottom: круглые кнопки + кнопка статуса */}
        <div className="-mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (order.status === 'cancelled') {
                handleRestoreCancelled();
                return;
              }
              setShowCancelConfirm(true);
            }}
            disabled={busy}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'rgba(33, 83, 192, 0.3)' }}
            title={order.status === 'cancelled' ? 'Вернуть в сборку' : 'Отменить заказ'}
          >
            <Image src="/icon/cancel.svg" alt="" width={20} height={20} className="h-5 w-5 brightness-0 invert" />
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={busy}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'rgba(33, 83, 192, 0.3)' }}
            title="Удалить заказ"
          >
            <Image src="/icon/delete.svg" alt="" width={20} height={20} className="h-5 w-5 brightness-0 invert" />
          </button>
          <button
            type="button"
            onClick={() => setShowComment(true)}
            className="relative flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-80"
            style={{ backgroundColor: 'rgba(33, 83, 192, 0.3)' }}
            title="Комментарий"
          >
            <Image src="/icon/comment.svg" alt="" width={20} height={20} className="h-5 w-5 brightness-0 invert" />
            {order.comment && (
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
            )}
          </button>

          {/* Main status button */}
          {order.status === 'not_started' ? (
            <div
              className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-semibold text-white"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Image
                src="/icon/not_started.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 brightness-0 invert"
              />
              <span>ЕЩЕ НЕ СОБИРАЕТСЯ</span>
            </div>
          ) : order.status === 'collecting' && allProcessed && items.length > 0 ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing}
              className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-semibold text-white shadow disabled:opacity-50"
              style={{ backgroundColor: '#22C55E' }}
            >
              {finishing ? 'Завершение...' : 'ЗАВЕРШИТЬ ЗАКАЗ'}
            </button>
          ) : (
            <div
              className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full px-4 font-semibold"
              style={{
                backgroundColor:
                  order.status === 'collected'
                    ? '#90B94E'
                    : order.status === 'done'
                      ? '#90B94E'
                    : order.status === 'out_of_stock' && allItemsOutOfStock
                      ? '#F13134'
                      : statusStyle.bg,
                color:
                  order.status === 'collecting'
                    ? '#081B42'
                    : '#FFFFFF',
                fontSize: 12,
              }}
            >
              {order.status === 'collecting' && (
                <Image
                  src="/icon/collecting.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              )}
              {order.status === 'collected' && (
                <Image
                  src="/icon/collected.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              )}
              {order.status === 'done' && (
                <Image
                  src="/icon/galka.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              )}
              {order.status === 'out_of_stock' && allItemsOutOfStock && (
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center"
                >
                  <span
                    className="inline-block h-[23px] w-[23px] shrink-0"
                    style={{
                      mask: 'url(/icon/cancelitem.svg) no-repeat center',
                      WebkitMask: 'url(/icon/cancelitem.svg) no-repeat center',
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </span>
              )}
              <span className="uppercase">
                {items.length === 0 && (order.status === 'collected' || order.status === 'done')
                  ? 'В ЗАКАЗЕ НЕТ ТОВАРОВ'
                  : order.status === 'collecting'
                    ? 'СОБИРАЕТСЯ'
                    : order.status === 'collected'
                      ? 'ЗАКАЗ СОБРАН'
                      : order.status === 'out_of_stock' && allItemsOutOfStock
                        ? 'ЗАКОНЧИЛСЯ ТОВАР'
                        : getOrderStatusLabel(order.status)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Product list */}
      <main className={`min-h-0 flex-1 overflow-auto bg-white px-4 py-4 ${order.status === 'collected' ? 'pb-44' : 'pb-28'}`}>
        <h2 className="mb-4 font-normal text-slate-900" style={{ fontSize: 14 }}>
          {order.status === 'done' ? 'История заказа' : 'Список товаров для сборки'}
        </h2>
        {loading ? (
          <p className="text-slate-500">Загрузка товаров...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">В заказе нет товаров</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const isProcessed = item.status === 'collected' || item.status === 'out_of_stock';
              return (
                <div key={item.id} className="flex flex-col">
                <div
                  className="flex items-center gap-4 rounded-xl bg-white p-4"
                >
                  <div
                    className="relative h-[157px] w-[157px] shrink-0 overflow-hidden rounded-lg bg-white"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setPreviewImage({
                        src: item.product_image || '/placeholder.png',
                        alt: item.product_name,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPreviewImage({
                          src: item.product_image || '/placeholder.png',
                          alt: item.product_name,
                        });
                      }
                    }}
                  >
                    <img
                      src={item.product_image || '/placeholder.png'}
                      alt={item.product_name}
                      width={157}
                      height={157}
                      className="h-[157px] w-[157px] cursor-zoom-in object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3E?%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      type="button"
                      className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center text-[#94A3B8]"
                      onClick={() =>
                        setPreviewImage({
                          src: item.product_image || '/placeholder.png',
                          alt: item.product_name,
                        })
                      }
                      title="Открыть фото"
                      aria-label="Открыть фото"
                    >
                      <svg className="h-8 w-8 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="6" />
                        <path d="M16 16l5 5" />
                        <path d="M11 8v6" />
                        <path d="M8 11h6" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex min-h-[157px] min-w-0 flex-1 flex-col justify-center">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      Кол-во: <span className="font-bold" style={{ fontSize: 24, color: '#081A3F' }}>{item.quantity}</span> {item.unit}
                    </p>
                    {isProcessed ? (
                      <div className="mt-3 flex items-center gap-2">
                        {item.status === 'collected' && (
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={busy || (item.quantity_collected ?? 0) <= 0}
                            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-rose-100 transition hover:bg-rose-200 disabled:opacity-50"
                            title="Отменить сбор"
                          >
                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" style={{ fill: '#F13134', opacity: 0.3 }}>
                              <path d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM10 1.5C5.30558 1.5 1.5 5.30558 1.5 10C1.5 14.6944 5.30558 18.5 10 18.5C14.6944 18.5 18.5 14.6944 18.5 10C18.5 5.30558 14.6944 1.5 10 1.5ZM13.4462 6.39705L13.5303 6.46967C13.7966 6.73594 13.8208 7.1526 13.6029 7.44621L13.5303 7.53033L11.061 10L13.5303 12.4697C13.7966 12.7359 13.8208 13.1526 13.6029 13.4462L13.5303 13.5303C13.2641 13.7966 12.8474 13.8208 12.5538 13.6029L12.4697 13.5303L10 11.061L7.53033 13.5303C7.26406 13.7966 6.8474 13.8208 6.55379 13.6029L6.46967 13.5303C6.2034 13.2641 6.1792 12.8474 6.39705 12.5538L6.46967 12.4697L8.939 10L6.46967 7.53033C6.2034 7.26406 6.1792 6.8474 6.39705 6.55379L6.46967 6.46967C6.73594 6.2034 7.1526 6.1792 7.44621 6.39705L7.53033 6.46967L10 8.939L12.4697 6.46967C12.7359 6.2034 13.1526 6.1792 13.4462 6.39705Z" />
                            </svg>
                          </button>
                        )}
                        {item.status === 'out_of_stock' && (
                          <button
                            type="button"
                            onClick={() => handleRevertOutOfStock(item.id)}
                            disabled={busy}
                            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-rose-100 transition hover:bg-rose-200 disabled:opacity-50"
                            title="Вернуть к сбору"
                          >
                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" style={{ fill: '#F13134', opacity: 0.3 }}>
                              <path d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM10 1.5C5.30558 1.5 1.5 5.30558 1.5 10C1.5 14.6944 5.30558 18.5 10 18.5C14.6944 18.5 18.5 14.6944 18.5 10C18.5 5.30558 14.6944 1.5 10 1.5ZM13.4462 6.39705L13.5303 6.46967C13.7966 6.73594 13.8208 7.1526 13.6029 7.44621L13.5303 7.53033L11.061 10L13.5303 12.4697C13.7966 12.7359 13.8208 13.1526 13.6029 13.4462L13.5303 13.5303C13.2641 13.7966 12.8474 13.8208 12.5538 13.6029L12.4697 13.5303L10 11.061L7.53033 13.5303C7.26406 13.7966 6.8474 13.8208 6.55379 13.6029L6.46967 13.5303C6.2034 13.2641 6.1792 12.8474 6.39705 12.5538L6.46967 12.4697L8.939 10L6.46967 7.53033C6.2034 7.26406 6.1792 6.8474 6.39705 6.55379L6.46967 6.46967C6.73594 6.2034 7.1526 6.1792 7.44621 6.39705L7.53033 6.46967L10 8.939L12.4697 6.46967C12.7359 6.2034 13.1526 6.1792 13.4462 6.39705Z" />
                            </svg>
                          </button>
                        )}
                        <span
                          className={`inline-flex h-[50px] w-[150px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold ${
                            item.status === 'collected'
                              ? 'bg-[#90B94E] text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {item.status === 'collected' ? (
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth={2} />
                              <path strokeLinecap="round" d="M4.93 4.93l14.14 14.14" strokeWidth={2} />
                            </svg>
                          )}
                          {item.status === 'collected' ? 'СОБРАНО' : 'ЗАКОНЧИЛСЯ'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOutOfStock(item.id)}
                          disabled={busy}
                          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition hover:bg-rose-200 disabled:opacity-50"
                          title="Нет в наличии"
                        >
                          <span
                            className="inline-block h-[30px] w-[30px] shrink-0 opacity-30"
                            style={{
                              mask: 'url(/icon/cancelitem.svg) no-repeat center',
                              WebkitMask: 'url(/icon/cancelitem.svg) no-repeat center',
                              maskSize: 'contain',
                              WebkitMaskSize: 'contain',
                              backgroundColor: '#F13134',
                            }}
                          />
                        </button>
                        <div className="flex h-[50px] w-[150px] items-center gap-0.5 rounded-full border border-blue-200 bg-white px-0.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={busy || (item.quantity_collected ?? 0) <= 0}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800 transition hover:bg-blue-100 disabled:opacity-40 disabled:hover:bg-blue-50"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            inputMode="numeric"
                            className="min-w-[32px] flex-1 border-0 bg-transparent text-center text-base font-bold text-blue-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            value={editingQuantity?.itemId === item.id ? editingQuantity.value : String(item.quantity_collected ?? 0)}
                            onFocus={() => setEditingQuantity({ itemId: item.id, value: String(item.quantity_collected ?? 0) })}
                            onChange={(e) => setEditingQuantity((p) => (p?.itemId === item.id ? { ...p, value: e.target.value } : p))}
                            onBlur={(e) => handleQuantityInputBlur(item, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                            disabled={busy}
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, 1)}
                            disabled={busy || (item.quantity_collected ?? 0) >= item.quantity}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800 transition hover:bg-blue-100 disabled:opacity-40 disabled:hover:bg-blue-50"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCollectAll(item)}
                          disabled={busy || (item.quantity_collected ?? 0) >= item.quantity}
                          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#EAF3D9] text-[#90B94E] transition hover:bg-[#DDECC2] disabled:opacity-50"
                          title="Собрать всё"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-px w-full shrink-0 bg-[#C4D7FF]" aria-hidden />
                </div>
              );
            })}
          </div>
        )}

        {allProcessed && items.length > 0 && order.status === 'collecting' && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing}
              className="w-full rounded-full bg-green-600 px-4 py-4 text-base font-semibold text-white shadow hover:bg-green-500 active:bg-green-700 disabled:opacity-50"
            >
              {finishing ? 'Завершение...' : 'ЗАВЕРШИТЬ ЗАКАЗ'}
            </button>
          </div>
        )}
      </main>

      {/* Comment modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            onClick={() => setPreviewImage(null)}
            aria-label="Закрыть превью"
            title="Закрыть"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={previewImage.src}
            alt={previewImage.alt}
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect fill="%23e5e7eb" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="18"%3Eimage not found%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      )}

      {showComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Комментарий к заказу</h3>
              <button
                type="button"
                onClick={() => setShowComment(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-700">
              {order.comment || 'Нет комментария'}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-6 text-center text-base font-semibold text-slate-900">
              Вы точно хотите удалить заказ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className="flex-1 rounded-xl border-2 border-blue-600 bg-white py-3 font-semibold text-blue-600"
              >
                ДА
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white"
              >
                НЕТ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="mb-6 text-center text-base font-semibold text-slate-900">
              Вы точно хотите отменить заказ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirm(false);
                  handleCancel();
                }}
                className="flex-1 rounded-xl border-2 border-blue-600 bg-white py-3 font-semibold text-blue-600"
              >
                ДА
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white"
              >
                НЕТ
              </button>
            </div>
          </div>
        </div>
      )}
      {order.status === 'collected' && (
        <div className="fixed inset-x-0 bottom-[92px] z-30 px-4">
          <button
            type="button"
            onClick={handleMarkDone}
            disabled={markingDone}
            className="flex h-[60px] w-full items-center rounded-full bg-[#90B94E] pl-4 pr-[18px] text-sm font-bold text-white shadow-lg disabled:opacity-60"
            style={{ fontFamily: '__Open_Sans_Fallback_e8b307' }}
          >
            <span className="flex min-w-0 flex-1 items-center justify-center whitespace-nowrap">
              {markingDone ? 'ОБНОВЛЕНИЕ...' : 'ЗАКАЗ ЗАБРАЛИ'}
            </span>
            <span className="flex shrink-0 items-center justify-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
