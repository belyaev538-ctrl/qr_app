import type { OrderItem } from '../types/orderItem';

export interface ItemCardProps {
  item: OrderItem;
  onCollected?: (itemId: string) => void;
  onOutOfStock?: (itemId: string) => void;
  disabled?: boolean;
}

export function ItemCard({
  item,
  onCollected,
  onOutOfStock,
  disabled = false,
}: ItemCardProps) {
  const isProcessed = item.status === 'collected' || item.status === 'out_of_stock';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={item.product_image || '/placeholder.png'}
            alt={item.product_name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3E?%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{item.product_name}</p>
          <p className="mt-0.5 text-sm text-gray-600">
            {item.quantity} {item.unit}
          </p>
          {isProcessed ? (
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                item.status === 'collected'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {item.status === 'collected' ? 'Собран' : 'Нет в наличии'}
            </span>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onCollected?.(item.id)}
                disabled={disabled}
                className="min-h-[48px] flex-1 rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 active:bg-green-700 disabled:opacity-50"
              >
                СОБРАН
              </button>
              <button
                type="button"
                onClick={() => onOutOfStock?.(item.id)}
                disabled={disabled}
                className="min-h-[48px] flex-1 rounded-lg bg-amber-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50"
              >
                НЕТ В НАЛИЧИИ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
