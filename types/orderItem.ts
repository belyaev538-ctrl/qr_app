export type OrderItemStatus = 'pending' | 'collected' | 'out_of_stock';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_image: string;
  product_name: string;
  quantity: number;
  unit: string;
  quantity_collected: number;
  status: OrderItemStatus;
  store_id?: string | null;
}

