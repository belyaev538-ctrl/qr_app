import type { Order } from '../types/order';
import { PriorityBadge } from './PriorityBadge';
import { ProgressBar } from './ProgressBar';
import Image from 'next/image';

export interface OrderCardProps {
  order: Order;
  onStartPicking?: (orderId: string) => void;
  onCardClick?: (order: Order) => void;
  showStartButton?: boolean;
  buttonLabel?: string;
  showDoneButton?: boolean;
  onMarkDone?: (orderId: string) => void;
  doneButtonLabel?: string;
  showDetailsButton?: boolean;
  detailsButtonLabel?: string;
  /** ID текущего пользователя-сборщика для отображения "Я Собираю этот заказ" */
  currentPickerId?: string | null;
  /** Компактный режим для узких desktop-колонок */
  compact?: boolean;
  /** Явно выбранная карточка (desktop) */
  selected?: boolean;
}

function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(date: Date | null | undefined): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFinishedAtRu(date: Date | null | undefined): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'ОЖИДАЕТ';
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value: number): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' р.';
}

function getCardStyle(queuePosition: number | undefined): { bg: string; border: string } {
  const pos = queuePosition ?? 0;
  if (pos === 1) return { bg: '#FFECEC', border: '#E7B9B9' };
  if (pos === 2) return { bg: '#FFF0E5', border: '#FFDEC7' };
  if (pos === 3) return { bg: '#FFF9E2', border: '#F7E499' };
  return { bg: '#F3F7FF', border: '#C4D7FF' };
}

function getCircleStyle(queuePosition: number | undefined): { bg: string; border: string; text: string } {
  const pos = queuePosition ?? 0;
  if (pos === 1) return { bg: '#F13134', border: '#F13134', text: '#FFFFFF' };
  if (pos === 2) return { bg: '#F76D0B', border: '#F76D0B', text: '#FFFFFF' };
  if (pos === 3) return { bg: '#F3C611', border: '#F3C611', text: '#000000' };
  return { bg: '#FFFFFF', border: '#1A4ED8', text: '#1A4ED8' };
}

export function OrderCard({
  order,
  onStartPicking,
  onCardClick,
  showStartButton = true,
  buttonLabel = 'ПРИСТУПИТЬ К СБОРКЕ',
  showDoneButton = false,
  onMarkDone,
  doneButtonLabel = 'ЗАКАЗ ЗАБРАЛИ',
  showDetailsButton = false,
  detailsButtonLabel = 'ДЕТАЛИ ЗАКАЗА',
  currentPickerId,
  compact = false,
  selected = false,
}: OrderCardProps) {
  const isDoneOrder = order.status === 'done';
  const isCollectedOrder = order.status === 'collected';
  const isOutOfStockOrder = order.status === 'out_of_stock';
  const isCancelledOrder = order.status === 'cancelled';
  const useDoneStyle = isDoneOrder || (showDoneButton && order.status === 'collected');
  const leftLabel = isDoneOrder
    ? 'Выполнено'
    : isCollectedOrder
      ? 'Ожидает'
      : isOutOfStockOrder
      ? 'Закончился'
      : isCancelledOrder
        ? 'Отменен'
      : 'В очереди';
  const progress =
    order.items_total > 0
      ? (order.items_collected / order.items_total) * 100
      : 0;

  const cardStyle = useDoneStyle
    ? { bg: '#F3F8EA', border: '#DBE7C7' }
    : isOutOfStockOrder || isCancelledOrder
        ? { bg: '#FFECEC', border: '#E7B9B9' }
        : getCardStyle(order.queue_position);
  const circleStyle = useDoneStyle
    ? { bg: '#90B94E', border: '#ADD66B', text: '#FFFFFF' }
    : isOutOfStockOrder || isCancelledOrder
      ? { bg: '#F13134', border: '#F13134', text: '#FFFFFF' }
    : getCircleStyle(order.queue_position);

  const handleCardClick = () => {
    if (onCardClick) onCardClick(order);
    else if (order.status === 'not_started' && onStartPicking) onStartPicking(order.id);
  };

  const canOpen = onCardClick || (order.status === 'not_started' && onStartPicking) || (order.status === 'collecting');

  return (
    <div
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onClick={canOpen ? handleCardClick : undefined}
      onKeyDown={(e) => { if (canOpen && e.key === 'Enter') handleCardClick(); }}
      className={`rounded-2xl shadow-sm ${compact ? 'min-h-[170px] px-3 pt-3 pb-3' : 'h-[210px] px-5 pt-5 pb-5'} ${canOpen ? 'cursor-pointer' : ''}`}
      style={{
        backgroundColor: cardStyle.bg,
        borderColor: selected ? '#0C58FE' : cardStyle.border,
        borderStyle: 'solid',
        borderWidth: selected ? 3 : (useDoneStyle || isOutOfStockOrder || isCancelledOrder ? 1 : 2),
      }}
    >
      <div className="flex gap-4">
        {/* Левая полоса */}
        <div className="flex w-[62px] flex-col items-center gap-1 self-stretch">
          <div className="flex w-full flex-col items-center gap-1">
            <span
              className={`flex shrink-0 items-center justify-center rounded-[45px] border-2 text-lg font-bold shadow-sm ${
                useDoneStyle || isCancelledOrder ? 'h-[50px] w-[50px]' : 'h-12 w-12'
              }`}
              style={{
                backgroundColor: circleStyle.bg,
                borderColor: circleStyle.border,
                color: circleStyle.text,
                ...(order.status === 'collecting' && !useDoneStyle ? { borderStyle: 'dashed' } : {}),
              }}
            >
              {useDoneStyle ? (
                <Image
                  src="/icon/galka.svg"
                  alt=""
                  width={50}
                  height={50}
                  className="h-[50px] w-[50px] shrink-0"
                />
              ) : isOutOfStockOrder || isCancelledOrder ? (
                <Image
                  src="/icon/out_of_stock.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              ) : (
                order.queue_position
              )}
            </span>
            {leftLabel && <span className="mt-1 text-xs font-medium text-slate-800">{leftLabel}</span>}
          </div>
          <div className="mt-auto flex h-[60px] w-full flex-col items-center justify-center gap-1 text-center">
            {order.order_type === 'delivery' ? (
              <>
                <Image
                  src="/icon/car.svg"
                  alt="Доставка"
                  width={18}
                  height={19}
                  className="h-5 w-5 shrink-0"
                />
                <span className="w-full text-center text-xs text-[#0A1017]">Доставка</span>
              </>
            ) : (
              <>
                <Image
                  src="/icon/zaberut.svg"
                  alt="Заберут"
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0"
                />
                <span className="w-full text-center text-xs text-[#0A1017]">Заберут</span>
              </>
            )}
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className={`${compact ? 'text-xl' : 'text-2xl'} font-extrabold text-slate-900`}>
              {order.order_number}
            </span>
            {isOutOfStockOrder ? (
              <span className={`inline-flex h-[21px] items-center rounded-[3px] bg-red-500 px-2.5 text-[10px] font-normal text-white ${compact ? 'max-w-[120px] truncate' : ''}`}>
                ЗАКОНЧИЛСЯ
              </span>
            ) : isCancelledOrder ? (
              <span className={`inline-flex h-[21px] items-center rounded-[3px] bg-red-500 px-2.5 text-[10px] font-normal text-white ${compact ? 'max-w-[120px] truncate' : ''}`}>
                ОТМЕНЕН
              </span>
            ) : isCollectedOrder ? (
              <span className={`inline-flex h-[21px] items-center rounded-[3px] bg-[#90B94E] px-2.5 text-[10px] font-normal text-white ${compact ? 'max-w-[120px] truncate' : ''}`}>
                {formatFinishedAtRu(order.picking_finished_at)}
              </span>
            ) : isDoneOrder && order.picking_finished_at instanceof Date ? (
              <span className={`inline-flex h-[21px] items-center rounded-[3px] bg-[#5C73A1] px-2.5 text-[12px] font-normal text-white ${compact ? 'max-w-[150px] truncate' : ''}`}>
                Заказ собран {formatDateTime(order.picking_finished_at)}
              </span>
            ) : (
              <PriorityBadge priority={order.priority_status} />
            )}
          </div>

          <div className="mt-2">
            <ProgressBar value={progress} />
          </div>

          <div className={`mt-3 flex w-full items-center justify-between leading-none text-slate-700 ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
            <span className="flex flex-1 justify-start gap-[5px]">
              Товаров
              <span className="font-bold text-[#0A1017]">
                {order.items_collected ?? 0}/{order.items_total}
              </span>
            </span>
            <span className="flex flex-1 justify-center gap-[5px]">
              До
              <span className={`font-bold text-[#0A1017] ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
                {formatTime(order.collect_until)}
              </span>
            </span>
            <span className={`flex flex-1 justify-end font-bold leading-none text-[#0A1017] ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
              {formatPrice(order.order_total)}
            </span>
          </div>

          {showDoneButton && order.status === 'collected' && onMarkDone && (
            <button
              type="button"
              className={`mt-[36px] flex w-full items-center rounded-full bg-[#90B94E] pl-4 pr-[18px] font-bold text-white ${compact ? 'h-12 text-xs' : 'h-[60px] text-sm'}`}
              style={{ fontFamily: '__Open_Sans_Fallback_e8b307' }}
              onClick={(e) => {
                e.stopPropagation();
                onMarkDone(order.id);
              }}
            >
              <span className={`flex min-w-0 flex-1 items-center justify-center ${compact ? 'text-center leading-tight' : 'whitespace-nowrap'}`}>{doneButtonLabel}</span>
              <span className="flex shrink-0 items-center justify-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </button>
          )}

          {isDoneOrder && onCardClick && (
            <button
              type="button"
              className={`mt-[36px] flex w-full items-center rounded-full border-2 border-[#90B94E] bg-[#FFFFFF] pl-4 pr-[18px] font-bold text-[#90B94E] transition-colors hover:border-[#7EA53F] hover:bg-[#90B94E] hover:text-white ${compact ? 'h-12 text-xs' : 'h-[60px] text-sm'}`}
              style={{ fontFamily: '__Open_Sans_Fallback_e8b307' }}
              onClick={(e) => {
                e.stopPropagation();
                onCardClick(order);
              }}
            >
              <span className={`flex min-w-0 flex-1 items-center justify-center ${compact ? 'text-center leading-tight' : 'whitespace-nowrap'}`}>ДЕТАЛИ ЗАКАЗА</span>
              <span className="flex shrink-0 items-center justify-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#90B94E]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </button>
          )}

          {showDetailsButton && !isDoneOrder && onCardClick && (
            <button
              type="button"
              className={`mt-[36px] flex w-full items-center rounded-full border-2 border-[#90B94E] bg-[#FFFFFF] pl-4 pr-[18px] font-bold text-[#90B94E] transition-colors hover:border-[#7EA53F] hover:bg-[#90B94E] hover:text-white ${compact ? 'h-12 text-xs' : 'h-[60px] text-sm'}`}
              style={{ fontFamily: '__Open_Sans_Fallback_e8b307' }}
              onClick={(e) => {
                e.stopPropagation();
                onCardClick(order);
              }}
            >
              <span className={`flex min-w-0 flex-1 items-center justify-center ${compact ? 'text-center leading-tight' : 'whitespace-nowrap'}`}>{detailsButtonLabel}</span>
              <span className="flex shrink-0 items-center justify-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#90B94E]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </button>
          )}

          {showStartButton && (onStartPicking || onCardClick || order.status === 'collecting') && (
            order.status === 'collecting' && order.picker_id === currentPickerId ? (
              <div
                className={`mt-[36px] flex w-full cursor-pointer items-center rounded-full pl-4 pr-[18px] font-bold text-[#0C58FE] ${compact ? 'h-12 text-xs' : 'h-[60px] text-sm'}`}
                style={{ fontFamily: '__Open_Sans_Fallback_e8b307', backgroundColor: '#CFDEFF' }}
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onCardClick?.(order); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onCardClick?.(order); } }}
              >
                <span className={`flex min-w-0 flex-1 items-center justify-center ${compact ? 'text-center leading-tight' : 'whitespace-nowrap'}`}>Я СОБИРАЮ ЭТОТ ЗАКАЗ</span>
                <span className="flex shrink-0 items-center justify-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#0C58FE]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </div>
            ) : order.status === 'collecting' ? (
              <div
                className={`mt-[36px] flex w-full cursor-default items-center justify-center rounded-full border-2 border-[#A3BFFA] bg-[#CFDEFF] pl-4 pr-[18px] font-semibold text-[#0C58FE] opacity-30 ${compact ? 'h-12 text-[clamp(10px,0.85vw,12px)]' : 'h-[60px] text-sm'}`}
                style={{ fontFamily: '__Open_Sans_Fallback_e8b307' }}
              >
                <span className={`text-center ${compact ? 'leading-tight' : 'whitespace-nowrap'}`}>ЗАКАЗ УЖЕ СОБИРАЮТ</span>
              </div>
            ) : (
              <button
                type="button"
                className={`mt-[36px] flex w-full items-center rounded-full bg-[#007BFF] pl-4 pr-[18px] font-bold text-white shadow-md hover:bg-[#0069d9] active:bg-[#0056b3] ${compact ? 'h-12 text-[clamp(10px,0.85vw,12px)]' : 'h-[60px] text-sm'}`}
                style={{ fontFamily: '__Open_Sans_Fallback_e8b307' }}
              >
                <span className={`flex min-w-0 flex-1 items-center justify-center text-center ${compact ? 'leading-tight' : 'whitespace-nowrap'}`}>{buttonLabel}</span>
                <span className="flex shrink-0 items-center justify-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
