import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  increment,
  type DocumentReference,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { Order } from '../types/order';
import type { OrderItem } from '../types/orderItem';

export const ORDERS_COLLECTION = 'orders';
export const ORDER_ITEMS_COLLECTION = 'order_items';

export function getOrderDocRef(orderId: string): DocumentReference {
  const db = getFirestoreDb();
  return doc(db, ORDERS_COLLECTION, orderId);
}

export function getOrderItemDocRef(itemId: string): DocumentReference {
  const db = getFirestoreDb();
  return doc(db, ORDER_ITEMS_COLLECTION, itemId);
}

export function subscribeToQueueOrders(
  storeId: string,
  onOrders: (orders: Order[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(
    ordersRef,
    where('store_id', '==', storeId),
    where('status', 'in', ['not_started', 'collecting']),
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        order_number: data.order_number,
        store_id: data.store_id,
        order_type: data.order_type,
        order_total: data.order_total,
        items_total: data.items_total,
        items_collected: data.items_collected,
        priority_status: data.priority_status,
        queue_position: data.queue_position,
        status: data.status,
        collect_until: data.collect_until?.toDate
          ? data.collect_until.toDate()
          : data.collect_until,
        created_at: data.created_at?.toDate
          ? data.created_at.toDate()
          : data.created_at,
        picker_id: data.picker_id ?? null,
        picking_started_at: data.picking_started_at?.toDate
          ? data.picking_started_at.toDate()
          : data.picking_started_at ?? null,
        picking_finished_at: data.picking_finished_at?.toDate
          ? data.picking_finished_at.toDate()
          : data.picking_finished_at ?? null,
        comment: data.comment ?? null,
      } as Order;
    });
    orders.sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
    onOrders(orders);
  });
}

export function subscribeToCollectingOrders(
  storeId: string,
  pickerId: string,
  onOrders: (orders: Order[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(
    ordersRef,
    where('store_id', '==', storeId),
    where('picker_id', '==', pickerId),
    where('status', '==', 'collecting'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          order_number: data.order_number,
          store_id: data.store_id,
          order_type: data.order_type,
          order_total: data.order_total,
          items_total: data.items_total,
          items_collected: data.items_collected,
          priority_status: data.priority_status,
          queue_position: data.queue_position,
          status: data.status,
          collect_until: data.collect_until?.toDate ? data.collect_until.toDate() : data.collect_until,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
          picker_id: data.picker_id ?? null,
          picking_started_at: data.picking_started_at?.toDate ? data.picking_started_at.toDate() : data.picking_started_at ?? null,
          picking_finished_at: data.picking_finished_at?.toDate ? data.picking_finished_at.toDate() : data.picking_finished_at ?? null,
          comment: data.comment ?? null,
        } as Order;
      });
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',location:'firestore.ts:subscribeToCollectingOrders',message:'snapshot received',data:{storeId,pickerId,count:orders.length},timestamp:Date.now(),hypothesisId:'collecting-snapshot'})}).catch(()=>{});
      // #endregion
      onOrders(orders);
    },
    (error) => {
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',location:'firestore.ts:subscribeToCollectingOrders',message:'snapshot error',data:{storeId,pickerId,error:error.message},timestamp:Date.now(),hypothesisId:'collecting-error'})}).catch(()=>{});
      // #endregion
      onOrders([]);
    },
  );
}

export function subscribeToCompletedOrders(
  onOrders: (orders: Order[]) => void,
): Unsubscribe {
  const db = getFirestoreDb();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(
    ordersRef,
    where('status', '==', 'collected'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          order_number: data.order_number,
          store_id: data.store_id,
          order_type: data.order_type,
          order_total: data.order_total,
          items_total: data.items_total,
          items_collected: data.items_collected,
          priority_status: data.priority_status,
          queue_position: data.queue_position,
          status: data.status,
          collect_until: data.collect_until?.toDate
            ? data.collect_until.toDate()
            : data.collect_until,
          created_at: data.created_at?.toDate
            ? data.created_at.toDate()
            : data.created_at,
          picker_id: data.picker_id ?? null,
          picking_started_at: data.picking_started_at?.toDate
            ? data.picking_started_at.toDate()
            : data.picking_started_at ?? null,
          picking_finished_at: data.picking_finished_at?.toDate
            ? data.picking_finished_at.toDate()
            : data.picking_finished_at ?? null,
          comment: data.comment ?? null,
        } as Order;
      });
      const missingFinishedAtIds = orders
        .filter((o) => !o.picking_finished_at)
        .map((o) => o.id);
      if (missingFinishedAtIds.length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix',hypothesisId:'H9',location:'lib/firestore.ts:subscribeToCompletedOrders:backfillStart',message:'backfilling missing picking_finished_at for collected orders',data:{count:missingFinishedAtIds.length,orderIds:missingFinishedAtIds.slice(0,5)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        void Promise.allSettled(
          missingFinishedAtIds.map((id) =>
            updateDoc(doc(db, ORDERS_COLLECTION, id), { picking_finished_at: serverTimestamp() }),
          ),
        );
      }
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check-2',hypothesisId:'H5',location:'lib/firestore.ts:subscribeToCompletedOrders:fieldCheck',message:'completed orders field presence',data:{count:orders.length,missingPickingFinishedAtCount:missingFinishedAtIds.length,missingPickingFinishedAtIds:missingFinishedAtIds.slice(0,5)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check-3',hypothesisId:'H6',location:'lib/firestore.ts:subscribeToCompletedOrders:versionMarker',message:'instrumentation version active',data:{marker:'v2'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',location:'firestore.ts:subscribeToCompletedOrders',message:'snapshot received',data:{count:orders.length},timestamp:Date.now(),hypothesisId:'completed-snapshot'})}).catch(()=>{});
      // #endregion
      onOrders(orders);
    },
    (error) => {
      // #region agent log
      fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',location:'firestore.ts:subscribeToCompletedOrders',message:'snapshot error',data:{error:error.message},timestamp:Date.now(),hypothesisId:'completed-error'})}).catch(()=>{});
      // #endregion
      onOrders([]);
    },
  );
}

export async function fetchOrdersByStore(
  storeId: string,
  extraConstraints: QueryConstraint[] = [],
): Promise<Order[]> {
  const db = getFirestoreDb();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(
    ordersRef,
    where('store_id', '==', storeId),
    ...extraConstraints,
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      order_number: data.order_number,
      store_id: data.store_id,
      order_type: data.order_type,
      order_total: data.order_total,
      items_total: data.items_total,
      items_collected: data.items_collected,
      priority_status: data.priority_status,
      queue_position: data.queue_position,
      status: data.status,
      collect_until: data.collect_until?.toDate
        ? data.collect_until.toDate()
        : data.collect_until,
      created_at: data.created_at?.toDate
        ? data.created_at.toDate()
        : data.created_at,
      picker_id: data.picker_id ?? null,
      picking_started_at: data.picking_started_at?.toDate
        ? data.picking_started_at.toDate()
        : data.picking_started_at ?? null,
      picking_finished_at: data.picking_finished_at?.toDate
        ? data.picking_finished_at.toDate()
        : data.picking_finished_at ?? null,
      comment: data.comment ?? null,
    } as Order;
  });
}


export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const snapshot = await getDoc(orderRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    order_number: data.order_number,
    store_id: data.store_id,
    order_type: data.order_type,
    order_total: data.order_total,
    items_total: data.items_total,
    items_collected: data.items_collected,
    priority_status: data.priority_status,
    queue_position: data.queue_position,
    status: data.status,
    collect_until: data.collect_until?.toDate ? data.collect_until.toDate() : data.collect_until,
    created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
    picker_id: data.picker_id ?? null,
    picking_started_at: data.picking_started_at?.toDate
      ? data.picking_started_at.toDate()
      : data.picking_started_at ?? null,
    picking_finished_at: data.picking_finished_at?.toDate
      ? data.picking_finished_at.toDate()
      : data.picking_finished_at ?? null,
    comment: data.comment ?? null,
  } as Order;
}

export async function updateUserStoreId(uid: string, storeId: string): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { store_id: storeId }, { merge: true });
}

export async function createUserProfile(
  uid: string,
  data: { email: string; login?: string; role: string; store_id?: string },
): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      email: data.email,
      login: data.login ?? data.email,
      role: data.role,
      store_id: data.store_id ?? null,
      created_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchOrderItemsByOrder(orderId: string): Promise<OrderItem[]> {
  const db = getFirestoreDb();
  const itemsRef = collection(db, ORDER_ITEMS_COLLECTION);
  const q = query(itemsRef, where('order_id', '==', orderId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      order_id: data.order_id,
      product_id: data.product_id,
      product_image: data.product_image,
      product_name: data.product_name,
      quantity: data.quantity,
      unit: data.unit,
      quantity_collected: data.quantity_collected ?? 0,
      status: data.status,
      store_id: data.store_id ?? null,
    } as OrderItem;
  });
}

export async function markOrderAsCollecting(
  orderId: string,
  pickerId: string,
): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) {
      throw new Error('Order not found');
    }
    const data = snap.data();

    if (data.status !== 'not_started') {
      return;
    }

    transaction.update(orderRef, {
      status: 'collecting',
      picker_id: pickerId,
      picking_started_at: serverTimestamp(),
    });
  });
}

export async function markOrderAsFinished(orderId: string): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check',hypothesisId:'H1',location:'lib/firestore.ts:markOrderAsFinished:entry',message:'markOrderAsFinished invoked',data:{orderId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  await updateDoc(orderRef, {
    status: 'collected',
    picking_finished_at: serverTimestamp(),
  });

  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'picking-finished-at-check',hypothesisId:'H1',location:'lib/firestore.ts:markOrderAsFinished:exit',message:'updateDoc sent with collected and picking_finished_at',data:{orderId,writes:['status:collected','picking_finished_at:serverTimestamp']},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

export async function markOrderAsDone(orderId: string): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, { status: 'done' });
}

export async function cancelOrder(orderId: string): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, { status: 'cancelled' });
}

export async function restoreOrderToCollecting(orderId: string, pickerId: string): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    status: 'collecting',
    picker_id: pickerId,
    picking_finished_at: null,
  });
}

export async function deleteOrder(orderId: string): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await deleteDoc(orderRef);
}

export async function updateOrderItemsProgress(orderId: string): Promise<void> {
  const db = getFirestoreDb();
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const items = await fetchOrderItemsByOrder(orderId);
  const orderSnapshot = await getDoc(orderRef);

  let itemsTotal = 0;
  let itemsCollected = 0;
  let hasPending = false;
  let hasOutOfStock = false;
  let hasStartedQuantity = false;

  for (const item of items) {
    // считаем прогресс по количеству товаров (позиций), а не по единицам
    itemsTotal += 1;
    if (item.status === 'collected' || item.status === 'out_of_stock') {
      itemsCollected += 1;
    }
    if ((item.quantity_collected ?? 0) > 0) hasStartedQuantity = true;
    if (item.status === 'pending') hasPending = true;
    else if (item.status === 'out_of_stock') hasOutOfStock = true;
  }

  let status: string = 'collecting';
  const allItemsOutOfStock = itemsTotal > 0 && items.every((item) => item.status === 'out_of_stock');
  // "collecting" начинается уже с первой собранной единицы, а не только при полной позиции.
  if (itemsCollected === 0 && !hasOutOfStock && !hasStartedQuantity) {
    status = 'not_started';
  } else if (allItemsOutOfStock) {
    status = 'out_of_stock';
  } else if (itemsTotal > 0 && itemsCollected === itemsTotal && !hasPending && !hasOutOfStock) {
    status = 'collected';
  } else if (hasOutOfStock && !hasPending) {
    status = 'out_of_stock';
  }

  const currentOrderData = orderSnapshot.exists() ? orderSnapshot.data() : null;
  const hasPickingFinishedAt = Boolean(currentOrderData?.picking_finished_at);
  const updatePayload: {
    items_total: number;
    items_collected: number;
    status: string;
    picking_finished_at?: ReturnType<typeof serverTimestamp>;
  } = {
    items_total: itemsTotal,
    items_collected: itemsCollected,
    status,
  };
  if (status === 'collected' && !hasPickingFinishedAt) {
    updatePayload.picking_finished_at = serverTimestamp();
    // #region agent log
    fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix',hypothesisId:'H8',location:'lib/firestore.ts:updateOrderItemsProgress:timestampWrite',message:'setting picking_finished_at on collected transition',data:{orderId,previousStatus:currentOrderData?.status ?? null,hasPickingFinishedAt},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  await updateDoc(orderRef, updatePayload);

  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix',hypothesisId:status==='collected'?'H2':'H3',location:'lib/firestore.ts:updateOrderItemsProgress:afterUpdate',message:'order progress status persisted',data:{orderId,status,itemsTotal,itemsCollected,writes:Object.keys(updatePayload)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

export async function incrementItemCollectedQuantity(
  itemId: string,
  quantityDelta: number,
): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, ORDER_ITEMS_COLLECTION, itemId);
  await updateDoc(itemRef, {
    quantity_collected: increment(quantityDelta),
  });
}

export async function setItemStatus(
  itemId: string,
  status: 'pending' | 'collected' | 'out_of_stock',
): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, ORDER_ITEMS_COLLECTION, itemId);
  await updateDoc(itemRef, { status });
}

export async function setItemQuantityCollected(
  itemId: string,
  quantityCollected: number,
  quantityTotal: number,
): Promise<void> {
  const db = getFirestoreDb();
  const itemRef = doc(db, ORDER_ITEMS_COLLECTION, itemId);
  const clamped = Math.max(0, Math.min(quantityTotal, quantityCollected));
  const status = clamped >= quantityTotal ? 'collected' : 'pending';
  await updateDoc(itemRef, { quantity_collected: clamped, status });
}

