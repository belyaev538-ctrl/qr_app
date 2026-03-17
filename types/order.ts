export type OrderStatus =
  | 'not_started'
  | 'collecting'
  | 'collected'
  | 'out_of_stock'
  | 'cancelled'
  | 'done';

/** Человекочитаемые подписи статусов заказа из Firebase */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  not_started: 'Еще не собирается',
  collecting: 'Собирается',
  collected: 'Заказ собран',
  out_of_stock: 'Закончился товар',
  cancelled: 'Заказ отменён',
  done: 'Выполнен',
};

/** Получить подпись статуса по значению из Firebase */
export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export type OrderType = 'delivery' | 'pickup';

export type OrderPriorityStatus =
  | 'urgent'
  | 'collect_now'
  | 'can_start'
  | 'plenty_of_time';

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  order_type: OrderType;
  order_total: number;
  items_total: number;
  items_collected: number;
  priority_status: OrderPriorityStatus;
  queue_position: number;
  status: OrderStatus;
  collect_until: Date;
  created_at: Date;
  picker_id: string | null;
  picking_started_at: Date | null;
  picking_finished_at: Date | null;
  comment?: string | null;
}

