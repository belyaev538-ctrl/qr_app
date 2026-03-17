import type { OrderItem } from '../types/orderItem';
import {
  fetchOrderItemsByOrder,
  incrementItemCollectedQuantity,
  setItemStatus,
  setItemQuantityCollected,
  getOrderItemDocRef,
} from '../lib/firestore';
import { getFirestoreDb } from '../lib/firebase';
import { runTransaction } from 'firebase/firestore';

export async function getItemsByOrder(orderId: string): Promise<OrderItem[]> {
  return fetchOrderItemsByOrder(orderId);
}

export async function collectItem(itemId: string): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = getOrderItemDocRef(itemId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(itemRef);
    if (!snap.exists()) {
      throw new Error('Order item not found');
    }

    const data = snap.data();
    const quantity: number = data.quantity ?? 0;

    transaction.update(itemRef, {
      quantity_collected: quantity,
      status: 'collected',
    });
  });
}

export async function markOutOfStock(itemId: string): Promise<void> {
  await setItemStatus(itemId, 'out_of_stock');
}

export async function revertFromOutOfStock(itemId: string): Promise<void> {
  await setItemStatus(itemId, 'pending');
}

export async function setQuantityCollected(
  itemId: string,
  quantityCollected: number,
  quantityTotal: number,
): Promise<void> {
  await setItemQuantityCollected(itemId, quantityCollected, quantityTotal);
}

