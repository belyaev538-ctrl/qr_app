'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  const [desktopOverlayOrderId, setDesktopOverlayOrderId] = useState<string | null>(null);

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

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type === 'close-order-overlay') {
        setDesktopOverlayOrderId(null);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (isLoading || !firebaseUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:bg-[#081A3F] lg:pb-0">
      <div className="lg:hidden">
        <PageHeader title="Мои заказы" onRefresh={loadOrders} />
      </div>

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-20 flex-col items-center border-r border-white/10 bg-[#081A3F] pt-2 lg:flex">
        <nav className="mt-2 flex flex-col items-center">
          <DesktopNavButton
            href="/orders"
            label="Дашбор"
            active={false}
            icon={<DesktopDashboardIcon />}
          />
          <span className="my-2 h-px w-10 bg-[#5C73A1]/30" aria-hidden />
          <DesktopNavButton
            href="/orders/mine"
            label="Мои"
            active
            icon={<DesktopUserIcon />}
          />
          <span className="my-2 h-px w-10 bg-[#5C73A1]/30" aria-hidden />
          <DesktopNavButton
            href="/settings"
            label="Настройки"
            active={false}
            icon={<DesktopSettingsIcon />}
          />
        </nav>
      </aside>

      <main className="flex flex-1 flex-col px-4 py-4 lg:ml-20 lg:min-h-screen lg:bg-white lg:px-[60px] lg:py-6">
        <div className="mb-4 hidden lg:block">
          <h1 className="text-xl font-bold text-[#081A3F]">Мои заказы</h1>
        </div>
        <div className="w-full lg:w-[383px]">
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
                  typeof window !== 'undefined' && window.innerWidth >= 900
                    ? setDesktopOverlayOrderId(o.id)
                    : o.status === 'collecting' || o.status === 'done' || o.status === 'out_of_stock' || o.status === 'cancelled'
                      ? router.push(`/picking/${o.id}`)
                      : router.push(`/completed/${o.id}`)
                }
                showDetailsButton={order.status === 'out_of_stock' || order.status === 'cancelled'}
                currentPickerId={firebaseUser?.uid}
              />
            ))}
          </div>
        )}
        </div>
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {desktopOverlayOrderId && (
        <div className="hidden lg:block" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 z-40 bg-[#08266A]/33 backdrop-blur-[12px]"
            onClick={() => setDesktopOverlayOrderId(null)}
          />
          <aside className="fixed right-0 top-0 z-50 h-screen w-1/2 min-w-[560px] bg-white shadow-2xl">
            <iframe
              title={`order-overlay-${desktopOverlayOrderId}`}
              src={`/picking/${desktopOverlayOrderId}?desktopOverlay=1`}
              className="h-full w-full border-0"
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function DesktopNavButton({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-semibold transition ${
        active
          ? 'border-[#0095FF]/30 bg-[#0095FF]/10 text-[#0095FF]'
          : 'border-transparent bg-transparent text-[#5C73A1] hover:text-[#0095FF]'
      }`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </Link>
  );
}

function DesktopUserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.6723 18.6666C25.3283 18.6666 26.6708 20.0091 26.6708 21.6651V22.4323C26.6708 23.6247 26.2447 24.7778 25.4693 25.6836C23.3768 28.1283 20.1939 29.3348 16.0001 29.3348C11.8056 29.3348 8.62425 28.1279 6.53584 25.6822C5.76283 24.777 5.33813 23.6257 5.33813 22.4353V21.6651C5.33813 20.0091 6.68061 18.6666 8.33664 18.6666H23.6723ZM23.6723 20.6666H8.33664C7.78518 20.6666 7.33813 21.1136 7.33813 21.6651V22.4353C7.33813 23.1495 7.59295 23.8403 8.05676 24.3835C9.72784 26.3404 12.349 27.3348 16.0001 27.3348C19.6512 27.3348 22.2746 26.3403 23.9499 24.3831C24.4151 23.8396 24.6708 23.1477 24.6708 22.4323V21.6651C24.6708 21.1136 24.2238 20.6666 23.6723 20.6666ZM16.0001 2.67285C19.682 2.67285 22.6667 5.65762 22.6667 9.33952C22.6667 13.0214 19.682 16.0062 16.0001 16.0062C12.3182 16.0062 9.33341 13.0214 9.33341 9.33952C9.33341 5.65762 12.3182 2.67285 16.0001 2.67285ZM16.0001 4.67285C13.4228 4.67285 11.3334 6.76219 11.3334 9.33952C11.3334 11.9168 13.4228 14.0062 16.0001 14.0062C18.5774 14.0062 20.6667 11.9168 20.6667 9.33952C20.6667 6.76219 18.5774 4.67285 16.0001 4.67285Z" fill="currentColor"/>
    </svg>
  );
}

function DesktopDashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function DesktopSettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.0165 3C16.9951 3.01128 17.9699 3.12435 18.9252 3.33738C19.3421 3.43038 19.654 3.77801 19.7013 4.20262L19.9283 6.23841C20.031 7.17315 20.8202 7.88112 21.7611 7.88211C22.014 7.8825 22.2641 7.82984 22.4978 7.72644L24.3653 6.90608C24.7537 6.73546 25.2075 6.82848 25.4975 7.13815C26.8471 8.57952 27.8522 10.3082 28.4372 12.1941C28.5633 12.6008 28.4181 13.0427 28.0754 13.2953L26.4201 14.5155C25.9479 14.8624 25.669 15.4133 25.669 15.9993C25.669 16.5852 25.9479 17.1362 26.4211 17.4839L28.0779 18.7044C28.4207 18.957 28.566 19.399 28.4398 19.8057C27.8551 21.6913 26.8505 23.4199 25.5017 24.8615C25.212 25.1711 24.7586 25.2644 24.3702 25.0942L22.4951 24.2727C21.9587 24.0379 21.3426 24.0723 20.8356 24.3653C20.3287 24.6583 19.9913 25.1749 19.9268 25.757L19.7014 27.7925C19.6549 28.2123 19.3498 28.5576 18.9389 28.6553C17.0077 29.1148 14.9956 29.1148 13.0643 28.6553C12.6535 28.5576 12.3483 28.2123 12.3018 27.7925L12.0767 25.76C12.0106 25.179 11.6727 24.664 11.1661 24.372C10.6596 24.08 10.0445 24.0457 9.50984 24.2792L7.63434 25.1009C7.24587 25.2711 6.79229 25.1777 6.50262 24.8679C5.15308 23.4246 4.1485 21.694 3.56451 19.8064C3.43873 19.3998 3.58406 18.9582 3.92671 18.7057L5.58448 17.4844C6.05667 17.1375 6.33554 16.5865 6.33554 16.0006C6.33554 15.4147 6.05667 14.8637 5.58386 14.5163L3.92713 13.2971C3.58397 13.0446 3.43851 12.6024 3.56473 12.1954C4.14974 10.3095 5.15484 8.58086 6.50441 7.13949C6.79437 6.82981 7.24816 6.73679 7.63657 6.90741L9.50374 7.72763C10.041 7.96341 10.6586 7.92779 11.1679 7.63026C11.675 7.33612 12.0126 6.81896 12.0778 6.23686L12.3046 4.20262C12.3519 3.7778 12.6641 3.43005 13.0813 3.33726C14.0377 3.12456 15.0135 3.01154 16.0165 3ZM16.0167 4.99986C15.4113 5.00699 14.8077 5.05924 14.2107 5.15602L14.0654 6.45891C13.9297 7.67157 13.227 8.74803 12.1741 9.35871C11.1149 9.97756 9.82339 10.052 8.69969 9.55889L7.50197 9.03275C6.73939 9.9583 6.13243 11.0018 5.70494 12.1222L6.76867 12.9051C7.75375 13.6288 8.33554 14.7782 8.33554 16.0006C8.33554 17.223 7.75375 18.3724 6.76971 19.0954L5.7043 19.8803C6.13143 21.0027 6.73848 22.0482 7.50158 22.9755L8.70842 22.4468C9.82588 21.9589 11.1086 22.0303 12.1649 22.6392C13.2213 23.2482 13.926 24.3223 14.0642 25.5368L14.2095 26.8487C15.3957 27.0504 16.6075 27.0504 17.7937 26.8487L17.939 25.5369C18.0734 24.3227 18.7772 23.2449 19.8349 22.6337C20.8925 22.0224 22.1778 21.9507 23.2973 22.4406L24.5032 22.9689C25.2656 22.043 25.8724 20.9993 26.2998 19.8786L25.2359 19.0948C24.2508 18.3711 23.669 17.2217 23.669 15.9993C23.669 14.7769 24.2508 13.6275 25.2347 12.9046L26.2972 12.1215C25.8697 11.0008 25.2626 9.95712 24.4999 9.03141L23.3046 9.55649C22.8175 9.77201 22.2906 9.88294 21.7585 9.88211C19.7989 9.88005 18.1543 8.40473 17.9404 6.45843L17.7952 5.1556C17.2011 5.05893 16.6038 5.00683 16.0167 4.99986ZM15.9998 10.9999C18.7613 10.9999 20.9998 13.2385 20.9998 15.9999C20.9998 18.7614 18.7613 20.9999 15.9998 20.9999C13.2384 20.9999 10.9998 18.7614 10.9998 15.9999C10.9998 13.2385 13.2384 10.9999 15.9998 10.9999ZM15.9998 12.9999C14.343 12.9999 12.9998 14.3431 12.9998 15.9999C12.9998 17.6568 14.343 18.9999 15.9998 18.9999C17.6567 18.9999 18.9998 17.6568 18.9998 15.9999C18.9998 14.3431 17.6567 12.9999 15.9998 12.9999Z" fill="currentColor"/>
    </svg>
  );
}
