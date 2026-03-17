## Firestore Database Schema

### Collection: `orders`

Fields:

- **order_number**: `string` – external order identifier.
- **store_id**: `string` – reference to the store where the order is picked.
- **order_type**: `'delivery' | 'pickup'`.
- **order_total**: `number` – monetary order total.
- **items_total**: `number` – total quantity of all items in the order.
- **items_collected**: `number` – total quantity already collected.
- **priority_status**: `'urgent' | 'collect_now' | 'can_start' | 'plenty_of_time'`.
- **queue_position**: `number` – position in the picking queue for the store.
- **status**: `'not_started' | 'collecting' | 'collected' | 'out_of_stock' | 'cancelled'`.
- **collect_until**: `timestamp` – deadline for collecting the order.
- **created_at**: `timestamp` – when the order was created.
- **picker_id**: `string | null` – `users/{uid}` of the picker currently assigned.
- **picking_started_at**: `timestamp | null` – when picking started.
- **picking_finished_at**: `timestamp | null` – when picking finished.

### Collection: `order_items`

Fields:

- **order_id**: `string` – reference to `orders/{orderId}`.
- **product_id**: `string` – product identifier.
- **product_image**: `string` – URL of product image.
- **product_name**: `string` – product display name.
- **quantity**: `number` – required quantity.
- **unit**: `string` – e.g. `"pcs"`, `"kg"`.
- **quantity_collected**: `number` – quantity already collected.
- **status**: `'pending' | 'collected' | 'out_of_stock'`.

### Collection: `users`

Fields:

- **email**: `string` – user email (should match Firebase Auth).
- **login**: `string` – username/Login identifier.
- **role**: `string` – application role (e.g. `picker`, `manager`, `admin`).
- **store_id**: `string` – store the user belongs to.

