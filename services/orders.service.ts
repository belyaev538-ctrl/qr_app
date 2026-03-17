import type { Order } from '../types/order';
import {
  fetchOrdersByStore,
  fetchOrderById,
  markOrderAsCollecting,
  markOrderAsFinished,
  markOrderAsDone as firestoreMarkOrderAsDone,
  cancelOrder as firestoreCancelOrder,
  restoreOrderToCollecting as firestoreRestoreOrderToCollecting,
  deleteOrder as firestoreDeleteOrder,
  subscribeToCollectingOrders as firestoreSubscribeToCollectingOrders,
  subscribeToCompletedOrders as firestoreSubscribeToCompletedOrders,
} from '../lib/firestore';
import { where, orderBy } from 'firebase/firestore';

export async function getOrdersByStore(storeId: string): Promise<Order[]> {
  return fetchOrdersByStore(storeId, [
    orderBy('priority_status', 'asc'),
    orderBy('queue_position', 'asc'),
  ]);
}

export async function getQueueOrders(storeId: string): Promise<Order[]> {
  return fetchOrdersByStore(storeId, [
    where('status', '==', 'not_started'),
    orderBy('queue_position', 'asc'),
  ]);
}

export async function getCollectingOrders(storeId: string, pickerId: string): Promise<Order[]> {
  return fetchOrdersByStore(storeId, [
    where('picker_id', '==', pickerId),
    where('status', '==', 'collecting'),
    orderBy('picking_started_at', 'desc'),
  ]);
}

export function subscribeToCollectingOrders(
  storeId: string,
  pickerId: string,
  onOrders: (orders: Order[]) => void,
) {
  return firestoreSubscribeToCollectingOrders(storeId, pickerId, onOrders);
}

export async function getCompletedOrders(storeId: string): Promise<Order[]> {
  return fetchOrdersByStore(storeId, [
    where('status', '==', 'collected'),
    orderBy('picking_finished_at', 'desc'),
  ]);
}

export async function getMyOrders(storeId: string, pickerId: string): Promise<Order[]> {
  // Берём все заказы магазина, дальше фильтруем по picker_id и статусу на клиенте
  return fetchOrdersByStore(storeId, []);
}

export function subscribeToCompletedOrders(
  onOrders: (orders: Order[]) => void,
) {
  return firestoreSubscribeToCompletedOrders(onOrders);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  return fetchOrderById(orderId);
}

export async function startPicking(orderId: string, pickerId: string): Promise<void> {
  await markOrderAsCollecting(orderId, pickerId);
}

export async function finishOrder(orderId: string): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix-2',hypothesisId:'H10',location:'services/orders.service.ts:finishOrder:entry',message:'finishOrder service called',data:{orderId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  await markOrderAsFinished(orderId);
  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix-2',hypothesisId:'H10',location:'services/orders.service.ts:finishOrder:exit',message:'finishOrder service resolved',data:{orderId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

export async function markOrderDone(orderId: string): Promise<void> {
  await firestoreMarkOrderAsDone(orderId);
}

export async function cancelOrder(orderId: string): Promise<void> {
  await firestoreCancelOrder(orderId);
}

export async function restoreOrderToCollecting(orderId: string, pickerId: string): Promise<void> {
  await firestoreRestoreOrderToCollecting(orderId, pickerId);
}

export async function deleteOrder(orderId: string): Promise<void> {
  await firestoreDeleteOrder(orderId);
}

