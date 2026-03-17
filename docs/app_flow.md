## Application Flow

### 1. Login

- **Route**: `app/login`
- **Responsibility**:
  - Authenticate user via Firebase Auth (email/password or other providers).
  - After successful login, load `users/{uid}` document.
  - Store the authenticated user profile globally (e.g. via React context or state store).

### 2. Orders Queue

- **Route**: `app/orders`
- **Data**:
  - Uses `getOrdersByStore(storeId)` from `orders.service.ts`.
  - Filters orders by `store_id` of the authenticated user.
  - Orders are ordered by `priority_status` and `queue_position`.
- **Behaviour**:
  - Displays the list of available orders to pick.
  - Allows the picker to open an order or start picking.

### 3. Open Order

- **Route**: `app/order/[id]`
- **Data**:
  - Loads the selected `Order` by ID.
  - Uses `getItemsByOrder(orderId)` from `items.service.ts` to fetch `OrderItem`s.
- **Behaviour**:
  - Shows order details and its items.
  - Allows user to transition into the picking view.

### 4. Picking Items

- **Route**: `app/picking/[id]`
- **Data & Services**:
  - Uses `startPicking(orderId, pickerId)` from `orders.service.ts` to mark the order as `collecting` and set `picker_id` and `picking_started_at`.
  - Uses `getItemsByOrder(orderId)` to list items.
  - Uses `collectItem(itemId)` and `markOutOfStock(itemId)` from `items.service.ts` to update individual item status and quantities.
  - Uses `updateOrderProgress(orderId)` from `picking.service.ts` to recompute `items_total`, `items_collected`, and order `status` based on item states.
- **Behaviour**:
  - Guides the picker through each item in the order.
  - Updates order progress as items are collected or marked out of stock.

### 5. Finish Order

- **Route**: `app/completed`
- **Data & Services**:
  - Uses `finishOrder(orderId)` from `orders.service.ts` to mark the order as `collected` and set `picking_finished_at`.
  - Optionally displays history of completed orders for the store/user.
- **Behaviour**:
  - Confirms that the order is fully collected (or appropriately marked as out of stock).
  - Removes the order from the active queue.

### 6. Settings

- **Route**: `app/settings`
- **Responsibility**:
  - User‑level preferences (e.g. language, theme, picking options).
  - Account details and logout (via `logout()` in `lib/auth.ts`).

