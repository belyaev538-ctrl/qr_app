'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ORDER_STATUSES = [
  { code: 'not_started', label: 'ЕЩЕ НЕ СОБИРАЕТСЯ', desc: 'Заказ в очереди, к сборке еще не приступали.' },
  { code: 'collecting', label: 'СОБИРАЕТСЯ', desc: 'Сборщик уже начал собирать заказ.' },
  { code: 'collected', label: 'ЗАКАЗ СОБРАН', desc: 'Все позиции собраны, заказ готов к выдаче.' },
  { code: 'out_of_stock', label: 'ЗАКОНЧИЛСЯ ТОВАР', desc: 'Одна или несколько позиций отсутствуют.' },
  { code: 'cancelled', label: 'ОТМЕНЕН', desc: 'Заказ отменен и больше не обрабатывается.' },
  { code: 'done', label: 'ВЫПОЛНЕН', desc: 'Заказ выдан клиенту и полностью завершен.' },
];

const ITEM_STATUSES = [
  { code: 'pending', label: 'ОЖИДАЕТ', desc: 'Позиция еще не обработана.' },
  { code: 'collected', label: 'СОБРАН', desc: 'Позиция успешно собрана.' },
  { code: 'out_of_stock', label: 'НЕТ В НАЛИЧИИ', desc: 'Позиция отсутствует в магазине.' },
];

function getBadgeStyle(code: string) {
  switch (code) {
    case 'not_started':
      return { bg: '#007BFF', text: '#FFFFFF', icon: '/icon/not_started.svg', invert: true };
    case 'collecting':
      return { bg: '#F3C611', text: '#081B42', icon: '/icon/collecting.svg', invert: false };
    case 'collected':
      return { bg: '#90B94E', text: '#FFFFFF', icon: '/icon/collected.svg', invert: false };
    case 'out_of_stock':
      return { bg: '#F13134', text: '#FFFFFF', icon: '/icon/out_of_stock.svg', invert: false };
    case 'cancelled':
      return { bg: '#6B7280', text: '#FFFFFF', icon: '/icon/out_of_stock.svg', invert: false };
    case 'done':
      return { bg: '#90B94E', text: '#FFFFFF', icon: '/icon/galka.svg', invert: false };
    case 'pending':
      return { bg: '#007BFF', text: '#FFFFFF', icon: '/icon/not_started.svg', invert: true };
    default:
      return { bg: '#007BFF', text: '#FFFFFF', icon: '/icon/not_started.svg', invert: true };
  }
}

function StatusBadge({ code, label }: { code: string; label: string }) {
  const style = getBadgeStyle(code);
  return (
    <div
      className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full px-4 text-[12px] font-semibold uppercase"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <Image
        src={style.icon}
        alt=""
        width={20}
        height={20}
        className={style.invert ? 'h-5 w-5 shrink-0 brightness-0 invert' : 'h-5 w-5 shrink-0'}
      />
      <span>{label}</span>
    </div>
  );
}

export default function StatusesHelpPage() {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/orders');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Назад"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Справка по статусам</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 py-4">
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Статусы заказов</h2>
          <div className="space-y-3">
            {ORDER_STATUSES.map((s) => (
              <div key={s.code} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <StatusBadge code={s.code} label={s.label} />
                <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Код в базе:{' '}
                  <span className="font-semibold text-[#081A3F]">{s.code}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Статусы товаров</h2>
          <div className="space-y-3">
            {ITEM_STATUSES.map((s) => (
              <div key={s.code} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <StatusBadge code={s.code} label={s.label} />
                <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Код в базе:{' '}
                  <span className="font-semibold text-[#081A3F]">{s.code}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
