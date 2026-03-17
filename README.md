## Store Order Picking System

This project is a **mobile‑first web application** for store workers to pick orders from a queue, collect items, and complete orders.

### Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **Backend**: Firebase
- **Database**: Firestore
- **Auth**: Firebase Auth

### High-Level Architecture

- `app/` – Next.js route segments (login, orders queue, order details, picking flow, completed orders, settings).
- `components/` – Reusable UI components (order cards, item cards, badges, progress indicators, etc).
- `lib/` – Firebase initialization, auth helpers, and Firestore utilities.
- `services/` – Domain‑oriented service layer for orders, items, and picking progress.
- `types/` – Shared TypeScript interfaces for orders, order items, and users.
- `docs/` – Documentation for database schema and application flow.

UI implementation will be added later; the initial focus is on **types, services, architecture, and data structures**.

